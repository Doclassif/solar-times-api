#!/usr/bin/env node

const http = require('http');
const { URL } = require('url');
const { calculateRange, OFFICIAL_ZENITH } = require('./solarTimes');
const { toJson, toXml, toCsv, toHtml } = require('./formatters');

const PORT = process.env.PORT || 3000;

function parseUtcOffset(value) {
  if (!value) {
    return { minutes: 0, label: 'Z' };
  }

  const raw = value.trim().toUpperCase();

  if (raw === 'Z' || raw === 'UTC' || raw === '+00:00' || raw === '-00:00') {
    return { minutes: 0, label: 'Z' };
  }

  const match = raw.match(/^([+-]?)(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) return null;

  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number(match[2]);
  const mins = match[3] ? Number(match[3]) : 0;
  if (hours > 14 || mins > 59) return null;
  if (hours === 14 && mins !== 0) return null;

  const totalMinutes = sign * (hours * 60 + mins);
  return {
    minutes: totalMinutes,
    label: `${sign === 1 ? '+' : '-'}${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
  };
}

function toOffsetIso(utcIso, offset) {
  if (!utcIso) return null;

  const date = new Date(utcIso);
  if (Number.isNaN(date.getTime())) return null;

  const shifted = new Date(date.getTime() + offset.minutes * 60000);
  const base = shifted.toISOString().slice(0, 19);
  return offset.label === 'Z' ? `${base}Z` : `${base}${offset.label}`;
}

function applyOffsetToResults(results, offset) {
  if (offset.minutes === 0) {
    return results;
  }

  return results.map((item) => ({
    ...item,
    sunrise: toOffsetIso(item.sunrise, offset),
    sunset: toOffsetIso(item.sunset, offset)
  }));
}

function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function send(res, statusCode, body, contentType = 'application/json; charset=utf-8') {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(body);
}

function badRequest(res, message, format) {
  const payload = { error: message };
  if (format === 'xml') {
    send(
      res,
      400,
      `<?xml version="1.0" encoding="UTF-8"?>\n<error>${message}</error>`,
      'application/xml; charset=utf-8'
    );
    return;
  }
  if (format === 'csv') {
    send(res, 400, `error\n"${message.replace(/"/g, '""')}"\n`, 'text/csv; charset=utf-8');
    return;
  }
  if (format === 'html') {
    send(res, 400, `<h1>Bad Request</h1><p>${message}</p>`, 'text/html; charset=utf-8');
    return;
  }
  send(res, 400, JSON.stringify(payload, null, 2));
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && parsedUrl.pathname === '/health') {
    return send(res, 200, JSON.stringify({ status: 'ok' }, null, 2));
  }

  if (req.method !== 'GET' || parsedUrl.pathname !== '/solar-times') {
    return send(res, 404, JSON.stringify({ error: 'Not found' }, null, 2));
  }

  const search = parsedUrl.searchParams;
  const fromRaw = search.get('from') || search.get('c') || search.get('с');
  const toRaw = search.get('to') || search.get('po') || search.get('по');
  const latRaw = search.get('lat') || search.get('latitude');
  const lonRaw = search.get('lon') || search.get('longitude');
  const utcOffsetRaw = search.get('utcOffset') || search.get('utc');
  const format = (search.get('format') || 'json').toLowerCase();

  if (!['json', 'xml', 'csv', 'html'].includes(format)) {
    return badRequest(res, 'Unsupported format. Use json, xml, csv, or html.', 'json');
  }

  if (!fromRaw || !toRaw || !latRaw || !lonRaw) {
    return badRequest(
      res,
      'Required query params: from (or c), to (or po), lat (or latitude), lon (or longitude).',
      format
    );
  }

  const from = parseDate(fromRaw);
  const to = parseDate(toRaw);
  const latitude = Number(latRaw);
  const longitude = Number(lonRaw);
  const utcOffset = parseUtcOffset(utcOffsetRaw);

  if (!from || !to) {
    return badRequest(res, 'Dates must be in YYYY-MM-DD format.', format);
  }

  if (from > to) {
    return badRequest(res, '`from` date cannot be greater than `to` date.', format);
  }

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return badRequest(res, 'Latitude must be a number between -90 and 90.', format);
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return badRequest(res, 'Longitude must be a number between -180 and 180.', format);
  }
  if (!utcOffset) {
    return badRequest(
      res,
      'utcOffset must be Z, UTC, H, -H, HH:MM, or -HH:MM (range -14:00..+14:00).',
      format
    );
  }

  const results = applyOffsetToResults(calculateRange(from, to, latitude, longitude), utcOffset);
  const payload = {
    meta: {
      from: fromRaw,
      to: toRaw,
      latitude,
      longitude,
      utcOffset: utcOffset.label,
      zenith: OFFICIAL_ZENITH,
      note: `Times are returned in ISO-8601 with offset ${utcOffset.label}.`
    },
    results
  };

  if (format === 'xml') {
    return send(res, 200, toXml(payload), 'application/xml; charset=utf-8');
  }
  if (format === 'csv') {
    return send(res, 200, toCsv(payload), 'text/csv; charset=utf-8');
  }
  if (format === 'html') {
    return send(res, 200, toHtml(payload), 'text/html; charset=utf-8');
  }

  return send(res, 200, toJson(payload));
});

server.listen(PORT, () => {
  console.log(`Solar Times API started on port ${PORT}`);
});
