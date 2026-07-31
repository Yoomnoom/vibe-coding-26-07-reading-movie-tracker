import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const NOTION_VERSION = '2022-06-28'

function notionDevApiPlugin(env) {
  return {
    name: 'notion-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/entries', async (req, res) => {
        const token = env.NOTION_TOKEN
        const databaseId = env.NOTION_DATABASE_ID

        if (!token || !databaseId) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error:
                'NOTION_TOKEN / NOTION_DATABASE_ID가 .env에 설정되어 있지 않습니다.',
            }),
          )
          return
        }

        try {
          const notionRes = await fetch(
            `https://api.notion.com/v1/databases/${databaseId}/query`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Notion-Version': NOTION_VERSION,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                filter: { property: '상태', select: { equals: '완료' } },
                sorts: [{ property: '완료일', direction: 'descending' }],
              }),
            },
          )

          if (!notionRes.ok) {
            const errText = await notionRes.text()
            throw new Error(`Notion API ${notionRes.status}: ${errText}`)
          }

          const data = await notionRes.json()
          const entries = data.results.map((page) => {
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
          })

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ entries }))
        } catch (err) {
          console.error('[notion-dev-api]', err)
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Notion 데이터를 불러오지 못했습니다.' }))
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
