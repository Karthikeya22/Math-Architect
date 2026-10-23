/**
 * Extract the quantities a question gives the student. These are construction
 * data for a deterministic figure: only values written in the stem are drawn,
 * never the keyed answer.
 */
export type GivenQuantity = {
  /** Exact text drawn in the figure, e.g. "24 apples" or "$12.50". */
  display: string;
  /** Numeric value used only to infer an operation, never drawn on its own. */
  value: number;
  noun?: string;
  kind: "money" | "fraction" | "number";
};

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "then", "so", "to", "from", "than",
  "more", "most", "less", "least", "fewer", "left", "remain", "remains",
  "remaining", "each", "per", "every", "times", "divided", "divide", "split",
  "shared", "share", "in", "of", "for", "with", "by", "is", "are", "was",
  "were", "has", "have", "had", "how", "many", "much", "what", "which",
  "when", "where", "if", "she", "he", "they", "his", "her", "their", "it",
  "its", "gives", "give", "gave", "gets", "get", "got", "buys", "buy",
  "bought", "sells", "sell", "sold", "uses", "use", "used", "makes", "make",
  "made", "equal", "equals", "same", "different", "about", "around", "near",
  "between", "into", "onto", "over", "under", "at", "on", "as", "that",
  "this", "these", "those", "there", "here", "total", "altogether", "plus",
  "minus", "sum", "product", "quotient", "difference", "added", "subtract",
  "multiply", "multiplied", "round", "rounded", "nearest", "value", "number",
  "numbers", "digit", "digits", "place", "form", "write", "written", "show",
  "shows", "shown", "find", "calculate", "solve", "answer", "choose",
  "select", "model", "represents", "represent", "estimate", "exact",
  "exactly", "approximately", "long", "length", "width", "height", "mass",
  "weight", "temperature", "volume", "area", "perimeter", "time", "hour",
  "hours", "minute", "minutes", "second", "seconds", "degrees", "degree",
  "celsius", "fahrenheit", "dollars", "dollar", "cents", "cent", "cost",
  "costs", "price", "pays", "paid", "spend", "spent", "earn", "earns",
  "earned", "save", "saves", "saved", "total",
]);

const UNIT_WORDS = new Set([
  "cm", "mm", "m", "km", "in", "inch", "inches", "ft", "feet", "foot", "yd",
  "yard", "yards", "mi", "mile", "miles", "centimeter", "centimeters",
  "millimeter", "millimeters", "meter", "meters", "kilometer", "kilometers",
  "g", "gram", "grams", "kg", "kilogram", "kilograms", "mg", "milligram",
  "milligrams", "lb", "lbs", "pound", "pounds", "oz", "ounce", "ounces",
  "ml", "milliliter", "milliliters", "l", "liter", "liters", "cup", "cups",
  "gallon", "gallons", "quart", "quarts", "pint", "pints", "fl", "fluid",
  "square", "sq", "cubic", "cu", "°c", "°f", "celsius", "fahrenheit",
  "degree", "degrees", "hour", "hours", "hr", "hrs", "minute", "minutes",
  "min", "mins", "second", "seconds", "sec", "secs", "day", "days", "week",
  "weeks", "month", "months", "year", "years", "dollar", "dollars", "cent",
  "cents", "serving", "servings", "pound", "pounds",
]);

const TASK_CUE =
  /\b(?:how many|how much|what is|what's|find|calculate|solve|round|total|altogether|left|remain|difference|sum|product|quotient|each|per|times|divided|add|subtract|multiply|divide|more|fewer|less|greater|length|width|height|area|perimeter|volume|mass|weight|temperature|time|cost|price|number of)\b/i;

const normalizeNoun = (raw: string): string | undefined => {
  const noun = String(raw || "").replace(/[.,;:!?)]+$/, "").trim();
  if (!noun) return undefined;
  const lower = noun.toLowerCase();
  if (STOP_WORDS.has(lower)) return undefined;
  if (lower.length > 24) return undefined;
  return noun;
};

/**
 * Quantities are only accepted when the stem actually gives the student
 * something to use: a unit/count noun, at least two numbers, or a numeric task
 * cue. This keeps attribute numbers ("a square has 4 equal sides") from
 * becoming a meaningless figure.
 */
