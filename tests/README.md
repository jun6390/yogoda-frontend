# Test Scope

## Commands

- `npm run test:unit`: notification reconciliation, map SDK retry, subscription validation, chat history restoration and dependent plan selection.
- `npm run test:components`: Chromium tests for notification states, shared controls, chat reconnect/retry and Markdown rendering/security.
- `npm run test:storybook`: strict accessibility checks for all registered stories in Chromium.
- `npm run test:storybook:matrix`: the same stories in light/dark themes and Korean/English locales. This is four executions per story, not four unique scenarios.
- `npm run test:e2e`: real Next.js UI, Express routes and a temporary MongoDB replica set.
- `npm run performance:measure`: Lighthouse checks against a production build on port 3200; raw results are written to the ignored `.qa/performance` directory.
- Backend: `npm test` and `npm run test:integration`.

E2E requires both repositories with dependencies installed and a Playwright Chromium binary (`npx playwright install chromium`). The backend defaults to `../../Yogoda-BE/yogoda-backend`; override `YOGODA_BE_DIR` for another layout. Ports 3100 and 8100 must be free. Existing servers are never reused.

The backend test server only binds to loopback, creates its own MongoDB replica set, and never connects to `MONGODB_URI`. Its fixture endpoint is not part of the production server. The first run may download a MongoDB binary. E2E uses `.next-e2e` so the regular dev build is not overwritten.

## Covered Browser Flows

- Protected MY route redirects without authentication; response security headers exist.
- Coupon use displays the completion toast and survives reload.
- Read-all disables after success and remains read after reload.
- An idle notification socket refreshes its access token after server-side expiry.
- Subscription addition, cancellation, reactivation and persistence after reload.
- Subscription form defaults to the local calendar date and blocks invalid fee/date inputs.
- Notification loading and fetch failure are distinct from an empty inbox; retry recovers real data.
- Notification panels fit 320px and 1280px viewports and support keyboard deletion.
- Non-admin users are redirected away from admin pages.
- Admin session logs show an empty state; dashboard errors can be retried; UI analysis renders empty data.
- Admin prompt drafts persist after reload, deploy and restore a previous version; fetch/autosave errors preserve edits and support retry.
- Plan benefit dependencies reset correctly on parent changes at 320px Korean and 1280px English/dark; the subscribed plan blocks duplicate signup.
- A comparison URL without a plan code shows an error instead of an endless skeleton.
- The return-to-chat button stays within the app boundary at 320px, 390px and 1920px.

Authentication is seeded locally for these tests. This does not verify OAuth provider login. Successful REST paths use the real test server. Error-state tests deliberately delay or replace selected responses with HTTP 503, then remove the interception to verify recovery against the real API.

## Static Cleanup Audit

- TypeScript import/reference inspection found no clearly unreferenced runtime source modules in the frontend. Ambient style and map SDK declarations are intentionally retained.
- Every declared FE and BE runtime dependency has an import reference. This checks references, not whether each dependency could be replaced or reduced.
- The public asset scan found no identical-content duplicates. The unreferenced login character image was removed; social provider icons were retained because their paths are constructed dynamically.
- FE and BE are checked with `tsc --noEmit --noUnusedLocals --noUnusedParameters`. Unused test imports were removed and unused Express callback parameters explicitly marked.
- E2E authentication setup is shared rather than copied between test suites.

These checks do not prove that every export, branch or dynamically constructed path is necessary. Chat history conversion, queued socket sending, auth hydration, plan benefit selection and plan step presentation were extracted into focused modules. Remaining large orchestration components should only be split along tested responsibilities.

## Security Changes And Limits

- Refresh tokens cannot authenticate protected APIs or notification/chat sockets.
- JWT verification pins HS256; access tokens carry a type. Valid legacy access tokens remain accepted until expiration.
- Browser auth POSTs check Origin; socket handshakes use an exact origin allowlist.
- HTTP/chat quotas and socket payload limits reduce abuse; 429 includes Retry-After.
- Basic framing, MIME-sniffing and referrer headers are enabled. The CSP is intentionally limited and is not a full script policy.
- API ownership, mission transaction rollback, duplicate reward/coupon requests and logout refresh invalidation are tested against temporary MongoDB.
- Subscription API tests verify that other users cannot update/cancel a record and invalid inputs do not create records.

Rate limits currently use process memory. Multi-instance deployments need a shared store; reverse-proxy IP handling must be configured for the actual deployment topology, not by blindly trusting every forwarded header.

## Deployed Demonstration Mode

The deployed instance is explicitly approved as a demonstration environment. Like local development, the first usage read initializes sample history when none exists. Applying a demo stage replaces that user's usage history and changes Netflix/TVING subscription states; stage 2 also creates a deduplicated recommendation notification. Do not reuse this configuration with real customer usage records. Production-mode integration tests use temporary MongoDB and stub only the external AI response.

## Not Yet Verified Or Resolved

- Live LLM recommendation quality, complete conversational signup and external OAuth/identity/payment integrations are not covered by these E2E tests.
- Direct REST plan join/change routes still need a server-owned confirmation contract. This higher-impact change is deferred at the user's request; chat stage validation alone does not secure those separate endpoints.
- Access tokens still persist in localStorage. Moving to memory/HttpOnly-backed sessions needs coordinated login, refresh and hydration changes.
- Prompt draft/deploy/restore paths are tested against the temporary database; other admin mutations, live map SDK behavior and all application-page mobile/desktop visual states are not exhaustively tested. Storybook accessibility covers registered stories, not every page state or a full WCAG audit.
- The REST confirmation contract and token-storage migration remain explicitly deferred by the user. Neither should be reported as resolved security work.
- Lighthouse covers only the public login and onboarding routes in a local production build, not production load behavior, authenticated screens or a comprehensive penetration test.
