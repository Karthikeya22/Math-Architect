/**
 * Runs the server figure pipeline (brief -> image -> vision check) on fixed sample questions.
 *
 *   npx tsx scripts/try_figures.ts [outLabel]
 *   OPENAI_IMAGE_MODEL=gpt-image-2.5-sunburst npx tsx scripts/try_figures.ts sunburst
 *
 * Writes images and results.json to smoke-output/figures-<outLabel>/.
 */
import "../src/server/loadEnv.ts";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateFigure } from "../src/server/figures/generateFigure.ts";
import type { FigureInput } from "../src/server/figures/types.ts";

const SAMPLES: Array<{ id: string; input: FigureInput }> = [
  {
    id: "k-stars",
    input: {
      kind: "question",
      grade: "Kindergarten",
      text: "Count the stars in the box. How many stars are there?",
      options: ["7", "8", "9", "10"],
      correctAnswerIndex: 1,
      visualIntent: "Count each star one time.",
    },
  },
  {
    id: "g3-standard-form",
    input: {
      kind: "question",
      grade: "Grade 3",
      text: "What is the standard form of the expression 8,000 + 70 + 5?",
      options: ["875", "8,705", "8,075", "8,750"],
      correctAnswerIndex: 2,
    },
  },
  {
    id: "g4-fraction-bar",
    input: {
      kind: "question",
      grade: "Grade 4",
      text: "A bar is split into 6 equal parts and 4 of the parts are shaded. What fraction of the bar is shaded?",
      options: ["4/6", "6/4", "2/6", "4/10"],
      correctAnswerIndex: 0,
    },
  },
  {
    id: "g8-ladder",
    input: {
      kind: "question",
      grade: "Grade 8",
      text: "A ladder leans against a wall. The foot of the ladder is 6 feet from the wall and the top reaches 8 feet up the wall. How long is the ladder?",
      options: ["9 feet", "10 feet", "12 feet", "14 feet"],
      correctAnswerIndex: 1,
    },
  },
  {
    id: "hs-parallel-lines",
    input: {
      kind: "question",
      grade: "Grade 9",
      text: "Lines l and m are parallel and are intersected by a transversal t. Two alternate interior angles are represented by the expressions (4x + 10)° and (6x - 20)°. What is the value of x?",
      options: ["5", "15", "19", "30"],
      correctAnswerIndex: 1,
    },
  },
  {
    id: "hs-perp-bisector",
    input: {
      kind: "question",
      grade: "Grade 9",
      text: "Point P is located on the perpendicular bisector of line segment AB. The distance from P to A is represented by 3y + 5 and the distance from P to B is represented by 5y - 7. What is the length of segment AP?",
      options: ["6", "12", "23", "25"],
      correctAnswerIndex: 2,
    },
  },
];

const label = process.argv[2] || "run";
const outDir = resolve(process.cwd(), "smoke-output", `figures-${label}`);
mkdirSync(outDir, { recursive: true });

const results = await Promise.all(
  SAMPLES.map(async ({ id, input }) => {
    const result = await generateFigure(input);
    let imageFile: string | undefined;
    const match = result.image ? /^data:([^;]+);base64,(.+)$/s.exec(result.image) : null;
    if (match) {
      imageFile = `${id}.${match[1].includes("png") ? "png" : "jpg"}`;
      writeFileSync(resolve(outDir, imageFile), Buffer.from(match[2], "base64"));
    }
    const { image: _image, ...rest } = result;
    console.log(`${id.padEnd(20)} ${result.status.padEnd(10)} attempts=${result.attempts} ${result.elapsedMs}ms ${result.issues.join(" | ")}`);
    return { id, imageFile, ...rest };
  }),
);

writeFileSync(resolve(outDir, "results.json"), JSON.stringify(results, null, 2), "utf8");
