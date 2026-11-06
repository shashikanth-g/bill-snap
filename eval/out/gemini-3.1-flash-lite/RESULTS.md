# Evaluation Report: gemini-3.1-flash-lite

- **Date/Time**: 2026-11-06T05:41:54.310Z
- **Model**: `gemini-3.1-flash-lite`
- **Total Images**: 20
- **Scored**: 20 of 20 images
- **API Errors**: 0 (not scored)
- **Runs Evaluated**: 1
- **Average Latency**: 3062 ms
- **Max Latency**: 15313 ms

## Judging Rules
- **Exclusions**: API errors (timeout, 429, 5xx) are excluded from scoring.
- **Bill Detection**: Exact match (`yes`/`no` vs AI `is_bill`).
- **Merchant**: Case-insensitive normalized; correct if exact match, either contains other (length >= 3), or Levenshtein similarity ratio >= 0.8.
- **Date**: Exact calendar match in `YYYY-MM-DD`.
- **Total**: Number within 1.0 Rupee difference (`|pred - truth| <= 1.0`).
- **Category**: Exact case-insensitive match against standard categories.
- **Empty Ground Truth**: When truth is empty and AI returns null, it is counted as "correctly left blank", not an unnecessary flag.
- **Non-Bills**: Field evaluations are marked `n/a`.
- **Missed Bills**: Marked `WRONG` across all 4 fields.
- **Confidence Flag**: Split by source (AI confidence < 0.8 vs App rules).

## Bill Detection
- **Accuracy**: 100.0% (20/20 scored images)

| Metric | Value | Meaning |
| :--- | :--- | :--- |
| **TP** | 15 | True bills correctly recognized |
| **TN** | 5 | Non-bills correctly rejected |
| **FP** | 0 | Non-bills falsely classified as bills |
| **FN** | 0 | True bills missed as non-bills |

## Field Extraction Accuracy (True Bills)

| Field | Accuracy (All 15 True Bills) | Accuracy (Detected 15 Bills Only) |
| :--- | :--- | :--- |
| **Merchant** | 93.3% (14/15) | 93.3% (14/15) |
| **Date** | 93.3% (14/15) | 93.3% (14/15) |
| **Total** | 100.0% (15/15) | 100.0% (15/15) |
| **Category** | 100.0% (15/15) | 100.0% (15/15) |

## Detailed Image Results

| # | File | Condition | Truth | Pred | Detection | Merchant | Date | Total | Category | ms |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- | :--- | :--- | :--- | :---: |
| 1 | b01.jpg | angled | bill | bill | OK | OK (1.00) | OK (1.00) | OK (1.00) (unsure: app_rule) | OK (1.00) | 2002 |
| 2 | b02.jpg | angled | bill | bill | OK | OK (1.00) | OK (1.00) (unsure: app_rule) | OK (1.00) (unsure: app_rule) | OK (1.00) | 1421 |
| 3 | b03.jpg | angled | bill | bill | OK | OK (1.00) | OK (1.00) (unsure: app_rule) | OK (1.00) | OK (1.00) | 2036 |
| 4 | b04.jpg | dim | bill | bill | OK | OK (1.00) | OK (1.00) | OK (1.00) | OK (1.00) | 2138 |
| 5 | b05.jpg | clear | bill | bill | OK | OK (1.00) | OK (1.00) (unsure: app_rule) | OK (1.00) | OK (1.00) | 1642 |
| 6 | b06.jpg | clear | bill | bill | OK | OK (1.00) | OK (1.00) (unsure: app_rule) | OK (1.00) (unsure: app_rule) | OK (1.00) | 15313 |
| 7 | b07.jpg | clear | bill | bill | OK | OK (1.00) | OK (1.00) | OK (1.00) | OK (1.00) | 2480 |
| 8 | b08.jpg | dim | bill | bill | OK | WRONG (1.00) | OK (1.00) | OK (1.00) | OK (1.00) | 1841 |
| 9 | b09.jpg | clear | bill | bill | OK | OK (1.00) | OK (1.00) (unsure: app_rule) | OK (1.00) (unsure: app_rule) | OK (1.00) | 1561 |
| 10 | b10.jpg | clear | bill | bill | OK | OK (blank) | OK (0.95) | OK (1.00) | OK (0.50) (unsure: ai_confidence) | 1358 |
| 11 | b11.jpg | angled | bill | bill | OK | OK (1.00) | OK (1.00) | OK (1.00) | OK (1.00) | 14448 |
| 12 | b12.jpg | angled | bill | bill | OK | OK (1.00) | WRONG (0.95) (caught: app_rule) | OK (1.00) (unsure: app_rule) | OK (1.00) | 1643 |
| 13 | b13.jpg | long | bill | bill | OK | OK (1.00) | OK (0.95) (unsure: app_rule) | OK (1.00) | OK (1.00) | 1935 |
| 14 | b14.jpg | long | bill | bill | OK | OK (1.00) | OK (1.00) (unsure: app_rule) | OK (1.00) (unsure: app_rule) | OK (1.00) | 1922 |
| 15 | b15.jpg | clear | bill | bill | OK | OK (1.00) | OK (1.00) | OK (1.00) | OK (0.90) | 1601 |
| 16 | n01.jpg | other | not bill | not bill | OK | n/a | n/a | n/a | n/a | 1294 |
| 17 | n02.jpg | other | not bill | not bill | OK | n/a | n/a | n/a | n/a | 1480 |
| 18 | n03.jpg | id | not bill | not bill | OK | n/a | n/a | n/a | n/a | 1587 |
| 19 | n04.jpg | other | not bill | not bill | OK | n/a | n/a | n/a | n/a | 1641 |
| 20 | n05.jpg | screenshot | not bill | not bill | OK | n/a | n/a | n/a | n/a | 1904 |

