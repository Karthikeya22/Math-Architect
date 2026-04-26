const fs = require('fs');

const path = './src/constants.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace all occurrences of literal backslash-n with actual newlines
// But only inside the FLORIDA_STANDARDS array, or just globally since we shouldn't have `\\n` literals outside of strings anyway.
content = content.replace(/\\n/g, '\n');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed newlines in constants.ts');
