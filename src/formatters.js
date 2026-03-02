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

module.exports = {
  toJson,
  toXml,
  toCsv
};
