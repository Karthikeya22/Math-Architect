import type { ItemClaim } from "./itemClaim.ts";
import { detectInstrumentKind, parseInstrumentReading } from "./instruments.ts";

const esc = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Draw a thermometer whose liquid column ends exactly on the reading. */
export const renderThermometerSvg = (claim: ItemClaim): string | null => {
  if (claim.kind !== "question") return null;
  const stem = `${claim.stemText} ${claim.visualIntent || ""}`;
  if (detectInstrumentKind(stem) !== "thermometer") return null;

  const reading = parseInstrumentReading(claim.correctAnswerText || "", "thermometer");
  if (!reading) return null;

  const isF = reading.unit === "°F";
  const step = isF ? 10 : 5;
  const min = Math.min(0, Math.floor((reading.value - 10) / step) * step);
  const max = Math.max(isF ? 100 : 40, Math.ceil((reading.value + 10) / step) * step);
  if (max <= min) return null;

  const width = 900;
  const height = 430;
  const tubeX = 400;
  const tubeW = 100;
  const tubeTop = 40;
  const tubeBottom = 340;
  const innerW = 36;
  const innerX = tubeX + (tubeW - innerW) / 2;
  const bulbX = tubeX + tubeW / 2;
  const bulbR = 36;
  const bulbY = tubeBottom + 8;

  const yAt = (value: number) =>
    tubeBottom - ((value - min) / (max - min)) * (tubeBottom - tubeTop - 10);
  const liquidTop = yAt(reading.value);

  const ticks: string[] = [];
  for (let value = min; value <= max + 1e-9; value += step) {
    const y = yAt(value);
    ticks.push(
      `<line x1="${tubeX + tubeW + 6}" y1="${y.toFixed(2)}" x2="${tubeX + tubeW + 26}" y2="${y.toFixed(2)}" stroke="#0f172a" stroke-width="2.2" />`,
      `<text x="${tubeX + tubeW + 38}" y="${(y + 7).toFixed(2)}" font-family="Inter, Arial, sans-serif" font-size="19" fill="#0f172a">${value}</text>`,
    );
    if (step >= 2) {
      const mid = value + step / 2;
      if (mid < max - 1e-9) {
        const midY = yAt(mid);
        ticks.push(
          `<line x1="${tubeX + tubeW + 6}" y1="${midY.toFixed(2)}" x2="${tubeX + tubeW + 16}" y2="${midY.toFixed(2)}" stroke="#334155" stroke-width="1.4" />`,
        );
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="A thermometer reading ${esc(reading.value)} ${esc(reading.unit)}">
    <rect width="${width}" height="${height}" fill="#ffffff" />
    <g>
      <circle cx="${bulbX}" cy="${bulbY}" r="${bulbR}" fill="#dc2626" stroke="#0f172a" stroke-width="3" />
      <rect x="${tubeX}" y="${tubeTop}" width="${tubeW}" height="${tubeBottom - tubeTop}" rx="${tubeW / 2}" fill="#ffffff" stroke="#0f172a" stroke-width="3" />
      <rect x="${innerX}" y="${tubeTop + 20}" width="${innerW}" height="${tubeBottom - tubeTop - 10}" rx="${innerW / 2}" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5" />
      <rect x="${innerX}" y="${liquidTop.toFixed(2)}" width="${innerW}" height="${(tubeBottom - liquidTop + 4).toFixed(2)}" rx="8" fill="#dc2626" />
      <circle cx="${bulbX}" cy="${bulbY}" r="${bulbR - 6}" fill="#ef4444" />
      ${ticks.join("\n      ")}
      <text x="${tubeX + tubeW + 38}" y="${(yAt(min) + 44).toFixed(2)}" font-family="Inter, Arial, sans-serif" font-size="21" font-weight="700" fill="#0f172a">${esc(reading.unit)}</text>
    </g>
  </svg>`;
};
