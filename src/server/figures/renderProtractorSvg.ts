import type { ItemClaim } from "./itemClaim.ts";
import { detectInstrumentKind, parseInstrumentReading } from "./instruments.ts";

const esc = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const polar = (cx: number, cy: number, radius: number, degrees: number) => {
  const radians = (degrees * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy - radius * Math.sin(radians) };
};

/** Draw a protractor with one ray at the keyed angle, so the angle is readable. */
export const renderProtractorSvg = (claim: ItemClaim): string | null => {
  if (claim.kind !== "question") return null;
  const stem = `${claim.stemText} ${claim.visualIntent || ""}`;
  if (detectInstrumentKind(stem) !== "protractor") return null;

  const reading = parseInstrumentReading(claim.correctAnswerText || "", "protractor");
  if (!reading) return null;
  const angle = reading.value;

  const width = 900;
  const height = 430;
  const cx = 450;
  const cy = 340;
  const radius = 270;

  const ticks: string[] = [];
  const labels: string[] = [];
  for (let degree = 0; degree <= 180; degree += 1) {
    const major = degree % 10 === 0;
    const medium = degree % 5 === 0;
    const length = major ? 22 : medium ? 14 : 7;
    const inner = polar(cx, cy, radius - length, degree);
    const outer = polar(cx, cy, radius, degree);
    ticks.push(
      `<line x1="${inner.x.toFixed(2)}" y1="${inner.y.toFixed(2)}" x2="${outer.x.toFixed(2)}" y2="${outer.y.toFixed(2)}" stroke="#0f172a" stroke-width="${major ? 2 : medium ? 1.4 : 0.9}" />`,
    );
    if (degree % 10 === 0) {
      const label = polar(cx, cy, radius - 40, degree);
      const labelY = degree === 0 || degree === 180 ? label.y - 8 : label.y + 6;
      labels.push(
        `<text x="${label.x.toFixed(2)}" y="${labelY.toFixed(2)}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="600" fill="#0f172a">${degree}</text>`,
      );
    }
  }

  const ray = polar(cx, cy, radius - 34, angle);
  const guide = polar(cx, cy, 82, angle);
  const angleArc =
    angle > 0
      ? `<path d="M ${cx + 82} ${cy} A 82 82 0 0 0 ${guide.x.toFixed(2)} ${guide.y.toFixed(2)}" fill="none" stroke="#1d4ed8" stroke-width="2.5" stroke-dasharray="6 5" />`
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="A protractor with a ray drawn at ${esc(angle)} degrees">
    <rect width="${width}" height="${height}" fill="#ffffff" />
    <g>
      <path d="M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy} Z" fill="#eff6ff" stroke="#0f172a" stroke-width="3" />
      <path d="M ${cx - 210} ${cy} A 210 210 0 0 1 ${cx + 210} ${cy}" fill="none" stroke="#94a3b8" stroke-width="1.5" />
      ${ticks.join("\n      ")}
      ${labels.join("\n      ")}
      <line x1="${cx - radius}" y1="${cy}" x2="${cx + radius}" y2="${cy}" stroke="#0f172a" stroke-width="3" />
      <line x1="${cx}" y1="${cy}" x2="${(cx + radius - 34).toFixed(2)}" y2="${cy}" stroke="#0f172a" stroke-width="5" stroke-linecap="round" />
      <line x1="${cx}" y1="${cy}" x2="${ray.x.toFixed(2)}" y2="${ray.y.toFixed(2)}" stroke="#0f172a" stroke-width="5" stroke-linecap="round" />
      ${angleArc}
      <circle cx="${cx}" cy="${cy}" r="8" fill="#0f172a" />
    </g>
  </svg>`;
};
