import { writeFile } from 'node:fs/promises'
import ExcelJS from 'exceljs'
import type { ExportCell, ExportResult } from '../../shared/reports'
import { AppError } from '../errors'
import { activeWindow, chooseSavePath } from '../utils/dialogs'
import { asObject, asText } from './validation'

const MAX_SHEETS = 10
const MAX_COLUMNS = 30
const MAX_ROWS = 50_000
const MAX_CELL_LENGTH = 1000

function safeFileName(value: unknown): string {
  const name = asText(value, 'fileName', 80).replace(/[^\p{L}\p{N} _.-]/gu, '').trim()
  if (name === '') throw new AppError('VALIDATION', 'fileName')
  return name
}

function chooseTarget(fileName: string, extension: 'xlsx' | 'pdf'): Promise<string | null> {
  return chooseSavePath(
    `${fileName}.${extension}`,
    extension === 'xlsx'
      ? { name: 'Excel', extensions: ['xlsx'] }
      : { name: 'PDF', extensions: ['pdf'] }
  )
}

function asCell(value: unknown): ExportCell {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new AppError('VALIDATION', 'cell')
    return value
  }
  if (typeof value !== 'string' || value.length > MAX_CELL_LENGTH) {
    throw new AppError('VALIDATION', 'cell')
  }
  // A leading =, +, - or @ would be run as a formula by Excel; store it as plain text.
  return /^[=+\-@]/.test(value) ? `'${value}` : value
}

// Writes the tables the renderer is showing to an .xlsx workbook.
export async function exportExcel(payload: unknown): Promise<ExportResult> {
  const input = asObject(payload)
  const fileName = safeFileName(input.fileName)
  if (!Array.isArray(input.sheets) || input.sheets.length === 0 || input.sheets.length > MAX_SHEETS) {
    throw new AppError('VALIDATION', 'sheets')
  }

  const workbook = new ExcelJS.Workbook()
  workbook.created = new Date()

  for (const rawSheet of input.sheets) {
    const sheet = asObject(rawSheet)
    const { columns, rows } = sheet
    if (!Array.isArray(columns) || columns.length === 0 || columns.length > MAX_COLUMNS) {
      throw new AppError('VALIDATION', 'columns')
    }
    if (!Array.isArray(rows) || rows.length > MAX_ROWS) throw new AppError('VALIDATION', 'rows')

    // Excel forbids these characters in sheet names and limits them to 31.
    const sheetName = asText(sheet.name, 'sheetName', 60).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31)
    const worksheet = workbook.addWorksheet(sheetName, {
      // Arabic workbook: columns run right to left.
      views: [{ rightToLeft: true, state: 'frozen', ySplit: 1 }]
    })

    worksheet.columns = columns.map((rawColumn) => {
      const column = asObject(rawColumn)
      return {
        header: asText(column.header, 'header', 100),
        width: typeof column.width === 'number' ? Math.min(Math.max(column.width, 6), 80) : 18,
        style: column.money === true ? { numFmt: '#,##0.00' } : {}
      }
    })
    worksheet.getRow(1).font = { bold: true }

    for (const rawRow of rows) {
      if (!Array.isArray(rawRow) || rawRow.length > columns.length) {
        throw new AppError('VALIDATION', 'row')
      }
      worksheet.addRow(rawRow.map(asCell))
    }
  }

  const target = await chooseTarget(fileName, 'xlsx')
  if (!target) return { saved: false, path: null }
  await workbook.xlsx.writeFile(target)
  return { saved: true, path: target }
}

// Saves the report currently on screen as a PDF, using the app's print stylesheet.
export async function exportPdf(payload: unknown): Promise<ExportResult> {
  const fileName = safeFileName(asObject(payload).fileName)
  const target = await chooseTarget(fileName, 'pdf')
  if (!target) return { saved: false, path: null }

  const data = await activeWindow().webContents.printToPDF({
    printBackground: true,
    preferCSSPageSize: true
  })
  await writeFile(target, data)
  return { saved: true, path: target }
}
