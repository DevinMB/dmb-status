// Some Samsung Health sensors report in a different base unit than the one this
// app displays (Health Connect/Samsung Health commonly use grams and feet
// internally regardless of the phone's display locale). Convert at the source
// so every consumer — the live "latest" value and all historical aggregates —
// sees the same, correctly-scaled number.
const CONVERSIONS = {
  weight:                    { factor: 1 / 1000,      unit: 'kg' },   // g    -> kg
  daily_distance:            { factor: 0.3048 / 1000, unit: 'km' },   // ft   -> km
  daily_elevation_gained:    { factor: 0.3048,         unit: 'm' },    // ft   -> m
  systolic_blood_pressure:   { factor: 25.4,           unit: 'mmHg' }, // inHg -> mmHg
  diastolic_blood_pressure:  { factor: 25.4,           unit: 'mmHg' }, // inHg -> mmHg
};

function normalizeValue(entityKey, value) {
  const conv = CONVERSIONS[entityKey];
  if (!conv || value == null || isNaN(value)) return value;
  return value * conv.factor;
}

function normalizeUnit(entityKey, unit) {
  return CONVERSIONS[entityKey]?.unit ?? unit;
}

module.exports = { normalizeValue, normalizeUnit };
