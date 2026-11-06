# Ground Truth Labelling Guide

This guide describes how to fill out `eval/ground-truth.csv` for evaluating BillSnap's AI extraction pipeline.

## 1. Directory Structure

```text
eval/
  images/              <- Store your test photos here (git-ignored)
    b01.jpg .. b15.jpg <- 15 bill photos
    n01.jpg .. n05.jpg <- 5 non-bill photos
  ground-truth.csv     <- Hand-labelled ground truth
  overrides.csv        <- (Optional) manual correctness overrides
```

## 2. Column Reference for `eval/ground-truth.csv`

| Column | Type | Allowed Values / Format | Example |
| :--- | :--- | :--- | :--- |
| `file` | string | Filename in `eval/images/` | `b01.jpg` |
| `is_bill` | string | `yes` or `no` | `yes` |
| `merchant` | string | Store/merchant name, or blank if not a bill | `Starbucks Coffee` |
| `date` | string | Real calendar date in `YYYY-MM-DD` | `2026-03-15` |
| `total` | number | Grand total in Rupees (numbers and decimals only) | `450.50` |
| `category` | string | One of: `food`, `groceries`, `utilities`, `shopping`, `health`, `transport`, `other` | `food` |
| `condition` | string | Physical capture condition of the image | `clean`, `creased`, `faded`, `dark`, `angled`, `curled`, `torn`, `handwritten`, `glare`, `not-a-bill` |
| `notes` | string | Any special details (tax invoice, handwriting, currency, etc.) | `GST receipt` |

### Condition Types
- `clean`: Flat, well-lit, sharp printed receipt
- `creased`: Folded or crumpled paper
- `faded`: Low contrast thermal print
- `dark`: Low light capture
- `angled`: Skewed or perspective distortion
- `curled`: Rolled paper or edge curvature
- `torn`: Missing edge or damaged paper
- `handwritten`: Hand-filled receipt
- `glare`: Flash reflection on paper
- `not-a-bill`: Non-receipt object (dog, landscape, document, food plate)

## 3. Ground Truth Rules
- For `is_bill = no` rows, `merchant`, `date`, and `total` should be left blank; `category` should be `other`.
- For `date`, always use 4-digit year format `YYYY-MM-DD`. If only day/month appears on the receipt, supply the calendar year from the context.
- For `total`, use the net grand total paid including taxes, without currency symbols (`₹`, `Rs.`).

## 4. Manual Overrides (`eval/overrides.csv`)

For ambiguous or fuzzy edge cases (e.g. legal company name vs popular trade name), you can add an entry in `eval/overrides.csv` to manually judge a prediction:

```csv
file,field,verdict
b01.jpg,merchant,correct
b04.jpg,category,correct
```
- `field`: one of `merchant`, `date`, `total`, `category`, `is_bill`
- `verdict`: `correct` or `wrong`

