import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const cacheName = process.env.GEMINI_CACHE_NAME;

const prompt = `Generate a CCEA GCSE Spanish verb lesson card.
Verb: ser (to be)
Verb type: irregular
Tense: Present
Grammatical person: Yo (I)
GCSE Theme context: School life
Tier: Higher
Random seed for variety: 12345

You MUST respond with ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "conjugation": "...",
  "exampleSentence": "...",
  "englishTranslation": "...",
  "contextNote": "..."
}`;

const config = {
    temperature: 0.9,
    maxOutputTokens: 300,
    responseMimeType: 'application/json',
    cachedContent: cacheName
};

async function run() {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config
        });
        console.log("RAW TEXT:");
        console.log(response.text);
    } catch (e) {
        console.error("ERROR:");
        console.error(e);
    }
}
run();
