import assert from 'node:assert'
import { UNSURE_BELOW } from '../../src/lib/config.js'
import { isFieldUnsure, evaluateFields } from '../../src/lib/fieldState.js'

const today = new Date('2026-11-06T00:00:00')

// Calculate date 500 days ago relative to reference today
const date500DaysAgo = new Date(today.getTime() - 500 * 24 * 60 * 60 * 1000)
const date500DaysAgoStr = date500DaysAgo.toISOString().slice(0, 10)

// Calculate future date (4 days ahead)
const futureDate = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000)
const futureDateStr = futureDate.toISOString().slice(0, 10)

const testCases = [
  // 1. Null / empty values
  { field: 'merchant', value: null, confidence: 0.95, expectedUnsure: true, label: 'merchant null value' },
  { field: 'merchant', value: '', confidence: 0.95, expectedUnsure: true, label: 'merchant empty string' },
  { field: 'date', value: null, confidence: 0.95, expectedUnsure: true, label: 'date null value' },
  { field: 'total', value: null, confidence: 0.95, expectedUnsure: true, label: 'total null value' },
  { field: 'category', value: null, confidence: 0.95, expectedUnsure: true, label: 'category null value' },

  // 2. Confidence thresholds (0.79 vs 0.8)
  { field: 'merchant', value: 'Starbucks', confidence: 0.79, expectedUnsure: true, label: 'merchant conf 0.79 (< 0.8)' },
  { field: 'merchant', value: 'Starbucks', confidence: 0.8, expectedUnsure: false, label: 'merchant conf 0.8 (boundary ok)' },
  { field: 'date', value: '2026-11-05', confidence: 0.79, expectedUnsure: true, label: 'date conf 0.79 (< 0.8)' },
  { field: 'date', value: '2026-11-05', confidence: 0.8, expectedUnsure: false, label: 'date conf 0.8 (boundary ok)' },
  { field: 'total', value: 450.5, confidence: 0.79, expectedUnsure: true, label: 'total conf 0.79 (< 0.8)' },
  { field: 'total', value: 450.5, confidence: 0.8, expectedUnsure: false, label: 'total conf 0.8 (boundary ok)' },
  { field: 'category', value: 'food', confidence: 0.79, expectedUnsure: true, label: 'category conf 0.79 (< 0.8)' },
  { field: 'category', value: 'food', confidence: 0.8, expectedUnsure: false, label: 'category conf 0.8 (boundary ok)' },

  // 3. Date rules: future date and date 500 days old
  { field: 'date', value: futureDateStr, confidence: 0.95, expectedUnsure: true, label: 'date in future (2026-11-10)' },
  { field: 'date', value: date500DaysAgoStr, confidence: 0.95, expectedUnsure: true, label: 'date 500 days old (> 400)' },

  // 4. Total rules: total equal to 0, total above BIG_AMOUNT (100001)
  { field: 'total', value: 0, confidence: 0.95, expectedUnsure: true, label: 'total equal to 0' },
  { field: 'total', value: 100001, confidence: 0.95, expectedUnsure: true, label: 'total of 100001 (> BIG_AMOUNT)' },
  { field: 'total', value: 100000, confidence: 0.85, expectedUnsure: false, label: 'total of 100000 (boundary ok)' },

  // 5. Normal good values
  { field: 'merchant', value: 'Apollo Pharmacy', confidence: 0.95, expectedUnsure: false, label: 'normal good merchant' },
  { field: 'date', value: '2026-11-05', confidence: 0.92, expectedUnsure: false, label: 'normal good date (yesterday)' },
  { field: 'total', value: 750.25, confidence: 0.88, expectedUnsure: false, label: 'normal good total' },
  { field: 'category', value: 'groceries', confidence: 0.91, expectedUnsure: false, label: 'normal good category' },
]

console.log('Running self-test: comparing isFieldUnsure with evaluateFields...\n')

const resultsTable = []
let passedCount = 0

for (let i = 0; i < testCases.length; i++) {
  const tc = testCases[i]

  // 1. Test isFieldUnsure directly
  const directUnsure = isFieldUnsure(tc.field, tc.value, tc.confidence, UNSURE_BELOW, today)

  // 2. Test via evaluateFields with the same input
  const baseAnalysis = {
    merchant: { value: 'Default Store', confidence: 0.9 },
    date: { value: '2026-11-05', confidence: 0.9 },
    total: { value: 100, confidence: 0.9 },
    category: { value: 'food', confidence: 0.9 },
  }
  baseAnalysis[tc.field] = {
    value: tc.value,
    confidence: tc.confidence,
  }

  const evaluated = evaluateFields(baseAnalysis, today)
  const evalFieldState = evaluated[tc.field].state
  const evalUnsure = evalFieldState === 'unsure'

  // 3. Compare direct and evaluateFields results
  assert.strictEqual(
    directUnsure,
    evalUnsure,
    `Disagreement on case #${i + 1} (${tc.label}): isFieldUnsure=${directUnsure} vs evaluateFields=${evalUnsure}`
  )

  // 4. Compare with expected unsure state
  assert.strictEqual(
    directUnsure,
    tc.expectedUnsure,
    `Unexpected unsure result on case #${i + 1} (${tc.label}): got ${directUnsure}, expected ${tc.expectedUnsure}`
  )

  passedCount++
  resultsTable.push({
    '#': String(i + 1).padStart(2, '0'),
    Field: tc.field.padEnd(8),
    'Input Value': String(tc.value ?? 'null').slice(0, 16).padEnd(16),
    Conf: tc.confidence.toFixed(2),
    isFieldUnsure: directUnsure ? 'unsure' : 'ok    ',
    evaluateFields: evalFieldState.padEnd(6),
    Verdict: 'MATCH',
    Case: tc.label,
  })
}

// Print formatted test results
console.log('#  | Field    | Input Value      | Conf | isFieldUnsure | evaluateFields | Verdict | Description')
console.log('---|----------|------------------|------|---------------|----------------|---------|---------------------------------')
resultsTable.forEach((r) => {
  console.log(`${r['#']} | ${r.Field} | ${r['Input Value']} | ${r.Conf} | ${r.isFieldUnsure}        | ${r.evaluateFields}         | ${r.Verdict}   | ${r.Case}`)
})

console.log(`\nSelf-test PASSED: ${passedCount}/${testCases.length} cases matched perfectly. Zero disagreements.`)

