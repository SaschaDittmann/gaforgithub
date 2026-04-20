---
date: 2026-04-20
topic: GA4 Measurement Protocol migration
---

# Migrating from Universal Analytics to GA4 Measurement Protocol

## The Problem / Context
The gaforgithub project used Universal Analytics (UA) Measurement Protocol (`/collect` endpoint) which was sunset by Google in July 2023, making the tracking beacon non-functional. Needed to migrate to GA4 Measurement Protocol.

## The Solution / Learning

### GA4 Measurement Protocol Key Differences from UA

1. **Endpoint**: `https://www.google-analytics.com/mp/collect` (was `/collect`)
2. **Authentication**: Requires both `measurement_id` and `api_secret` as **query parameters** in the URL (UA only needed `tid` in the payload)
3. **Payload format**: JSON body with `client_id` at top level and `events[]` array (UA used URL-encoded form parameters)
4. **Event structure**: `{ name: "page_view", params: { page_location, ... } }` — no more `t=pageview` / `dp=/path` params
5. **IP anonymization**: GA4 handles IP anonymization by default. The UA `aip=1` parameter doesn't exist. To prevent any IP-based processing, simply **omit the IP** from the payload entirely.
6. **Engagement time**: Include `engagement_time_msec` in event params for proper session attribution in GA4 reports.
7. **Content-Type**: Must be `application/json` (UA used URL-encoded form data).

### Environment Variable Changes
- `PROPERTY_ID` (UA-XXXX-Y) → `GA_MEASUREMENT_ID` (G-XXXXXXXXXX)
- New: `GA_API_SECRET` (generated in GA4 Admin → Data Streams → Measurement Protocol API secrets)

### Testing Strategy
- Extract payload construction into a pure function (`buildGA4Payload`) for easy unit testing without mocking HTTP calls
- Mock `globalThis.fetch` in retry tests to verify retry behavior without real network calls
- Use `beforeEach`/`afterEach` to save/restore `process.env` for IP anonymization tests
