const fs = require('fs');

const fileOptions = { encoding: 'utf8' };
let constants = fs.readFileSync('src/constants.ts', fileOptions);

// extract the new array from standards-gen.js
let generated = fs.readFileSync('standards-gen.js', fileOptions);

// The array starts at `export const FLORIDA_STANDARDS: Standard[] = [` and ends at `];`
const startIndicator = 'export const FLORIDA_STANDARDS: Standard[] = [';
const endIndicator = '];'; // this appears multiple times, need to be careful

// find the exact block in generated
const genStartIdx = generated.indexOf(startIndicator);
const genEndIdx = generated.indexOf(endIndicator, genStartIdx) + endIndicator.length;
const newStandardsArray = generated.substring(genStartIdx, genEndIdx);

// find the exact block in constants
const conStartIdx = constants.indexOf(startIndicator);
// Find the first '];' after conStartIdx, but wait, there might be smaller arrays. In `constants.ts`, FLORIDA_STANDARDS array has no nested arrays that end in '];' at the root level? Let's check where MTR_STANDARDS starts.
const mtrStartIdx = constants.indexOf('export const MTR_STANDARDS =');

const oldChunk = constants.substring(conStartIdx, constants.indexOf('];\n\nexport const MTR_STANDARDS = [') + 2);

const newConstants = constants.replace(oldChunk, newStandardsArray);

fs.writeFileSync('src/constants.ts', newConstants);
