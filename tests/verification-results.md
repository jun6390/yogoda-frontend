# Verification Record

Date: 2026-09-04. Both repositories: `fix/critical-bugfixes`, uncommitted working trees.

## Application Checks

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

The REST signup/change confirmation contract and token-storage migration remain deferred by the user. Live OAuth, external map/LLM integrations, complete conversational signup, all administrator mutations, exhaustive page visual states, load testing and a full security penetration test are not established by this record. See `README.md` in this directory for test setup and security limitations.
