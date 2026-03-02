const OFFICIAL_ZENITH = 90.833;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

function normalizeDegrees(degrees) {
  let value = degrees % 360;
  if (value < 0) value += 360;
  return value;
}

function normalizeHours(hours) {
  let value = hours % 24;
  if (value < 0) value += 24;
  return value;
}

function dayOfYear(date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const current = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
  return Math.floor((current - start) / 86400000);
}

function buildUTCDate(date, hoursFloat) {
  const hours = Math.floor(hoursFloat);
  const minutesFloat = (hoursFloat - hours) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = Math.round((minutesFloat - minutes) * 60);

  const result = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      hours,
      minutes,
      seconds
    )
  );

  return result.toISOString();
}

function calculateSolarEvent(date, latitude, longitude, isSunrise, zenith = OFFICIAL_ZENITH) {
  const n = dayOfYear(date);
  const lngHour = longitude / 15;

  const t = isSunrise
    ? n + (6 - lngHour) / 24
    : n + (18 - lngHour) / 24;

  const m = 0.9856 * t - 3.289;

  let l = m + 1.916 * Math.sin(toRad(m)) + 0.02 * Math.sin(toRad(2 * m)) + 282.634;
  l = normalizeDegrees(l);

  let ra = toDeg(Math.atan(0.91764 * Math.tan(toRad(l))));
  ra = normalizeDegrees(ra);

  const lQuadrant = Math.floor(l / 90) * 90;
  const raQuadrant = Math.floor(ra / 90) * 90;
  ra = ra + (lQuadrant - raQuadrant);
  ra = ra / 15;

  const sinDec = 0.39782 * Math.sin(toRad(l));
  const cosDec = Math.cos(Math.asin(sinDec));

  const cosH =
    (Math.cos(toRad(zenith)) - sinDec * Math.sin(toRad(latitude))) /
    (cosDec * Math.cos(toRad(latitude)));

  if (cosH > 1 || cosH < -1) {
    return null;
  }

  let h;
  if (isSunrise) {
    h = 360 - toDeg(Math.acos(cosH));
  } else {
    h = toDeg(Math.acos(cosH));
  }
  h = h / 15;

  const localMeanTime = h + ra - 0.06571 * t - 6.622;
  const utcTime = normalizeHours(localMeanTime - lngHour);

  return buildUTCDate(date, utcTime);
}

function calculateSolarTimesForDate(date, latitude, longitude) {
  const sunrise = calculateSolarEvent(date, latitude, longitude, true, OFFICIAL_ZENITH);
  const sunset = calculateSolarEvent(date, latitude, longitude, false, OFFICIAL_ZENITH);

  return {
    date: date.toISOString().slice(0, 10),
    sunrise,
    sunset
  };
}

function calculateRange(fromDate, toDate, latitude, longitude) {
  const results = [];
  const current = new Date(Date.UTC(
    fromDate.getUTCFullYear(),
    fromDate.getUTCMonth(),
    fromDate.getUTCDate()
  ));
  const end = new Date(Date.UTC(
    toDate.getUTCFullYear(),
    toDate.getUTCMonth(),
    toDate.getUTCDate()
  ));

  while (current <= end) {
    results.push(calculateSolarTimesForDate(current, latitude, longitude));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return results;
}

module.exports = {
  OFFICIAL_ZENITH,
  calculateSolarTimesForDate,
  calculateRange
};
