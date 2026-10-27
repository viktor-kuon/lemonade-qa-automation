# Lemonade Quote Pricing Automation

## Overview

Playwright + TypeScript E2E tests for monthly premium changes in the
[Lemonade quote application](https://lemonade-hq.github.io/qa-interview-task/quotes/LQ42EE07089).
The suite checks price direction, saved selections and restoration after reversible changes.

## Test Coverage

| Scenario | Pricing behavior |
| --- | --- |
| Personal Property | Decrease coverage, verify a lower premium, then restore the baseline. |
| Personal Liability | Increase coverage, verify a higher premium, then restore the baseline. |
| Jewelry | Add default $1,000 extra coverage, verify an increase, then remove it and restore the baseline. |
| Equipment Breakdown | Enable the paid add-on, verify an increase, then disable it and restore the baseline. |
| Deductible | Verify inverse price direction across deductible values and exact baseline restoration. |
| Free Spouse | Save and remove fictional spouse details; verify unchanged premium at completed UI states. |

The default suite runs **eight executions across two projects**: all six scenarios on
Desktop Chromium (`chromium`), plus Personal Property and Jewelry on emulated Pixel 7 (`pixel-7`).
See [test design](docs/test-design.md) for scenarios, synchronization choices and known issues.

## Getting Started

Use **Node.js 24** and npm. From the repository root of a clean checkout:

```sh
npm ci
npx playwright install chromium
```

On Linux, install Chromium together with its required system dependencies instead:

```sh
npx playwright install --with-deps chromium
```

Tests run against the hosted application and require internet access.

## Running Tests

| Purpose | Command |
| --- | --- |
| Full suite | `npm test` |
| Desktop Chromium | `npm test -- --project=chromium` |
| Pixel 7 mobile smoke | `npm test -- --project=pixel-7` |
| Targeted desktop spec | `npm test -- tests/personal-property.spec.ts --project=chromium` |
| Headed execution | `npm test -- --headed` |
| Debug desktop tests with Inspector | `npm run test:debug -- --project=chromium` |
| Playwright UI mode | `npm run test:ui` |
| Typechecking | `npm run typecheck` |
| Open HTML report after a test run | `npm run test:report` |

Tests run headlessly by default with zero retries. HTML reports are written to
`playwright-report/` and do not open automatically. Failure screenshots and traces
are retained in `test-results/`. Both generated directories are ignored by Git.

## Project Structure

```text
.
├── pages/QuotePage.ts        # Locators, navigation and UI workflows
├── tests/                   # Six business scenarios and their assertions
├── docs/test-design.md      # Scope, test design and known pricing issue
├── .github/workflows/ci.yaml # GitHub Actions workflow
├── playwright.config.ts     # Projects, execution settings and reporters
├── tsconfig.json            # Typechecking configuration
├── package.json             # npm scripts and development dependencies
└── package-lock.json        # Locked dependencies for reproducible installation
```

## CI

The [GitHub Actions workflow](.github/workflows/ci.yaml) runs on pushes to `main`,
pull requests targeting `main`, and manual dispatch.
It uses Ubuntu, Node.js 24 and npm caching, runs `npm ci`, installs Chromium with
Linux dependencies, typechecks, and executes both projects with one worker.

Available `playwright-report/` and `test-results/` directories are uploaded as the
`playwright-results` artifact for seven days, including after test failures unless cancelled.

## Design Decisions and Limitations

- One cohesive `QuotePage` owns locators and UI interactions. Business assertions stay in specs.
- Premium text is validated and parsed into integer cents. Tests compare captured baselines
  and price direction without hardcoded quote premiums, deltas or pricing formulas.
- Each test uses Playwright's built-in `page` fixture with a fresh browser context and
  the original quote URL, keeping scenarios independent and suitable for parallel execution.
- Synchronization uses observable selected/saved states, dialog completion and price polling.
  Tests use no fixed sleeps and run with retries disabled.
- Desktop Chromium runs all six scenarios. Pixel 7 covers two emulated mobile smoke flows;
  Jewelry keeps the default $1,000 value. Custom-value editing and focused-input touch
  behavior are outside this smoke coverage.
- Increasing Loss of Use can reduce the premium. This known inversion is excluded from
  the passing suite; see [test design](docs/test-design.md) for reproduction evidence.
- Free Spouse equality is checked after acknowledged operations and saved/removed UI states.
  No independent pricing-ready signal exists, so delayed repricing cannot be ruled out.
- Firefox and WebKit are excluded from the supported CI matrix after exploratory validation
  encountered Firefox launch and WebKit quote-bootstrap blockers.
