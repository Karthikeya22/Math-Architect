/**
 * Measurement items ask the student to read a value off a printed scale
 * (ruler, thermometer, balance, protractor...). That scale necessarily prints
 * numerals and unit marks, which are given data — not stray text and not the
 * answer written out. Every stage that judges visible text must know this.
 */
const MEASURING_INSTRUMENT =
  /\b(?:ruler|rulers|tape measure|measuring tape|yardstick|meter stick|metre stick|thermometer|temperature scale|pan balance|balance scale|balance|scale|graduated cylinder|measuring cup|beaker|protractor|analog clock|clock face|clock)\b/i;

export const isMeasuringInstrument = (text: string): boolean =>
  MEASURING_INSTRUMENT.test(String(text ?? ""));

export type InstrumentKind =
  | "ruler"
  | "thermometer"
  | "liquid_volume"
  | "balance"
  | "protractor"
  | "clock"
  | "none";

/** Which deterministic instrument renderer can draw this item, if any. */
export const detectInstrumentKind = (text: string): InstrumentKind => {
  const value = String(text ?? "");
  if (/\b(?:graduated cylinder|measuring cup|measuring jug|beaker)\b/i.test(value)) return "liquid_volume";
  if (/\bthermometer\b/i.test(value)) return "thermometer";
  if (/\b(?:ruler|rulers|tape measure|measuring tape|yardstick|meter stick|metre stick)\b/i.test(value)) return "ruler";
  if (/\b(?:protractor)\b/i.test(value)) return "protractor";
  if (/\b(?:pan balance|balance scale|two-pan balance|balance)\b/i.test(value)) return "balance";
  if (/\b(?:analog clock|clock face|clock)\b/i.test(value)) return "clock";
  return "none";
};

export type InstrumentReading = {
  value: number;
  unit: string;
  kind: InstrumentKind;
};

const LENGTH_UNITS: ReadonlyArray<[RegExp, string]> = [
  [/^(?:cm|centimet(?:er|re)s?)$/i, "cm"],
  [/^(?:mm|millimet(?:er|re)s?)$/i, "mm"],
  [/^(?:m|met(?:er|re)s?)$/i, "m"],
  [/^(?:km|kilomet(?:er|re)s?)$/i, "km"],
  [/^(?:in|inch(?:es)?|")$/i, "in"],
  [/^(?:ft|feet|foot|')$/i, "ft"],
  [/^(?:yd|yards?)$/i, "yd"],
];

const parseNumber = (text: string): number | null => {
  const match = String(text ?? "").match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
};

/**
 * Read the answer choice that names the value on the scale. This is
 * construction data for the renderer, never text drawn on the figure.
 */
export const parseInstrumentReading = (
  answer: string,
  kind: InstrumentKind,
): InstrumentReading | null => {
  const text = String(answer ?? "");
  const value = parseNumber(text);
  if (value === null) return null;

  if (kind === "clock") {
    const digital = text.match(/(\d{1,2}):(\d{2})/);
    if (digital) {
      const hour = Number(digital[1]);
      const minute = Number(digital[2]);
      if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
      return { value: hour * 60 + minute, unit: `${hour}:${String(minute).padStart(2, "0")}`, kind };
    }
    const spoken = text.match(/(?:quarter\s+past|half\s+past)\s+(\d{1,2})/i);
    if (spoken) {
      const hour = Number(spoken[1]);
      const minute = /half/i.test(text) ? 30 : 15;
      if (hour < 0 || hour > 23) return null;
      return { value: hour * 60 + minute, unit: `${hour}:${String(minute).padStart(2, "0")}`, kind };
    }
    const oclock = text.match(/(\d{1,2})\s*(?:o'?clock)/i);
    if (oclock) {
      const hour = Number(oclock[1]);
      if (hour < 0 || hour > 23) return null;
      return { value: hour * 60, unit: `${hour}:00`, kind };
    }
    return null;
  }

  if (kind === "balance") {
    const match = text.match(
      /(\d+(?:[.,]\d+)?)\s*(kilograms?|kg|grams?|g|milligrams?|mg|pounds?|lb|lbs|ounces?|oz)\b/i,
    );
    if (!match) return null;
    const amount = Number(match[1].replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) return null;
    const raw = match[2].toLowerCase();
    const grams = /^(?:kg|kilogram)/.test(raw)
      ? amount * 1000
      : /^(?:mg|milligram)/.test(raw)
        ? amount / 1000
        : /^(?:lb|pound)/.test(raw)
          ? amount * 453.59237
          : /^(?:oz|ounce)/.test(raw)
            ? amount * 28.349523125
            : amount;
    if (grams < 1 || grams > 100000) return null;
    return { value: grams, unit: "g", kind };
  }

  if (kind === "protractor") {
    const match = text.match(/(\d+(?:\.\d+)?)\s*(?:°|degrees?)\b/i);
    if (!match) return null;
    const degrees = Number(match[1]);
    if (!Number.isFinite(degrees) || degrees < 0 || degrees > 180) return null;
    return { value: degrees, unit: "°", kind };
  }

  if (kind === "thermometer") {
    const match = text.match(
      /-?\d+(?:\.\d+)?\s*°?\s*(?:degrees?\s*)?(C|F|celsius|fahrenheit)\b/i,
    );
    if (!match) return null;
    if (value < -80 || value > 300) return null;
    return { value, unit: /f/i.test(match[1]) ? "°F" : "°C", kind };
  }

  if (kind === "liquid_volume") {
    const match = text.match(
      /-?\d+(?:\.\d+)?\s*(millilit(?:er|re)s?|mL|ml|lit(?:er|re)s?|L|cups?|gallons?|gal|fluid ounces?|fl\.?\s*oz\.?)\b/i,
    );
    if (!match) return null;
    if (value <= 0) return null;
    const raw = match[1].toLowerCase();
    const unit = /millilit|^ml$/.test(raw)
      ? "mL"
      : /^l$|^lit/.test(raw)
        ? "L"
        : /^cup/.test(raw)
          ? "cups"
          : /^gal/.test(raw)
            ? "gal"
            : "fl oz";
    return { value, unit, kind };
  }

  if (kind === "ruler") {
    if (value <= 0 || value > 100) return null;
    const unitMatch = text.match(/-?\d+(?:\.\d+)?\s*([a-zA-Z"']*)/);
    const rawUnit = (unitMatch?.[1] || "").trim();
    const unit = LENGTH_UNITS.find(([pattern]) => pattern.test(rawUnit))?.[1] ?? "cm";
    return { value, unit, kind };
  }

  return null;
};
