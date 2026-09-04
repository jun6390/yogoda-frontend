# Verification Record

Date: 2026-09-04. Both repositories: `fix/critical-bugfixes`, uncommitted working trees.

## Application Checks

### Security Migration Follow-up (2026-09-04)

This section supersedes the earlier baseline below for changed behavior.

- FE unit/browser tests: 53 passed. BE unit tests: 14 passed. BE temporary-database integration tests: 18 passed.
- E2E: 22/23 passed in the full run; the remaining test incorrectly expected a redirect where the existing coupon UI shows a login-required state. After correcting that assertion, all 3 authentication E2E tests passed. These results cover 23 scenarios across runs, not a single all-green full run.
- An earlier admin test failed while source formatting triggered development reloads; both admin tests passed in the isolated rerun and subsequent full run.
- FE production build, FE/BE ESLint, FE TypeScript and BE TypeScript with unused checks passed. Swagger remains 59/59 documented operations.
- Access tokens are memory-only; legacy localStorage auth is removed. Refresh restores a server-verified profile using the existing HttpOnly cookie. Concurrent refresh deduplication, delayed response after logout, restoration retry, reload and expired sessions are tested.
- Direct REST join/change is retired with HTTP 410, not replaced by a new confirmation-ticket protocol. Existing server-owned chat confirmation remains the enrollment path. Legacy confirmation URLs redirect to plan detail.
- Deploy BE first, then FE. The new FE requires the added refresh profile. No commit, push or deployment was performed by this verification.
- Isolated read burst: 25 concurrent notification requests, all successful; p95 431 ms, maximum 432 ms in one local run. This is a smoke test, not deployment capacity or a load-test guarantee.
- The deployed splash, onboarding and login pages rendered without captured console warnings/errors. User reported Naver login, but the connected Codex browser remained unauthenticated; authenticated deployed behavior was not verified.
- Earlier Storybook/Lighthouse accessibility figures predate the user-requested white Naver text. They must not be presented as current all-pass accessibility results.
- Initial social-login Storybook run: Naver failed `color-contrast` (white on #03c75a, 2.25:1). Following user approval, the button background changed to #007F39 (hover #006B30), retaining white text. Default contrast is 5.13:1. The targeted rerun passed all three provider stories; no accessibility rule was disabled. The full theme/locale matrix was not rerun.

### Earlier Baseline

Latest color decision: the user requested accessible contrast again. Background #007F39 and hover #006B30 are restored with white text (default contrast 5.13:1). The intervening original-green version failed contrast; the current version uses the darker palette again.

Console cleanup follow-up: `/favicon.ico` redirects to the existing SVG and returns HTTP 200 on localhost:3000. Guest splash no longer performs a duplicate session refresh; signup result queries require authentication; default query retries exclude 401/403. Chat restoration ignores responses after unmount and avoids opening a late socket. FE unit/browser tests: 53 passed; focused auth/favicon/guest E2E: 5 passed; changed-file ESLint passed. The screenshot's anonymous `VM startTime` error was not attributed or reproduced, and WebSocket warnings during development navigation are not proven absent by these tests.

| Check                                                    | Result                  |
| -------------------------------------------------------- | ----------------------- |
| FE unit and browser component tests                      | 47 passed               |
| BE unit tests                                            | 14 passed               |
| BE temporary-MongoDB integration tests                   | 15 passed               |
| Playwright E2E                                           | 20 passed               |
| FE production build                                      | Passed                  |
| Storybook static build                                   | Passed                  |
| FE and BE TypeScript, including unused locals/parameters | Passed                  |
| FE and BE ESLint                                         | Passed                  |
| FE UI consistency audit                                  | Passed                  |
| Swagger route documentation audit                        | 59/59 operations        |
| FE and BE production dependency audit                    | 0 known vulnerabilities |

Application regression tests total 96. The two admin prompt E2E tests were also rerun successfully after adding navigation-away/back draft-cache coverage; do not count that rerun as extra scenarios. A sandboxed E2E attempt could not launch Chromium (`spawn EPERM`); the full rerun with browser execution permission passed all 20 tests.

Three production-mode usage integration tests were subsequently added and all 15 BE integration tests passed: first-read sample initialization without overwriting existing history on reload; demo stages, subscription changes, deduplicated notification and recommendation (external AI response stubbed); authentication/current-plan enforcement. The rebuilt production frontend served the demo settings page with HTTP 200 and stage controls. Live deployment and live data mutations were not performed.

## Storybook Accessibility

30 story files contain 83 registered variants. Accessibility violations fail tests rather than being marked as TODO. The matrix covers light/dark themes and Korean/English locales.

- Light/Korean: 83 passed.
- Light/English: 83 passed.
- Dark/Korean: 83 passed.
- Dark/English: 83 passed.

The final matrix command passed all four combinations in one execution: 332 variant/configuration checks, not 332 unique stories. Explicit Vite dependency prebundling was added after earlier intermittent optimizer/import failures. One successful matrix run does not establish long-term CI stability.

Storybook build warnings remain for documentation/axe bundle sizes. Isolated image stories also emit Next.js LCP advisories. Neither is a measured application performance score.

## Visual And Cleanup Evidence

- Playwright notification captures at 320px and 1280px were visually inspected; the panel stayed inside the viewport. Keyboard reveal/delete and empty state passed at both widths.
- Screenshot outputs are generated under `test-results/` by `e2e/states.spec.mjs`; they are not committed snapshots or pixel-diff baselines.
- Login and onboarding were captured and visually inspected at 390px and 1280px after the font change. Fonts loaded, no horizontal overflow was detected, and labels/buttons remained readable. These are manual visual checks, not pixel-diff tests.
- Runtime dependency import references were checked in both repositories; no clearly unreferenced runtime package was found.
- One unused login character image was removed. Dynamically referenced social icons and ambient declarations were retained. No identical public asset contents were found in the audit.

## Refactoring And Performance

- Chat history conversion, queued socket sending and shared auth hydration were extracted from large hooks. Retry preserves the original signup payload; disconnect, stop and unmount cancel queued sends. Completed request payloads are released.
- Plan benefit dependency logic and step presentation were extracted from the detail page and covered with pure-logic tests and responsive E2E checks.
- Admin draft autosave is serialized, failures preserve edits, retry/reset recover, and successful saves update the shared query cache for client-side page reentry.
- A synthetic browser test with 20 history messages and 10 streamed updates reduced Markdown parser renders from 231 to 31 (86.6%) by memoizing unchanged messages. This measures parser invocations, not total page latency or production throughput.
- Raw HTML and unsafe Markdown links are checked in a browser regression test.
- Noto Sans KR now uses one variable-weight declaration. Its generated CSS decreased from 231,544 to 77,928 bytes (66.3%); font-face declarations decreased from 372 to 124 while the number of unique font files remained 124.
- Production type checking uses `tsconfig.build.json` to exclude development/E2E-generated declarations without disabling source type checking. Corrupt stale `.next/dev/types` artifacts were removed; Next regenerates them when development starts.

### Local Lighthouse Measurement

Lighthouse 11.3.0 ran against a local production build on port 3200 with no concurrent build/test jobs. Raw JSON and captures are in the ignored `.qa/performance` directory; run `npm run build` then `npm run performance:measure` to reproduce.

| Route      | Performance | Accessibility | Best Practices | CLS | Transfer Before/After Font Change |
| ---------- | ----------- | ------------- | -------------- | --- | --------------------------------- |
| Login      | 80          | 100           | 100            | 0   | 449,538 / 395,672 bytes           |
| Onboarding | 66          | 100           | 100            | 0   | 455,704 / 402,124 bytes           |

Both final runs warned that the host CPU was slower than expected. Performance scores are diagnostic single-run values, not a stable benchmark or production guarantee. The preceding run scored 76/77, so these measurements do not establish a consistent page-speed improvement. The reproducible improvements are the smaller generated font CSS, approximately 54 KB less transfer per measured route, and reduced Markdown parsing work. Authenticated routes and real AI response latency were not measured.

## Explicit Limits

The previously deferred security work is addressed by REST enrollment retirement and in-memory access tokens, as detailed above. Live OAuth, external map/LLM integrations, complete conversational signup, all administrator mutations, exhaustive page visual states, production load testing and a full security penetration test are not established by this record. In-memory tokens do not eliminate active XSS; the readable cookie is only a routing hint. See `README.md` in this directory for setup and limitations.
