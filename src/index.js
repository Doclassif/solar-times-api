const {
  OFFICIAL_ZENITH,
  calculateSolarTimesForDate,
  calculateRange
} = require('./solarTimes');
const {
  toJson,
  toXml,
  toCsv,
  toHtml
} = require('./formatters');

module.exports = {
  OFFICIAL_ZENITH,
  calculateSolarTimesForDate,
  calculateRange,
  toJson,
  toXml,
  toCsv,
  toHtml
};