## Confidence Honesty Analysis (Threshold = 0.8)

Categorizes every predicted field on true detected bills with flag source breakdown:
- **Total Fields Evaluated**: 60
- **Correct & Confident**: 43 (Ideal - model was right and sure)
- **Correctly Left Blank**: 1 (Model correctly returned null when ground truth was blank)
- **Caught Errors**: 1 (Safe - model error was caught and flagged for review)
  - Flagged by AI confidence (< 0.80): 0
  - Flagged by app rules (null, date age, unusual amount): 1
  - Flagged by both: 0
- **Silent Errors**: 1 (Dangerous - model made an error with high confidence)
- **Unnecessary Flags**: 14 (Inconvenient - model was correct but flagged unsure)
  - Flagged by AI confidence (< 0.80): 1
  - Flagged by app rules: 13
  - Flagged by both: 0
- **Caught Error Rate**: 50.0% of all errors caught
- **Silent Error Rate**: 50.0% of all errors went unnoticed

## Confidence Distribution

| Confidence Range | Correct Predictions | Wrong Predictions | Total |
| :--- | :---: | :---: | :---: |
| **Below 0.50** | 1 | 0 | 1 |
| **0.50 to 0.80** | 1 | 0 | 1 |
| **0.80 to 0.95** | 1 | 0 | 1 |
| **0.95 and above** | 55 | 2 | 57 |

A well-calibrated model concentrates correct predictions above 0.80 and wrong predictions below 0.80, preventing silent errors while avoiding false alarms.

## Confidence Threshold Sweep (AI Confidence Only)

Tuning the threshold over raw AI confidence scores (excluding app rules) demonstrates how confidence alone separates correct predictions from errors:

| Threshold | Caught Errors | Silent Errors | Silent Error Rate | Unnecessary Flags |
| :---: | :---: | :---: | :---: | :---: |
| 0.50 | 0 | 2 | 100.0% | 0 |
| 0.60 | 0 | 2 | 100.0% | 1 |
| 0.70 | 0 | 2 | 100.0% | 1 |
| 0.80 | 0 | 2 | 100.0% | 1 |
| 0.90 | 0 | 2 | 100.0% | 1 |
| 0.95 | 0 | 2 | 100.0% | 2 |

## Failures (2)
List of all images requiring attention. See `failures.md` for the full checklist.

### `b08.jpg` (dim)
- **merchant**: Expected `M/S G.N HOSPITALITY` | Predicted `M.K HOSPITALITIES` (1.00) [silent_error]
- Why (my notes): 

### `b12.jpg` (angled)
- **date**: Expected `2023-04-06` | Predicted `2023-06-04` (0.95) [caught_error]
- Why (my notes): 
