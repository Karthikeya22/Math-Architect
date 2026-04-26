import { loadEnv } from 'vite';
const env = loadEnv('development', process.cwd(), '');
console.log("Key defined:", !!env.GEMINI_API_KEY, env.GEMINI_API_KEY?.substring(0, 5));
console.log("Process env key:", !!process.env.GEMINI_API_KEY);
