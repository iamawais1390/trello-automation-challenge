# Assumptions & Decisions

Running log of decisions made during this challenge, to be folded into the README.

---

## Performance testing scope

**Question asked to the recruiter:** On performance testing for the Trello endpoints, do you want per-request response time assertions inside the Playwright suite, or actual load and concurrency testing with throughput and percentiles? If it is actual load testing then I will have to use a tool outside Playwright.

**Recruiter's answer:** All of the implementation is expected to be implemented using Playwright and JavaScript. Free to use any other packages, but must mention that in the README/assumptions.

**Decision:** Performance testing is implemented as per-endpoint response-time SLA assertions inside the Playwright suite, folded directly into the functional test for each write endpoint (e.g. `POST /boards` in `boards.spec.js`) via `Assert.assertResponseTime()`, rather than a separate performance test suite. No external load-testing tool (e.g. Artillery, k6) is used.

**Why no concurrency/load test against Trello:** An earlier draft included a test that fired 15 concurrent requests at Trello's live production API to check p95 latency under load. This was removed. The SLA test is fine since it deletes the board it creates, but firing concurrent bursts at Trello's live production API just to benchmark it isn't really ours to do — it's not our infrastructure, we have no agreement with them to load-test it, and it risks tripping their abuse/rate-limit detection for no real benefit. Real load/throughput testing, if ever needed, belongs against infrastructure we own or have explicit permission to test, using a dedicated tool outside Playwright.
