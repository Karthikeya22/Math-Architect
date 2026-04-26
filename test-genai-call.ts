import { GoogleGenAI } from "@google/genai";
import { loadEnv } from 'vite';

const env = loadEnv('development', process.cwd(), '');
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Say hello world"
    });
    console.log("SUCCESS:", response.text);
  } catch (e) {
    console.error("FAILED:", e);
  }
}
run();
