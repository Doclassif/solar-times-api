# Solar Times API

[![npm version](https://img.shields.io/npm/v/solar-times-api.svg)](https://www.npmjs.com/package/solar-times-api)
[![npm downloads](https://img.shields.io/npm/dm/solar-times-api.svg)](https://www.npmjs.com/package/solar-times-api)
[![live page](https://img.shields.io/badge/live-github_pages-2ea44f.svg)](https://doclassif.github.io/solar-times-api/)
[![demo](https://img.shields.io/badge/demo-preview-blue.svg)](https://doclassif.github.io/solar-times-api/?preview=1)

Reusable Node.js API and npm package for sunrise and sunset calculations based on the NOAA sunrise/sunset algorithm.

Live page: https://doclassif.github.io/solar-times-api/
Demo (preview mode): https://doclassif.github.io/solar-times-api/?preview=1

- Zenith: `90.833` (official zenith, includes atmospheric refraction and solar radius)
- Response formats: `json`, `xml`, `csv`, `html`
- Returned format: `ISO-8601` with configurable UTC offset (`Z` by default)

## Run

```bash
npm start
```

Default server URL: `http://localhost:3000`.

## GitHub Pages

GitHub Pages URL:

- `https://doclassif.github.io/solar-times-api/`

By default, this URL returns API-like raw output based on query params.

Use preview mode (`preview=1`) to open the interactive page.

Examples:

- `https://doclassif.github.io/solar-times-api/?from=2026-03-01&to=2026-03-03&lat=55.7558&lon=37.6173&utcOffset=3&format=json`
- `https://doclassif.github.io/solar-times-api/?from=2026-03-01&to=2026-03-03&lat=55.7558&lon=37.6173&utcOffset=3&format=json&preview=1`
- `https://doclassif.github.io/solar-times-api/?from=2026-03-01&to=2026-03-03&lat=55.7558&lon=37.6173&utcOffset=3&format=json&apiBase=https://your-api.example.com`

Note: GitHub Pages is static hosting, so Node.js backend endpoints are not hosted there.  
If you have an external API, pass `apiBase=https://your-api.example.com` in the URL.

## Use as npm package

Install:

```bash
npm install solar-times-api
```

CommonJS:

```js
const { calculateRange } = require('solar-times-api');

const result = calculateRange(
  new Date('2026-03-01T00:00:00.000Z'),
  new Date('2026-03-03T00:00:00.000Z'),
  53.9045,
  27.5615
);

console.log(result);
```

ESM:

```js
import { calculateSolarTimesForDate } from 'solar-times-api';

const oneDay = calculateSolarTimesForDate(
  new Date('2026-03-02T00:00:00.000Z'),
  53.9045,
  27.5615
);

console.log(oneDay);
```

Available exports:

- `OFFICIAL_ZENITH`
- `calculateSolarTimesForDate(date, latitude, longitude)`
- `calculateRange(fromDate, toDate, latitude, longitude)`
- `toJson(payload)`
- `toXml(payload)`
- `toCsv(payload)`
- `toHtml(payload)`

Run as CLI server after global install:

```bash
npm install -g solar-times-api
solar-times-api
```

## Endpoint

`GET /solar-times`

### Query parameters

- `from` or `c` or `с`: start date (`YYYY-MM-DD`)
- `to` or `po` or `по`: end date (`YYYY-MM-DD`)
- `lat` or `latitude`: latitude (`-90..90`)
- `lon` or `longitude`: longitude (`-180..180`)
- `utcOffset` or `utc`: output offset (`Z`, `UTC`, `1`, `-3`, `03:00`, `-05:30`; default `Z`)
- `format`: `json` (default), `xml`, `csv`, or `html`

## Examples

### JSON

```bash
curl "http://localhost:3000/solar-times?from=2026-03-01&to=2026-03-03&lat=55.7558&lon=37.6173&format=json"
```

### JSON with custom UTC offset

```bash
curl "http://localhost:3000/solar-times?from=2026-03-01&to=2026-03-03&lat=55.7558&lon=37.6173&utcOffset=3&format=json"
```

### XML

```bash
curl "http://localhost:3000/solar-times?c=2026-03-01&po=2026-03-03&lat=55.7558&lon=37.6173&format=xml"
```

### CSV

```bash
curl "http://localhost:3000/solar-times?from=2026-03-01&to=2026-03-03&lat=55.7558&lon=37.6173&format=csv"
```

### HTML

```bash
curl "http://localhost:3000/solar-times?from=2026-03-01&to=2026-03-03&lat=55.7558&lon=37.6173&format=html"
```

### Healthcheck

```bash
curl "http://localhost:3000/health"
```

## Algorithm (NOAA)

The implementation follows the NOAA sunrise/sunset method:

1. Compute day-of-year `N`.
2. Compute approximate solar time `t` for sunrise/sunset using longitude.
3. Compute Sun mean anomaly `M`.
4. Compute Sun true longitude `L`.
5. Compute right ascension `RA` and declination (`sinDec`, `cosDec`).
6. Compute local hour angle `H` using zenith `90.833°`.
7. Compute local mean time and convert to UTC.

If `cosH > 1` or `cosH < -1`, sunrise or sunset does not occur on that date/location (polar day/night), so API returns `null`.

## Accuracy and Comparison

Computed values can differ from other websites because of:

- different atmospheric models and refraction adjustments;
- event definition differences (solar center vs. top limb);
- rounding to minute/second precision;
- observer elevation assumptions;
- local display/timezone handling.

Expected practical deviation is usually seconds up to about one minute under standard conditions.

## GitHub Actions (CI)

Workflow file: `.github/workflows/ci.yml`.

CI behavior:

- runs on `push` and `pull_request`;
- tests Node.js `18`, `20`, `22`;
- runs `npm ci`;
- runs `npm run check` (syntax checks).

Local check:

```bash
npm run check
```

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).

## Publish to npm

1. Make package name unique (if `solar-times-api` is already taken, use scoped name like `@your-scope/solar-times-api`).
2. Login: `npm login`
3. Version bump: `npm version patch` (or `minor`/`major`)
4. Publish: `npm publish --access public`
