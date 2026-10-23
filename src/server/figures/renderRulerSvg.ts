import type { ItemClaim } from "./itemClaim.ts";
import { detectInstrumentKind, parseInstrumentReading } from "./instruments.ts";

/**
 * A "read the ruler" item needs the object's endpoint on an exact tick. Image
 * models approximate that (a 6 cm pencil lands at ~6.5), which makes the item
 * unanswerable, so rulers are rendered deterministically instead.
 *
 * Only ruler-style length readings are handled here. Anything else returns
 * null and falls through to the normal figure pipeline.
 */
const esc = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Draw a 0..max ruler with tick labels and an object spanning exactly
 * 0..reading. Every drawn number belongs to the printed scale.
 */
export const renderRulerSvg = (claim: ItemClaim): string | null => {
  if (claim.kind !== "question") return null;
  const stem = `${claim.stemText} ${claim.visualIntent || ""}`;
  if (detectInstrumentKind(stem) !== "ruler") return null;
  const isRulerItem = /\b(?:length|long|how many .*?(?:cm|centimeters?|inches?|mm|millimeters?)|measure)\b/i.test(stem);
  if (!isRulerItem) return null;

  const reading = parseInstrumentReading(claim.correctAnswerText || "", "ruler");
  if (!reading) return null;

  const maxTick = Math.max(10, Math.ceil(reading.value) + 3);
  const width = 900;
  const height = 400;
  const left = 80;
  const right = width - 80;
  const rulerTop = 210;
  const rulerHeight = 120;
  const axisY = rulerTop;
  const span = right - left;
  const xAt = (v: number) => left + (v / maxTick) * span;

  const ticks: string[] = [];
  for (let i = 0; i <= maxTick * 10; i++) {
    const v = i / 10;
    const x = xAt(v);
    const isWhole = Number.isInteger(v);
    const isHalf = Math.abs(v * 2 - Math.round(v * 2)) < 1e-9;
    const tickHeight = isWhole ? 34 : isHalf ? 24 : 16;
    ticks.push(
      `<line x1="${x.toFixed(2)}" y1="${axisY}" x2="${x.toFixed(2)}" y2="${axisY + tickHeight}" stroke="#1e293b" stroke-width="${isWhole ? 2.4 : 1.4}" />`,
    );
    if (isWhole) {
      ticks.push(
        `<text x="${x.toFixed(2)}" y="${axisY + 64}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="20" fill="#0f172a">${v}</text>`,
      );
    }
  }

  const bodyTop = 120;
  const bodyHeight = 54;
  const tipHalf = 22;
  const startX = xAt(0);
  const endX = xAt(reading.value);
  const start = startX.toFixed(2);
  const end = endX.toFixed(2);
  const bodyEnd = (endX - 46).toFixed(2);
  const tipStart = (endX - 14).toFixed(2);
  const midY = (bodyTop + bodyHeight / 2).toFixed(2);
  const bodyTopFixed = bodyTop.toFixed(2);
  const bodyHeightFixed = bodyHeight.toFixed(2);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="A ${esc(reading.value)} ${esc(reading.unit)} object on a ruler">
    <rect width="${width}" height="${height}" fill="#ffffff" />
    <g>
      <rect x="${start}" y="${bodyTopFixed}" width="${Math.max(endX - startX - 46, 10).toFixed(2)}" height="${bodyHeightFixed}" rx="6" fill="#f4c25a" stroke="#0f172a" stroke-width="3" />
      <rect x="${start}" y="${bodyTop - 2}" width="34" height="${(bodyHeight + 4).toFixed(2)}" rx="8" fill="#f2a3a3" stroke="#0f172a" stroke-width="3" />
      <path d="M ${bodyEnd} ${bodyTop - 2} L ${end} ${midY} L ${bodyEnd} ${(bodyTop + bodyHeight + 2).toFixed(2)} Z" fill="#ecd0a4" stroke="#0f172a" stroke-width="3" stroke-linejoin="round" />
      <path d="M ${tipStart} ${(bodyTop + bodyHeight / 2 - tipHalf / 2).toFixed(2)} L ${end} ${midY} L ${tipStart} ${(bodyTop + bodyHeight / 2 + tipHalf / 2).toFixed(2)} Z" fill="#334155" stroke="#0f172a" stroke-width="2" stroke-linejoin="round" />
    </g>
    <g>
      <rect x="${left - 26}" y="${rulerTop}" width="${span + 52}" height="${rulerHeight}" rx="10" fill="#fbf7e8" stroke="#0f172a" stroke-width="4" />
      <line x1="${left}" y1="${axisY}" x2="${right}" y2="${axisY}" stroke="#fbf7e8" stroke-width="0" />
      ${ticks.join("\n      ")}
      <text x="${right}" y="${axisY + 100}" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="600" fill="#0f172a">${esc(reading.unit)}</text>
    </g>
  </svg>`;
};
