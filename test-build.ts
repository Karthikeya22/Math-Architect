import { defineConfig, loadEnv } from 'vite';
const env = loadEnv('development', process.cwd(), '');
console.log("Defining key:", env.GEMINI_API_KEY ? "YES (" + env.GEMINI_API_KEY.substring(0,5) + ")" : "NO");
