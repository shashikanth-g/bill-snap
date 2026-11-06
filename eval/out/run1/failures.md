# Failures Checklist: gemini-3.1-flash-lite

Total cases with issues: 3

## 1. `b02.jpg` (angled)
- [ ] **Detection**: Expected `bill`, got `not bill`
- [ ] **merchant**: Expected `H&M` vs Got `null` (conf: 0.00) [SILENT (confident)]
- [ ] **date**: Expected `2025-08-29` vs Got `null` (conf: 0.00) [SILENT (confident)]
- [ ] **total**: Expected `100950` vs Got `null` (conf: 0.00) [SILENT (confident)]
- [ ] **category**: Expected `shopping` vs Got `null` (conf: 0.00) [SILENT (confident)]

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
