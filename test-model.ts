import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  try {
    console.log("Testing gemini-2.5-flash");
    await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: "hi" });
    console.log("Success 2.5!");

    console.log("Testing gemini-3-flash-preview");
    await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: "hi" });
    console.log("Success 3!");
  } catch (e) {
    console.error("FAILED:", e);
  }
}
run();
