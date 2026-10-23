import type { ItemClaim } from "./itemClaim.ts";
import { detectInstrumentKind, parseInstrumentReading } from "./instruments.ts";

const esc = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const handPoint = (cx: number, cy: number, length: number, degrees: number) => {
  const radians = (degrees * Math.PI) / 180;
  return { x: cx + length * Math.sin(radians), y: cy - length * Math.cos(radians) };
};

/**
 * Draw an analog clock at the keyed time. Only direct "read the clock" items
 * qualify; elapsed-time items would be answered by the hands themselves.
 */
export const renderClockSvg = (claim: ItemClaim): string | null => {
  if (claim.kind !== "question") return null;
  const stem = `${claim.stemText} ${claim.visualIntent || ""}`;
  if (detectInstrumentKind(stem) !== "clock") return null;
  // This draws an analog face; a digital-clock question needs a digital display (AI path).
  if (/\bdigital\b/i.test(stem)) return null;
  if (
    /\b(?:will it be|elapsed|how long|after|before|later|earlier|in \d+\s*(?:minutes?|hours?)|how many (?:minutes|hours))\b/i.test(
      stem,
    )
  ) {
    return null;
  }
  if (!/\b(?:shows?|shown|reads?|what time|displayed)\b/i.test(stem)) return null;

  const reading = parseInstrumentReading(claim.correctAnswerText || "", "clock");
  if (!reading) return null;
  const totalMinutes = reading.value;
  const hour = Math.floor(totalMinutes / 60) % 12;
  const minute = totalMinutes % 60;

  const width = 900;
  const height = 430;
  const cx = 450;
  const cy = 215;
  const radius = 178;

  const ticks: string[] = [];
  for (let i = 0; i < 60; i += 1) {
    const degrees = i * 6;
    const isHour = i % 5 === 0;
    const inner = handPoint(cx, cy, radius - (isHour ? 20 : 9), degrees);
    const outer = handPoint(cx, cy, radius, degrees);
    ticks.push(
      `<line x1="${inner.x.toFixed(2)}" y1="${inner.y.toFixed(2)}" x2="${outer.x.toFixed(2)}" y2="${outer.y.toFixed(2)}" stroke="#0f172a" stroke-width="${isHour ? 2.6 : 1.1}" />`,
    );
  }

  const numbers: string[] = [];
  for (let n = 1; n <= 12; n += 1) {
    const point = handPoint(cx, cy, radius - 48, n * 30);
    numbers.push(
      `<text x="${point.x.toFixed(2)}" y="${(point.y + 10).toFixed(2)}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="700" fill="#0f172a" stroke="#ffffff" stroke-width="6" paint-order="stroke">${n}</text>`,
    );
  }

  const hourAngle = (hour + minute / 60) * 30;
  const minuteAngle = minute * 6;
  const hourEnd = handPoint(cx, cy, 96, hourAngle);
  const minuteEnd = handPoint(cx, cy, 136, minuteAngle);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="An analog clock showing ${esc(reading.unit)}">
    <rect width="${width}" height="${height}" fill="#ffffff" />
    <g>
      <circle cx="${cx}" cy="${cy}" r="${radius + 12}" fill="#f8fafc" stroke="#0f172a" stroke-width="3" />
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />
      ${ticks.join("\n      ")}
      <line x1="${cx}" y1="${cy}" x2="${hourEnd.x.toFixed(2)}" y2="${hourEnd.y.toFixed(2)}" stroke="#0f172a" stroke-width="10" stroke-linecap="round" />
      <line x1="${cx}" y1="${cy}" x2="${minuteEnd.x.toFixed(2)}" y2="${minuteEnd.y.toFixed(2)}" stroke="#1d4ed8" stroke-width="6" stroke-linecap="round" />
      ${/* Numerals above the hands (with a white halo) so a hand never hides one. */ ""}
      ${numbers.join("\n      ")}
      <circle cx="${cx}" cy="${cy}" r="10" fill="#0f172a" />
      <circle cx="${cx}" cy="${cy}" r="4" fill="#ffffff" />
    </g>
  </svg>`;
};
