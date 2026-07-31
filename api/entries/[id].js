import * as notion from '../_lib/notion.js'
import * as sheets from '../_lib/sheets.js'

function backendFor(source) {
  return source === 'sheets' ? sheets : notion
}

export default async function handler(req, res) {
  const source = req.query.source === 'sheets' ? 'sheets' : 'notion'
  const backend = backendFor(source)
  const { id } = req.query

  if (req.method !== 'PATCH') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const body = req.body ?? {}
    const entry =
      'archived' in body
        ? await backend.setArchived(id, body.archived)
        : await backend.updateEntry(id, body)

    res.status(200).json({ entry })
  } catch (err) {
    console.error(`[api/entries/${id}] source=${source}`, err)
    res.status(502).json({ error: '요청을 처리하지 못했습니다.' })
  }
}
