# Failures Checklist: gemini-3.1-flash-lite

Total cases with issues: 4

## 1. `b06.jpg` (clear)
- [ ] **Detection**: Expected `bill`, got `not bill`
- [ ] **merchant**: Expected `ICHIBAN SUSHI` vs Got `null` (conf: 0.00) [SILENT (confident)]
- [ ] **date**: Expected `2024-08-19` vs Got `null` (conf: 0.00) [SILENT (confident)]
- [ ] **total**: Expected `257565` vs Got `null` (conf: 0.00) [SILENT (confident)]
- [ ] **category**: Expected `food` vs Got `null` (conf: 0.00) [SILENT (confident)]

Why (my notes): 

---

## 2. `b08.jpg` (dim)
- [ ] **merchant**: Expected `M/S G.N HOSPITALITY` vs Got `M.K HOSPITALITIES` (conf: 1.00) [SILENT (confident)]

Why (my notes): 

---

## 3. `b12.jpg` (angled)
- [ ] **date**: Expected `2023-04-06` vs Got `2023-06-04` (conf: 0.95) [CAUGHT (unsure)]

Why (my notes): 

---

## 4. `b15.jpg` (clear)
- [ ] **Detection**: Expected `bill`, got `not bill`
- [ ] **merchant**: Expected `NAWAZ CORPORATION` vs Got `null` (conf: 0.00) [SILENT (confident)]
- [ ] **date**: Expected `2026-07-01` vs Got `null` (conf: 0.00) [SILENT (confident)]
- [ ] **total**: Expected `5200.00` vs Got `null` (conf: 0.00) [SILENT (confident)]
- [ ] **category**: Expected `shopping` vs Got `null` (conf: 0.00) [SILENT (confident)]

Why (my notes): 

---
