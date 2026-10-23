import type { ItemClaim } from "./itemClaim.ts";
import { detectInstrumentKind, parseInstrumentReading } from "./instruments.ts";

const esc = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const NICE_STEPS = [0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];

const chooseScale = (reading: number, unit: string): { max: number; step: number } => {
  const floor = unit === "L" ? 2 : unit === "cups" ? 4 : unit === "gal" ? 2 : 100;
  const target = Math.max(reading * 1.25, floor);

  let best: { max: number; step: number } | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const step of NICE_STEPS) {
    const max = Math.ceil(target / step) * step;
    const count = max / step;
    if (count < 4 || count > 12) continue;
    const distance = Math.abs(count - 6);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = { max, step };
    }
  }
  return best ?? { max: target, step: target / 6 };
};

const formatTick = (value: number): string =>
  Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");

/** Draw a graduated cylinder whose liquid level ends exactly on the reading. */
export const renderCylinderSvg = (claim: ItemClaim): string | null => {
  if (claim.kind !== "question") return null;
  const stem = `${claim.stemText} ${claim.visualIntent || ""}`;
  if (detectInstrumentKind(stem) !== "liquid_volume") return null;

  const reading = parseInstrumentReading(claim.correctAnswerText || "", "liquid_volume");
  if (!reading) return null;

  const { max, step } = chooseScale(reading.value, reading.unit);
  const width = 900;
  const height = 430;
  const bodyX = 330;
  const bodyW = 240;
  const bodyTop = 60;
  const bodyBottom = 350;
  const liquidBottom = bodyBottom - 12;

  const yAt = (value: number) =>
    liquidBottom - (value / max) * (liquidBottom - (bodyTop + 24));
  const liquidY = yAt(reading.value);

  const ticks: string[] = [];
  for (let value = 0; value <= max + 1e-9; value += step) {
    const y = yAt(value);
    ticks.push(
      `<line x1="${bodyX + bodyW - 4}" y1="${y.toFixed(2)}" x2="${bodyX + bodyW + 22}" y2="${y.toFixed(2)}" stroke="#0f172a" stroke-width="${value === 0 ? 2.4 : 1.8}" />`,
      `<text x="${bodyX + bodyW + 34}" y="${(y + 7).toFixed(2)}" font-family="Inter, Arial, sans-serif" font-size="19" fill="#0f172a">${formatTick(value)}</text>`,
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="A graduated cylinder reading ${esc(reading.value)} ${esc(reading.unit)}">
    <rect width="${width}" height="${height}" fill="#ffffff" />
    <g>
      <path d="M ${bodyX} ${bodyTop} L ${bodyX} ${bodyBottom} Q ${bodyX} ${bodyBottom + 24} ${bodyX + 24} ${bodyBottom + 24} L ${bodyX + bodyW - 24} ${bodyBottom + 24} Q ${bodyX + bodyW} ${bodyBottom + 24} ${bodyX + bodyW} ${bodyBottom} L ${bodyX + bodyW} ${bodyTop}" fill="#ffffff" stroke="#0f172a" stroke-width="4" stroke-linejoin="round" />
      <path d="M ${bodyX + 6} ${liquidY.toFixed(2)} L ${bodyX + 6} ${bodyBottom} Q ${bodyX + 6} ${bodyBottom + 18} ${bodyX + 26} ${bodyBottom + 18} L ${bodyX + bodyW - 26} ${bodyBottom + 18} Q ${bodyX + bodyW - 6} ${bodyBottom + 18} ${bodyX + bodyW - 6} ${bodyBottom} L ${bodyX + bodyW - 6} ${liquidY.toFixed(2)} Z" fill="#bfdbfe" stroke="#60a5fa" stroke-width="1.5" />
      <ellipse cx="${bodyX + bodyW / 2}" cy="${liquidY.toFixed(2)}" rx="${(bodyW - 12) / 2}" ry="7" fill="#93c5fd" />
      ${ticks.join("\n      ")}
      <text x="${bodyX + bodyW + 34}" y="${(yAt(0) + 46).toFixed(2)}" font-family="Inter, Arial, sans-serif" font-size="21" font-weight="700" fill="#0f172a">${esc(reading.unit)}</text>
    </g>
  </svg>`;
};
