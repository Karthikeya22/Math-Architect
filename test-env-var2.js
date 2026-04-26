import { loadEnv } from 'vite';
const env = loadEnv('development', process.cwd(), '');
console.log("process.env API KEY length:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : "MISSING");
console.log("loadEnv API KEY length:", env.GEMINI_API_KEY ? env.GEMINI_API_KEY.length : "MISSING");
