function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toJson(payload) {
  return JSON.stringify(payload, null, 2);
}

function escapeCsv(value) {
  const str = String(value ?? '');
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toXml(payload) {
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<solarTimesResponse>'];

  lines.push(`  <meta>`);
  lines.push(`    <from>${escapeXml(payload.meta.from)}</from>`);
  lines.push(`    <to>${escapeXml(payload.meta.to)}</to>`);
  lines.push(`    <latitude>${escapeXml(payload.meta.latitude)}</latitude>`);
  lines.push(`    <longitude>${escapeXml(payload.meta.longitude)}</longitude>`);
  lines.push(`    <zenith>${escapeXml(payload.meta.zenith)}</zenith>`);
  lines.push(`  </meta>`);

  lines.push('  <results>');
  for (const item of payload.results) {
    lines.push('    <day>');
    lines.push(`      <date>${escapeXml(item.date)}</date>`);
    lines.push(`      <sunrise>${escapeXml(item.sunrise ?? '')}</sunrise>`);
    lines.push(`      <sunset>${escapeXml(item.sunset ?? '')}</sunset>`);
    lines.push('    </day>');
  }
  lines.push('  </results>');

  lines.push('</solarTimesResponse>');
  return lines.join('\n');
}

function toCsv(payload) {
  const lines = ['date,sunrise_utc,sunset_utc'];
  for (const item of payload.results) {
    lines.push(
      [
        escapeCsv(item.date),
        escapeCsv(item.sunrise),
        escapeCsv(item.sunset)
      ].join(',')
    );
  }
  return lines.join('\n');
}

function toHtml(payload) {
  const rows = payload.results.map((item) => `
        <tr>
          <td>${escapeXml(item.date)}</td>
          <td>${escapeXml(item.sunrise ?? '')}</td>
          <td>${escapeXml(item.sunset ?? '')}</td>
        </tr>`).join('\n');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Solar Times</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 24px; color: #111; }
      h1 { margin: 0 0 12px; }
      .meta { margin: 0 0 16px; color: #333; }
      table { border-collapse: collapse; width: 100%; max-width: 860px; }
      th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
      th { background: #f6f6f6; }
      tr:nth-child(even) { background: #fcfcfc; }
      code { background: #f3f3f3; padding: 2px 5px; border-radius: 4px; }
    </style>
  </head>
  <body>
    <h1>Solar Times</h1>
    <p class="meta">
      from <code>${escapeXml(payload.meta.from)}</code> to <code>${escapeXml(payload.meta.to)}</code>,
      lat <code>${escapeXml(payload.meta.latitude)}</code>, lon <code>${escapeXml(payload.meta.longitude)}</code>,
      utcOffset <code>${escapeXml(payload.meta.utcOffset)}</code>, zenith <code>${escapeXml(payload.meta.zenith)}</code>
    </p>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Sunrise</th>
          <th>Sunset</th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </body>
</html>`;
}

module.exports = {
  toJson,
  toXml,
  toCsv,
  toHtml
};
