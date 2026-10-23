import type { ItemClaim } from "./itemClaim.ts";
import { detectInstrumentKind, parseInstrumentReading } from "./instruments.ts";

const esc = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 1];

const decompose = (grams: number): number[] | null => {
  const rounded = Math.round(grams);
  if (Math.abs(rounded - grams) > 1e-6) return null;
  let remaining = rounded;
  const weights: number[] = [];
  for (const denomination of DENOMINATIONS) {
    while (remaining >= denomination) {
      weights.push(denomination);
      remaining -= denomination;
      if (weights.length > 7) return null;
    }
  }
  return weights.length && remaining === 0 ? weights : null;
};

const weightLabel = (grams: number): string => (grams >= 1000 ? `${grams / 1000} kg` : `${grams} g`);

/** Draw a two-pan balance whose weights add up exactly to the keyed mass. */
export const renderBalanceSvg = (claim: ItemClaim): string | null => {
  if (claim.kind !== "question") return null;
  const stem = `${claim.stemText} ${claim.visualIntent || ""}`;
  if (detectInstrumentKind(stem) !== "balance") return null;

  const reading = parseInstrumentReading(claim.correctAnswerText || "", "balance");
  if (!reading) return null;
  const weights = decompose(reading.value);
  if (!weights) return null;

  const width = 900;
  const height = 430;
  const beamY = 120;
  const leftX = 190;
  const rightX = 710;
  const panY = 280;

  // Lay weights in rows of at most three, bottom row first.
  const rows: number[][] = [];
  for (let i = 0; i < weights.length; i += 3) rows.push(weights.slice(i, i + 3));

  const blockH = 46;
  const blockGap = 8;
  const weightNodes = rows
    .map((row, rowIndex) => {
      const rowY = panY - 18 - (rowIndex + 1) * blockH - rowIndex * blockGap;
      const totalW = row.length * 62 + (row.length - 1) * 8;
      const startX = rightX - totalW / 2;
      return row
        .map((grams, i) => {
          const x = startX + i * 70;
          return `<g>
            <rect x="${x}" y="${rowY}" width="62" height="${blockH}" rx="7" fill="#e2e8f0" stroke="#0f172a" stroke-width="2.4" />
            <text x="${x + 31}" y="${rowY + blockH / 2 + 7}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${grams >= 1000 ? 17 : 16}" font-weight="700" fill="#0f172a">${esc(weightLabel(grams))}</text>
          </g>`;
        })
        .join("\n      ");
    })
    .join("\n      ");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="A two-pan balance with weights on one side and an object on the other">
    <rect width="${width}" height="${height}" fill="#ffffff" />
    <g>
      <rect x="440" y="${beamY}" width="20" height="222" rx="8" fill="#475569" />
      <rect x="360" y="342" width="180" height="18" rx="9" fill="#475569" />
      <rect x="${leftX - 4}" y="${beamY - 10}" width="8" height="14" rx="3" fill="#0f172a" />
      <rect x="${rightX - 4}" y="${beamY - 10}" width="8" height="14" rx="3" fill="#0f172a" />
      <line x1="${leftX}" y1="${beamY}" x2="${leftX}" y2="${panY - 18}" stroke="#334155" stroke-width="3" />
      <line x1="${rightX}" y1="${beamY}" x2="${rightX}" y2="${panY - 18}" stroke="#334155" stroke-width="3" />
      <rect x="${leftX}" y="${beamY - 8}" width="${rightX - leftX}" height="14" rx="7" fill="#475569" />
      <ellipse cx="${leftX}" cy="${panY}" rx="112" ry="18" fill="#cbd5e1" stroke="#0f172a" stroke-width="3" />
      <ellipse cx="${rightX}" cy="${panY}" rx="112" ry="18" fill="#cbd5e1" stroke="#0f172a" stroke-width="3" />
      <g>
        <rect x="${leftX - 36}" y="${panY - 88}" width="72" height="72" rx="8" fill="#fbbf24" stroke="#0f172a" stroke-width="3" />
        <line x1="${leftX - 36}" y1="${panY - 70}" x2="${leftX + 36}" y2="${panY - 70}" stroke="#92400e" stroke-width="2" opacity="0.35" />
      </g>
      ${weightNodes}
      <circle cx="450" cy="${beamY}" r="14" fill="#0f172a" />
      <circle cx="450" cy="${beamY}" r="6" fill="#e2e8f0" />
    </g>
  </svg>`;
};
