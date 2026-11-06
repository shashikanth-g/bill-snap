import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { toCSV } from './lib/csv.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const evalDir = __dirname
const imagesDir = path.join(evalDir, 'images')
const groundTruthPath = path.join(evalDir, 'ground-truth.csv')

// Ensure eval/images directory exists
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true })
}

// Do not overwrite existing ground-truth.csv
if (fs.existsSync(groundTruthPath)) {
  console.log('eval/ground-truth.csv already exists. Not overwriting.')
  process.exit(0)
}

// Look for image files in eval/images/
const validExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])
const existingFiles = fs.existsSync(imagesDir)
  ? fs
      .readdirSync(imagesDir)
      .filter((f) => validExts.has(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
  : []

let rows = []

if (existingFiles.length > 0) {
  rows = existingFiles.map((file) => {
    const isBill = file.toLowerCase().startsWith('n') ? 'no' : 'yes'
    return {
      file,
      is_bill: isBill,
      merchant: '',
      date: '',
      total: '',
      category: isBill === 'yes' ? '' : 'other',
      condition: isBill === 'yes' ? 'clean' : 'not-a-bill',
      notes: '',
    }
  })
} else {
  // Pre-fill standard template rows for 15 bills and 5 non-bills
  for (let i = 1; i <= 15; i++) {
    const num = String(i).padStart(2, '0')
    rows.push({
      file: `b${num}.jpg`,
      is_bill: 'yes',
      merchant: '',
      date: '',
      total: '',
      category: '',
      condition: 'clean',
      notes: '',
    })
  }

  for (let i = 1; i <= 5; i++) {
    const num = String(i).padStart(2, '0')
    rows.push({
      file: `n${num}.jpg`,
      is_bill: 'no',
      merchant: '',
      date: '',
      total: '',
      category: 'other',
      condition: 'not-a-bill',
      notes: '',
    })
  }
}

const headers = ['file', 'is_bill', 'merchant', 'date', 'total', 'category', 'condition', 'notes']
const csvContent = toCSV(rows, headers)
fs.writeFileSync(groundTruthPath, csvContent, 'utf-8')

console.log(`Created eval/ground-truth.csv with ${rows.length} rows.`)
console.log(`Place test photos in eval/images/ (e.g. b01.jpg .. b15.jpg, n01.jpg .. n05.jpg).`)
console.log(`Fill in values in eval/ground-truth.csv according to eval/README-labelling.md.`)

