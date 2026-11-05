// A field is shown as unsure (amber) when its confidence is below this or its value is null.
// This threshold will be tuned after evaluation.
export const UNSURE_BELOW = 0.8

// Maximum age in days before a bill date is flagged as far from today.
export const DATE_MAX_AGE_DAYS = 400

// Monetary threshold in Rupees above which an amount looks unusually large and needs a check.
export const BIG_AMOUNT = 100000
