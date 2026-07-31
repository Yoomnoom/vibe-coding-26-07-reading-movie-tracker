import { google } from 'googleapis'

const SHEET_NAME = 'Sheet1'
const DATA_RANGE = `${SHEET_NAME}!A2:H`
const FIRST_DATA_ROW = 2

function requireEnv() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !process.env.GOOGLE_SHEET_ID) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_KEY / GOOGLE_SHEET_ID 환경변수가 설정되어 있지 않습니다.',
    )
  }
}

function getSheetsClient() {
  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

// Row layout: 제목 | 유형 | 평점 | 한줄평 | 완료일 | 상태 | 커버이미지 | 삭제됨
function rowToEntry(row, rowNumber) {
  const [title, type, rating, review, completedDate, status, coverUrl, deleted] = row
  return {
    id: `row-${rowNumber}`,
    title: title ?? '',
    type: type === '영화' ? 'movie' : 'book',
    rating: Number(rating) || 0,
    review: review ?? '',
    completedDate: completedDate ?? '',
    status: status ?? '',
    coverUrl: coverUrl ?? '',
    deleted: deleted === 'TRUE',
  }
}

function parseRowId(id) {
  const match = /^row-(\d+)$/.exec(id)
  if (!match) throw new Error(`Invalid Sheets row id: ${id}`)
  return Number(match[1])
}

async function getEntryByRow(sheets, spreadsheetId, rowNumber) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A${rowNumber}:H${rowNumber}`,
  })
  const { deleted, ...entry } = rowToEntry(res.data.values?.[0] ?? [], rowNumber)
  return entry
}

export async function listEntries() {
  requireEnv()
  const sheets = getSheetsClient()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID

  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: DATA_RANGE })
  const rows = res.data.values ?? []

  return rows
    .map((row, i) => rowToEntry(row, i + FIRST_DATA_ROW))
    .filter((e) => e.status === '완료' && !e.deleted)
    .map(({ deleted, ...entry }) => entry)
    .sort((a, b) => b.completedDate.localeCompare(a.completedDate))
}

export async function createEntry(body) {
  requireEnv()
  const sheets = getSheetsClient()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID

  const values = [
    [
      body.title ?? '',
      body.type === 'movie' ? '영화' : '책',
      Number(body.rating) || 0,
      body.review ?? '',
      body.completedDate ?? '',
      '완료',
      body.coverUrl ?? '',
      '',
    ],
  ]

  const res = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_NAME}!A:H`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values },
  })

  const updatedRange = res.data.updates.updatedRange // e.g. "Sheet1!A5:H5"
  const rowNumber = Number(/![A-Z]+(\d+)/.exec(updatedRange)[1])
  const { deleted, ...entry } = rowToEntry(values[0], rowNumber)
  return entry
}

async function updateRowCells(sheets, spreadsheetId, rowNumber, updates) {
  const data = Object.entries(updates).map(([col, value]) => ({
    range: `${SHEET_NAME}!${col}${rowNumber}`,
    values: [[value]],
  }))
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: 'USER_ENTERED', data },
  })
}

export async function updateEntry(id, body) {
  requireEnv()
  const sheets = getSheetsClient()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  const rowNumber = parseRowId(id)

  const updates = {}
  if ('rating' in body) updates.C = Number(body.rating) || 0
  if ('review' in body) updates.D = body.review ?? ''
  if ('coverUrl' in body) updates.G = body.coverUrl ?? ''

  await updateRowCells(sheets, spreadsheetId, rowNumber, updates)
  return getEntryByRow(sheets, spreadsheetId, rowNumber)
}

export async function setArchived(id, archived) {
  requireEnv()
  const sheets = getSheetsClient()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  const rowNumber = parseRowId(id)

  await updateRowCells(sheets, spreadsheetId, rowNumber, { H: archived ? 'TRUE' : '' })
  return getEntryByRow(sheets, spreadsheetId, rowNumber)
}
