# Quote Pricing Test Design

## Test Strategy

Verify that the monthly premium changes correctly when quote parameters change.
Prioritize incorrect charges and failures to restore the premium after a change is reversed.

The initial scope covers coverage amounts, valuable-item coverage, a paid add-on,
deductibles and a free option. Keep billing period, start date and discounts unchanged.
Annual billing, checkout, claims and other coverage/add-on combinations are excluded.

Six focused headless Chromium tests cover the required pricing behaviors through reversible customer actions.
Separate Personal Property and Personal Liability cases exercise both coverage directions;
the remaining cases cover valuable items, paid options, deductibles and free-option invariance.

## Test Scenarios

Every test starts from the default quote in a fresh context and records baseline premium B.
Assert the selected values and saved/removed state as well as the numeric premium.

| Planned passing test | Key actions | Expected result |
| --- | --- | --- |
| Personal Property | Decrease $50k → $45k, then restore $50k. | Premium decreases, then increases back to B. |
| Personal Liability | Increase $100k → $300k, then restore $100k. | Premium increases, then decreases back to B. |
| Jewelry | Add $1,000 extra coverage; complete Add and Got it. Remove and confirm Yes. | Item/value appears and premium > B; removal clears the item and restores B. |
| Equipment Breakdown | Enable the paid add-on; disable and confirm Yes. | Checked state and premium > B when enabled; unchecked state and premium = B after removal. |
| Deductible | Change $500 → $250 → $500 → $1,000 → $2,500 → $500. | Lower deductible raises the premium; higher deductible lowers it; restoring $500 restores B. |
| Free Spouse | Add fictional Test Spouse, leaving optional email blank; remove and confirm Yes. | Saved name is shown and option checked, then name is removed and option unchecked; premium = B in both states. |

## Test Design Decisions

- **Isolation:** Use a fresh Chromium context and the [original quote URL](https://lemonade-hq.github.io/qa-interview-task/quotes/LQ42EE07089)
  for each test. Dismiss cookies, verify defaults and keep tests independent for parallel runs.
  Dispose of the context afterward. Reloading the rewritten quote route returned 404.
- **Numeric comparison:** Parse the payable monthly premium into integer cents and capture B
  per test. Validate currency and billing period separately; do not compare formatted strings
  or hardcode observed premiums as expected pricing formulas.
- **Direction and restoration:** Assert increases/decreases against the preceding numeric
  premium and exact equality with B after restoring the original selection or removing an extra.
- **Synchronization:** Use Playwright condition-based assertions for selected/saved state,
  dialog completion and the required premium relation. Do not use fixed sleeps.
- **Free Spouse limitation:** Wait for the saved name and checked state after addition;
  after confirmed removal, wait for the name to disappear and the checkbox to become unchecked.
  Compare the premium with B once each dialog closes. Save/removal responses completed,
  but no independent pricing-ready signal was found, so delayed repricing cannot be ruled out.
  Do not introduce unrelated quote changes to force repricing.
- **Primary price locator:** Use `page.locator('#gtm_button_pay_main')`.
  The ID was verified unique before, during and after repricing. It is simple and independent
  of dynamic button text, although its `gtm` prefix suggests possible analytics coupling.

## Known Issue — Loss of Use

Changing only Loss of Use produced the following monthly premiums with other inputs unchanged.
The behavior was reproduced in two independent headless browser contexts at the original URL,
using completed HTTP 200 `PATCH /coverages` responses and observed repricing.
The problematic $20k → $25k transition was also repeated within the first context.

| Loss of Use coverage | Observed monthly premium |
| --- | --- |
| $15k | $14.33 |
| $20k | $14.73 |
| $25k | $14.33 |
| $30k | $15.28 |

Increasing coverage from $20k to $25k reduces the premium by **$0.40**.
Expected: increasing coverage should not reduce the premium when other inputs remain unchanged.
The repeated observations after completed responses distinguish this from a stale post-click reading;
the root cause remains unknown.

This confirmed pricing inversion is excluded from the required passing suite.
It is a candidate for regression coverage after correction.
