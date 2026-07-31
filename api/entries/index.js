import * as notion from '../_lib/notion.js'
import * as sheets from '../_lib/sheets.js'

function backendFor(source) {
  return source === 'sheets' ? sheets : notion
}

export default async function handler(req, res) {
  const source = req.query.source === 'sheets' ? 'sheets' : 'notion'
  const backend = backendFor(source)

  try {
    if (req.method === 'GET') {
      const entries = await backend.listEntries()
      res.status(200).json({ entries })
      return
    }

    if (req.method === 'POST') {
      const entry = await backend.createEntry(req.body ?? {})
      res.status(201).json({ entry })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error(`[api/entries] source=${source}`, err)
    res.status(502).json({ error: '데이터 요청을 처리하지 못했습니다.' })
  }
}
