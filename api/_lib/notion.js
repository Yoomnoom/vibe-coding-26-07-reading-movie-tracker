const NOTION_VERSION = '2022-06-28'

function notionFetch(path, options = {}) {
  const token = process.env.NOTION_TOKEN
  return fetch(`https://api.notion.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
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

function requireEnv() {
  if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
    throw new Error('NOTION_TOKEN / NOTION_DATABASE_ID 환경변수가 설정되어 있지 않습니다.')
  }
}

export async function listEntries() {
  requireEnv()
  const res = await notionFetch(`/databases/${process.env.NOTION_DATABASE_ID}/query`, {
    method: 'POST',
    body: JSON.stringify({
      filter: { property: '상태', select: { equals: '완료' } },
      sorts: [{ property: '완료일', direction: 'descending' }],
    }),
  })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return data.results.map(pageToEntry)
}

export async function createEntry(body) {
  requireEnv()
  const res = await notionFetch('/pages', {
    method: 'POST',
    body: JSON.stringify({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        제목: { title: [{ text: { content: body.title ?? '' } }] },
        유형: { select: { name: body.type === 'movie' ? '영화' : '책' } },
        평점: { number: Number(body.rating) || 0 },
        한줄평: { rich_text: [{ text: { content: body.review ?? '' } }] },
        완료일: { date: { start: body.completedDate } },
        상태: { select: { name: '완료' } },
        커버이미지: { url: body.coverUrl || null },
      },
    }),
  })
  if (!res.ok) throw new Error(await res.text())
  return pageToEntry(await res.json())
}

export async function updateEntry(id, body) {
  requireEnv()
  const properties = {}
  if ('rating' in body) properties['평점'] = { number: Number(body.rating) || 0 }
  if ('review' in body)
    properties['한줄평'] = { rich_text: [{ text: { content: body.review ?? '' } }] }
  if ('coverUrl' in body) properties['커버이미지'] = { url: body.coverUrl || null }

  const res = await notionFetch(`/pages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ properties }),
  })
  if (!res.ok) throw new Error(await res.text())
  return pageToEntry(await res.json())
}

export async function setArchived(id, archived) {
  requireEnv()
  const res = await notionFetch(`/pages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ archived: Boolean(archived) }),
  })
  if (!res.ok) throw new Error(await res.text())
  return pageToEntry(await res.json())
}
