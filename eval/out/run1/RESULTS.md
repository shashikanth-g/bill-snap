# Evaluation Report: gemini-3.1-flash-lite

- **Date/Time**: 2026-11-06T05:18:43.121Z
- **Model**: `gemini-3.1-flash-lite`
- **Total Images**: 20
- **API Errors**: 1
- **Runs Evaluated**: 1
- **Average Latency**: 5572 ms
- **Max Latency**: 19951 ms

## Judging Rules
- **Bill Detection**: Exact match (`yes`/`no` vs AI `is_bill`).
- **Merchant**: Case-insensitive normalized; correct if exact match, either contains other (length >= 3), or Levenshtein similarity ratio >= 0.8.
- **Date**: Exact calendar match in `YYYY-MM-DD`.
- **Total**: Number within 1.0 Rupee difference (`|pred - truth| <= 1.0`).
- **Category**: Exact case-insensitive match against standard categories.
- **Non-Bills**: Field evaluations are marked `n/a`.
- **Missed Bills**: Marked `WRONG` across all 4 fields.
- **Confidence Flag**: Marked unsure if confidence < 0.8, value is null, date is future/stale (>400 days), or total is 0 or >100,000.

## Bill Detection
- **Accuracy**: 95.0% (19/20)

| Metric | Value | Meaning |
| :--- | :--- | :--- |
| **TP** | 14 | True bills correctly recognized |
| **TN** | 5 | Non-bills correctly rejected |
| **FP** | 0 | Non-bills falsely classified as bills |
| **FN** | 1 | True bills missed as non-bills |

## Field Extraction Accuracy (True Bills)

| Field | Accuracy (All ${trueBillsCount} True Bills) | Accuracy (Detected ${confusion.tp} Bills Only) |
| :--- | :--- | :--- |
| **Merchant** | 86.7% (13/15) | 92.9% (13/14) |
| **Date** | 86.7% (13/15) | 92.9% (13/14) |
| **Total** | 93.3% (14/15) | 100.0% (14/14) |
| **Category** | 93.3% (14/15) | 100.0% (14/14) |

## Detailed Image Results

| # | File | Condition | Truth | Pred | Detection | Merchant | Date | Total | Category | ms |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- | :--- | :--- | :--- | :---: |
| 1 | b01.jpg | angled | bill | bill | OK | OK (1.00) | OK (1.00) | OK (1.00) | OK (1.00) | 2513 |
| 2 | b02.jpg | angled | bill | not bill | WRONG | WRONG (0.00) | WRONG (0.00) | WRONG (0.00) | WRONG (0.00) | - |
| 3 | b03.jpg | angled | bill | bill | OK | OK (1.00) | OK (1.00) | OK (1.00) | OK (1.00) | 4599 |
| 4 | b04.jpg | dim | bill | bill | OK | OK (1.00) | OK (1.00) | OK (1.00) | OK (1.00) | 5965 |
| 5 | b05.jpg | clear | bill | bill | OK | OK (1.00) | OK (1.00) | OK (1.00) | OK (1.00) | 3237 |
| 6 | b06.jpg | clear | bill | bill | OK | OK (1.00) | OK (1.00) | OK (1.00) | OK (1.00) | 2136 |
| 7 | b07.jpg | clear | bill | bill | OK | OK (1.00) | OK (1.00) | OK (1.00) | OK (1.00) | 9199 |
| 8 | b08.jpg | dim | bill | bill | OK | WRONG (1.00) | OK (1.00) | OK (1.00) | OK (1.00) | 19951 |
| 9 | b09.jpg | clear | bill | bill | OK | OK (1.00) | OK (1.00) | OK (1.00) | OK (1.00) | 2394 |
| 10 | b10.jpg | clear | bill | bill | OK | OK (0.00) | OK (0.95) | OK (1.00) | OK (0.50) | 7371 |
| 11 | b11.jpg | angled | bill | bill | OK | OK (1.00) | OK (1.00) | OK (1.00) | OK (1.00) | 1966 |
| 12 | b12.jpg | angled | bill | bill | OK | OK (1.00) | WRONG (0.95) (unsure flag) | OK (1.00) | OK (1.00) | 2307 |
| 13 | b13.jpg | long | bill | bill | OK | OK (1.00) | OK (0.95) | OK (1.00) | OK (1.00) | 2598 |
| 14 | b14.jpg | long | bill | bill | OK | OK (1.00) | OK (1.00) | OK (1.00) | OK (1.00) | 2856 |
| 15 | b15.jpg | clear | bill | bill | OK | OK (1.00) | OK (1.00) | OK (1.00) | OK (0.90) | 3668 |
| 16 | n01.jpg | other | not bill | not bill | OK | n/a | n/a | n/a | n/a | 14786 |
| 17 | n02.jpg | other | not bill | not bill | OK | n/a | n/a | n/a | n/a | 2630 |
| 18 | n03.jpg | id | not bill | not bill | OK | n/a | n/a | n/a | n/a | 8560 |
| 19 | n04.jpg | other | not bill | not bill | OK | n/a | n/a | n/a | n/a | 6918 |
| 20 | n05.jpg | screenshot | not bill | not bill | OK | n/a | n/a | n/a | n/a | 2210 |

## Confidence Honesty Analysis (Threshold = 0.8)

Categorizes every predicted field on true detected bills:
- **Total Fields Evaluated**: 56
- **Correct & Confident**: 41 (Ideal - model was right and sure)
- **Caught Errors**: 1 (Safe - model made an error but flagged unsure, prompting review)
- **Silent Errors**: 1 (Dangerous - model made an error with high confidence)
- **Unnecessary Flags**: 13 (Inconvenient - model was correct but flagged unsure)
- **Caught Error Rate**: 50.0% of all errors caught
- **Silent Error Rate**: 50.0% of all errors went unnoticed

## Confidence Threshold Sweep

Tuning the `UNSURE_BELOW` threshold reveals the trade-off between safety (catching errors) and convenience (avoiding false alarms):

| Threshold | Caught Errors | Silent Errors | Silent Error Rate | Unnecessary Flags |
| :---: | :---: | :---: | :---: | :---: |
| 0.50 | 1 | 1 | 50.0% | 12 |
| 0.60 | 1 | 1 | 50.0% | 13 |
| 0.70 | 1 | 1 | 50.0% | 13 |
| 0.80 | 1 | 1 | 50.0% | 13 |
| 0.90 | 1 | 1 | 50.0% | 13 |
| 0.95 | 1 | 1 | 50.0% | 14 |

## Failures (3)
List of all images requiring attention. See `failures.md` for the full checklist.

### `b02.jpg` (angled)
- **Detection Error**: Expected bill, got not bill
- **merchant**: Expected `H&M` | Predicted `null` (0.00) [missed_bill]
- **date**: Expected `2025-08-29` | Predicted `null` (0.00) [missed_bill]
- **total**: Expected `100950` | Predicted `null` (0.00) [missed_bill]
- **category**: Expected `shopping` | Predicted `null` (0.00) [missed_bill]
- Why (my notes): 

### `b08.jpg` (dim)
- **merchant**: Expected `M/S G.N HOSPITALITY` | Predicted `M.K HOSPITALITIES` (1.00) [silent_error]
- Why (my notes): 

### `b12.jpg` (angled)
- **date**: Expected `2023-04-06` | Predicted `2023-06-04` (0.95) [caught_error]
- Why (my notes): 
