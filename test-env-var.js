import { loadEnv } from 'vite';
const env = loadEnv('development', process.cwd(), '');
console.log("process.env:", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");
console.log("loadEnv:", env.GEMINI_API_KEY ? "EXISTS" : "MISSING");
