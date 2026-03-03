# API_SPEC

Insight Artistico - API Contract v1

## Base URLs
- Production (current app routes): `https://<your-domain>/api`
- Local: `http://localhost:3000/api`
- Future dedicated API gateway (optional): `https://api.insightartistico.com/v1`

## Auth Model
Current MVP uses Supabase session cookies (magic link flow).

- Login request:
  - `POST /api/auth/magic-link`
- Session callback:
  - `GET /auth/callback`
- Signout:
  - `POST /api/auth/signout`

## Common Response Rules
- `200` OK
- `201` Created
- `400` Invalid request payload
- `401` Unauthenticated / invalid secret
- `403` Plan or permission insufficient
- `404` Resource not found
- `500` Internal server error

Error payload shape:

```json
{
  "error": "human_readable_message"
}
```

## Implemented Endpoints (Release 1)

### 1) Auth

#### `POST /api/auth/magic-link`
Send magic link email.

Request body:

```json
{
  "email": "artist@example.com"
}
```

Response:

```json
{
  "success": true
}
```

#### `POST /api/auth/signout`
Clear active session.

Response:

```json
{
  "success": true
}
```

### 2) Onboarding

#### `POST /api/onboarding/artist`
Link one Spotify artist to current account.

Request body:

```json
{
  "spotifyInput": "https://open.spotify.com/artist/<id> or <spotify_artist_id>"
}
```

Response:

```json
{
  "artistId": "uuid",
  "normalizedSpotifyArtistId": "spotify_artist_id"
}
```

### 3) Dashboard

#### `GET /api/dashboard/overview?range=30d`
Return latest KPI snapshot + derived metrics.

Response:

```json
{
  "snapshotDate": "2026-03-03",
  "totalStreams": 3200000,
  "monthlyListeners": 80321,
  "followers": 120345,
  "topTrackName": "Track Name",
  "weeklyGrowthPct": 12.3,
  "trendStatus": "up",
  "streamsPerListener": 2.41,
  "retentionIndexEst": 35.2,
  "engagementIndex": 26.58,
  "dataConfidence": "high",
  "plan": "free",
  "proFeaturesComingSoon": true
}
```

#### `GET /api/dashboard/tracks?range=30d`
Return ranking for latest available track snapshot in range.

Response:

```json
[
  {
    "spotifyTrackId": "track_id",
    "trackName": "Track Name",
    "rankPosition": 1,
    "trackStreamsEstimated": 500000
  }
]
```

#### `GET /api/dashboard/alerts?range=30d`
Return active/recent dashboard alerts.

Response:

```json
[
  {
    "id": "uuid",
    "snapshotDate": "2026-03-03",
    "alertType": "abnormal_growth",
    "severity": "info",
    "title": "Crescimento anormal detectado",
    "description": "Seu crescimento semanal estimado subiu 21.0%",
    "isRead": false
  }
]
```

### 4) Billing

#### `POST /api/billing/create-checkout-session`
Create Stripe checkout session for Pro plan.

Request body:

```json
{
  "priceId": "price_xxx"
}
```

Response:

```json
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/..."
}
```

#### `POST /api/stripe/webhook`
Stripe event receiver for subscription lifecycle.

Notes:
- Requires `stripe-signature` header.
- Updates `subscriptions` table and user entitlement.

Response:

```json
{
  "received": true
}
```

### 5) Internal Jobs

#### `POST /api/internal/ingest/daily`
Daily ingestion executor (called by Vercel cron).

Auth:
- `Authorization: Bearer <INGEST_CRON_SECRET>` OR
- `x-ingest-secret: <INGEST_CRON_SECRET>`

Optional request body:

```json
{
  "artistId": "uuid"
}
```

Response:

```json
{
  "processed": 10,
  "summary": {
    "success": 9,
    "skipped": 1,
    "failed": 0
  },
  "results": [
    {
      "artistId": "uuid",
      "snapshotDate": "2026-03-03",
      "status": "success"
    }
  ]
}
```

## Planned Endpoints (Phase 2+)
These are not implemented yet and exist as target contract for Spotify OAuth and advanced analytics.

### Spotify OAuth
- `GET /api/pro/connect-spotify`

### Advanced Metrics
- `GET /api/pro/artist/:spotifyId/advanced-metrics`

Planned response example:

```json
{
  "saveRate": 12.4,
  "skipRate": 18.2,
  "completionRate": 64.3,
  "topCities": [
    { "city": "Sao Paulo", "listeners": 12000 }
  ],
  "trafficSources": {
    "editorial": 23,
    "algorithmic": 41,
    "profile": 36
  }
}
```
