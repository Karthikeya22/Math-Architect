import { GoogleGenAI } from "@google/genai";
async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Key length:", apiKey ? apiKey.length : 0);
  const ai = new GoogleGenAI({ apiKey });
  try {
    const res = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Hello"
    });
    console.log("SUCCESS:", res.text);
  } catch (e) {
    console.error("ERROR generating content:", e);
  }
}
test();
