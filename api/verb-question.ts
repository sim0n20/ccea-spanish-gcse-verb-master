import { GoogleGenAI } from '@google/genai';

interface VerbQuestionRequest {
    question: string;
    verb: { spanish: string; english: string };
    tense: string;
    currentSentence: string;
    currentTranslation: string;
}

const MODEL_NAME = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `You are a CCEA GCSE Spanish teaching assistant. Your role is to help students master verb conjugation through contextualised practice.

CRITICAL RULES:
- Use past-paper wording and answer logic as your primary style model.
- Keep feedback age-appropriate, concrete, and concise.
- Avoid shaming language; use actionable correction.
- Keep examples age-appropriate.`;

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server misconfigured: missing API key' });
    }

    const cacheName = process.env.GEMINI_CACHE_NAME || '';

    try {
        const { question, verb, tense, currentSentence, currentTranslation } = req.body as VerbQuestionRequest;

        if (!question || !verb?.spanish || !tense) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const ai = new GoogleGenAI({ apiKey });

        const prompt = `A GCSE Spanish student is studying the verb "${verb.spanish}" (${verb.english}) in the ${tense} tense.

Current example sentence: "${currentSentence}"
Translation: "${currentTranslation}"

The student asks: "${question}"

Give a helpful, concise answer (max 150 words). Be encouraging and age-appropriate. Use actionable correction if needed. If relevant, give one more example.`;

        const config: any = {
            temperature: 0.7,
            maxOutputTokens: 200, // strictly limit tutor chat length to save tokens
        };
        if (cacheName) {
            config.cachedContent = cacheName;
        } else {
            config.systemInstruction = SYSTEM_PROMPT;
        }

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config,
        });

        const answer = response.text?.trim() || 'Sorry, I could not generate a response.';
        return res.status(200).json({ answer });
    } catch (err: any) {
        console.error('verb-question error:', err);
        const status = err.message?.includes('429') ? 429 : 500;
        return res.status(status).json({ error: err.message || 'Internal server error' });
    }
}
