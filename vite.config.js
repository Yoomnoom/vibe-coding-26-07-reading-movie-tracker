import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const NOTION_VERSION = '2022-06-28'

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => (raw += chunk))
    req.on('end', () => {
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function pageToEntry(page) {
  const p = page.properties
  return {
    id: page.id,
    title: p['제목']?.title?.[0]?.plain_text ?? '',
    type: p['유형']?.select?.name === '영화' ? 'movie' : 'book',
    rating: p['평점']?.number ?? 0,
    review: p['한줄평']?.rich_text?.[0]?.plain_text ?? '',
    completedDate: p['완료일']?.date?.start ?? '',
    status: p['상태']?.select?.name ?? '',
    coverUrl: p['커버이미지']?.url ?? '',
  }
}

function notionDevApiPlugin(env) {
  const token = env.NOTION_TOKEN
  const databaseId = env.NOTION_DATABASE_ID

  const notionFetch = (path, options = {}) =>
    fetch(`https://api.notion.com/v1${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

  return {
    name: 'notion-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/entries', async (req, res) => {
        if (!token || !databaseId) {
          sendJson(res, 500, {
            error: 'NOTION_TOKEN / NOTION_DATABASE_ID가 .env에 설정되어 있지 않습니다.',
          })
          return
        }

        // req.url is relative to the /api/entries mount point, e.g. "/" or "/<page-id>"
        const pageId = req.url.replace(/^\/+/, '').split('?')[0] || null

        try {
          if (req.method === 'GET' && !pageId) {
            const notionRes = await notionFetch(
              `/databases/${databaseId}/query`,
              {
                method: 'POST',
                body: JSON.stringify({
                  filter: { property: '상태', select: { equals: '완료' } },
                  sorts: [{ property: '완료일', direction: 'descending' }],
                }),
              },
            )
            if (!notionRes.ok) throw new Error(await notionRes.text())
            const data = await notionRes.json()
            sendJson(res, 200, { entries: data.results.map(pageToEntry) })
            return
          }

          if (req.method === 'POST' && !pageId) {
            const body = await readJsonBody(req)
            const notionRes = await notionFetch('/pages', {
              method: 'POST',
              body: JSON.stringify({
                parent: { database_id: databaseId },
                properties: {
                  제목: { title: [{ text: { content: body.title ?? '' } }] },
                  유형: {
                    select: { name: body.type === 'movie' ? '영화' : '책' },
                  },
                  평점: { number: Number(body.rating) || 0 },
                  한줄평: {
                    rich_text: [{ text: { content: body.review ?? '' } }],
                  },
                  완료일: { date: { start: body.completedDate } },
                  상태: { select: { name: '완료' } },
                  커버이미지: { url: body.coverUrl || null },
                },
              }),
            })
            if (!notionRes.ok) throw new Error(await notionRes.text())
            const page = await notionRes.json()
            sendJson(res, 201, { entry: pageToEntry(page) })
            return
          }

          if (req.method === 'PATCH' && pageId) {
            const body = await readJsonBody(req)
            const properties = {}
            if ('rating' in body) properties['평점'] = { number: Number(body.rating) || 0 }
            if ('review' in body)
              properties['한줄평'] = {
                rich_text: [{ text: { content: body.review ?? '' } }],
              }
            if ('coverUrl' in body)
              properties['커버이미지'] = { url: body.coverUrl || null }

            const patchBody = { ...(body.archived !== undefined ? { archived: body.archived } : {}) }
            if (Object.keys(properties).length > 0) patchBody.properties = properties

            const notionRes = await notionFetch(`/pages/${pageId}`, {
              method: 'PATCH',
              body: JSON.stringify(patchBody),
            })
            if (!notionRes.ok) throw new Error(await notionRes.text())
            const page = await notionRes.json()
            sendJson(res, 200, { entry: pageToEntry(page) })
            return
          }

          sendJson(res, 404, { error: 'Not found' })
        } catch (err) {
          console.error('[notion-dev-api]', err)
          sendJson(res, 502, { error: 'Notion 요청을 처리하지 못했습니다.' })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), notionDevApiPlugin(env)],
  }
})