export const extractGivenQuantities = (text: string): GivenQuantity[] => {
  const source = String(text ?? "");
  if (!source.trim()) return [];

  const out: GivenQuantity[] = [];
  const re = /(\$\s*)?(\d[\d,]*(?:\.\d+)?|\d+\s*\/\s*\d+)\s*(%|°\s*[CF]?)?\s*([A-Za-z][A-Za-z'-]*)?/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    const money = match[1];
    const rawNumber = String(match[2] || "").replace(/\s+/g, "");
    if (!rawNumber) continue;

    const isFraction = rawNumber.includes("/");
    let value: number;
    if (isFraction) {
      const [numerator, denominator] = rawNumber.split("/").map(Number);
      value = denominator ? numerator / denominator : Number.NaN;
    } else {
      value = Number(rawNumber.replace(/,/g, ""));
    }
    if (!Number.isFinite(value)) continue;

    const suffix = String(match[3] || "").replace(/\s+/g, "");
    let noun = normalizeNoun(String(match[4] || ""));

    // "9 square inches" / "4 cubic centimeters": keep the unit phrase together.
    if (noun && /^(?:square|sq|cubic|cu|fl|fluid)$/i.test(noun)) {
      const rest = source.slice(re.lastIndex);
      const next = rest.match(/^\s+([A-Za-z]+)/);
      if (next && UNIT_WORDS.has(next[1].toLowerCase())) {
        noun = `${noun} ${next[1]}`;
        re.lastIndex += next[0].length;
      }
    }

    const numberText = isFraction ? rawNumber : rawNumber;
    let display = `${money ? "$" : ""}${numberText}${suffix ? suffix : ""}`;
    if (noun) display = `${display} ${noun}`;

    out.push({
      display,
      value,
      noun,
      kind: money ? "money" : isFraction ? "fraction" : "number",
    });
    if (out.length >= 8) break;
  }

  if (!out.length) return [];
  const withNoun = out.some((quantity) => Boolean(quantity.noun));
  if (!withNoun && out.length < 2 && !TASK_CUE.test(source)) return [];
  return out;
};

export type GivenOperation = "+" | "-" | "×" | "÷" | null;

const singularize = (noun: string): string => {
  const lower = noun.toLowerCase();
  if (lower.endsWith("ies")) return `${lower.slice(0, -3)}y`;
  if (/(?:s|x|z|ch|sh)es$/.test(lower)) return lower.slice(0, -2);
  if (lower.endsWith("s") && !lower.endsWith("ss")) return lower.slice(0, -1);
  return lower;
};

/**
 * An operation between two quantities is only honest when the quantities can
 * actually be combined. "5 containers + 3 quarts" and "2 gallons + 5 quarts"
 * are conversion/comparison tasks: drawing a plus sign teaches the wrong
 * operation, so those get no operator at all.
 */
const quantitiesCanShareOperation = (quantities: GivenQuantity[]): boolean => {
  const nouns = quantities
    .map((quantity) => quantity.noun?.toLowerCase())
    .filter((noun): noun is string => Boolean(noun));
  if (!nouns.length) return true;

  const unitNouns = nouns.filter((noun) => UNIT_WORDS.has(noun));
  if (!unitNouns.length) return true;

  // Same unit on both sides is additive; different units are not.
  const unitKeys = new Set(unitNouns.map(singularize));
  if (unitKeys.size > 1) return false;
  // A unit next to a non-unit ("5 containers and 3 quarts") is also not additive.
  if (nouns.length === 2 && new Set(nouns.map(singularize)).size > 1) return false;
  return true;
};

/** Only infer an operation for exactly two given quantities. */
export const inferGivenOperation = (
  text: string,
  quantities: GivenQuantity[],
): GivenOperation => {
  if (quantities.length !== 2) return null;
  const source = String(text ?? "");
  if (!quantitiesCanShareOperation(quantities)) return null;

  // A rate story is multiplication when it asks for a total. Any other
  // two-number operation would be a guess, so draw the values without one.
  if (/\b(?:each|per|every)\b/i.test(source)) {
    return /\b(?:total|altogether|in all|combined)\b/i.test(source) ? "×" : null;
  }

  if (/\b(?:divided by|divide|split|shared|share|quotient)\b/i.test(source)) return "÷";
  if (/\b(?:times|multiplied by|multiply|product|groups? of|rows? of)\b/i.test(source)) return "×";
  if (
    /\b(?:left|remain|remaining|difference|fewer|how many more|subtract|minus|gave away|gives away|give away|took away|takes away|take away|used|spent)\b/i.test(
      source,
    )
  ) {
    return "-";
  }
  if (/\b(?:total|altogether|in all|combined|sum|plus|added)\b/i.test(source)) return "+";
  if (source.includes("÷")) return "÷";
  if (source.includes("×") || source.includes("*")) return "×";
  if (source.includes("+")) return "+";
  if (/\s-\s/.test(source)) return "-";
  return null;
};
