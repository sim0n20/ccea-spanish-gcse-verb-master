import { GoogleGenAI } from '@google/genai';

// Types matching the frontend
interface VerbExplanationRequest {
    verb: { spanish: string; english: string; category: string };
    tense: string;
    theme: string;
    tier: string;
    person: string;
}

const MODEL_NAME = 'gemini-2.5-flash';

const SYSTEM_PROMPT_CACHED = `You are a CCEA GCSE Spanish teaching assistant. You have access to the complete CCEA GCSE Spanish Reference Guide in your context, which contains real past-paper questions, marking schemes, high-frequency vocabulary, and knowledge progression blueprints.

CRITICAL RULES:
- Draw on the Reference Guide's past-paper corpus to create authentic, exam-aligned examples.
- Model example sentences on real past-paper answer patterns from the guide.
- Use the guide's high-frequency vocabulary and set phrases.
- Reference actual marking criteria when giving exam tips.
- Keep feedback age-appropriate, concrete, and concise.
- Avoid shaming language; use actionable correction.
- Foundation tier: use simpler, high-frequency vocabulary and shorter sentences.
- Higher tier: use complex structures, multiple tenses, connectives (sin embargo, además, por lo tanto), and justified opinions.
- Always produce grammatically correct, natural-sounding Spanish.
- The example sentence MUST use the specified verb in the specified tense and person.
- The contextNote should be a brief, practical exam tip relevant to the verb/tense combination, referencing marking criteria where possible.`;

const SYSTEM_PROMPT_DEFAULT = `You are a CCEA GCSE Spanish teaching assistant. Your role is to help students master verb conjugation through contextualised practice.

CRITICAL RULES:
- Use past-paper wording and answer logic as your primary style model.
- Keep feedback age-appropriate, concrete, and concise.
- Avoid shaming language; use actionable correction.
- Keep examples age-appropriate (school, hobbies, family, travel, health, work experience).
- Foundation tier: use simpler, high-frequency vocabulary and shorter sentences.
- Higher tier: use complex structures, multiple tenses, connectives (sin embargo, además, por lo tanto), and justified opinions.
- Always produce grammatically correct, natural-sounding Spanish.
- The example sentence MUST use the specified verb in the specified tense and person.
- The contextNote should be a brief, practical exam tip relevant to the verb/tense combination.

CCEA GCSE Spanish Assessment covers:
- Theme 1: Identity, Lifestyle & Culture (family, social media, free time, daily routine)
- Theme 2: Local, National & Global Interests (local area, travel, global challenges, Spanish festivals)
- Theme 3: School & World of Work (school life, studies, future plans, jobs)

Knowledge Progression:
- Stage A: high-frequency vocab + present tense + set phrases
- Stage B: past/future references + opinions + reasons (porque, creo que)
- Stage C: translation precision + inferencing
- Stage D: extended writing control (tense variety + connectors + justification)`;

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
        const { verb, tense, theme, tier, person } = req.body as VerbExplanationRequest;

        if (!verb?.spanish || !tense || !theme || !tier || !person) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const ai = new GoogleGenAI({ apiKey });
        const seed = Date.now();

        const prompt = `Generate a CCEA GCSE Spanish verb lesson card.

Verb: ${verb.spanish} (${verb.english})
Verb type: ${verb.category}
Tense: ${tense}
Grammatical person: ${person}
GCSE Theme context: ${theme}
Tier: ${tier}
Random seed for variety: ${seed}

You MUST respond with ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "conjugation": "the conjugated form of the verb in the specified tense and person",
  "exampleSentence": "a natural Spanish sentence using this conjugation within the theme context",
  "englishTranslation": "accurate English translation of the example sentence",
  "contextNote": "a brief CCEA exam tip about this verb/tense (max 2 sentences)"
}`;

        const config: any = {
            temperature: 0.9,
        };
        if (cacheName) {
            config.cachedContent = cacheName;
        } else {
            config.systemInstruction = SYSTEM_PROMPT_DEFAULT;
        }

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config,
        });

        let text = '';
        if (typeof response.text === 'string') {
            text = response.text.trim();
        } else if (response.candidates && response.candidates[0]) {
            const parts = response.candidates[0].content?.parts;
            if (parts && parts[0] && 'text' in parts[0]) {
                text = (parts[0] as any).text.trim();
            }
        }

        if (!text) {
            return res.status(502).json({ error: 'Empty response from AI' });
        }

        // Parse JSON
        let cleaned = text;
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
        }
        cleaned = cleaned.trim();

        const parsed = JSON.parse(cleaned);
        if (!parsed.conjugation || !parsed.exampleSentence || !parsed.englishTranslation || !parsed.contextNote) {
            return res.status(502).json({ error: 'Invalid AI response structure' });
        }

        return res.status(200).json({
            conjugation: String(parsed.conjugation),
            exampleSentence: String(parsed.exampleSentence),
            englishTranslation: String(parsed.englishTranslation),
            contextNote: String(parsed.contextNote),
        });
    } catch (err: any) {
        console.error('verb-explanation error:', err);
        const status = err.message?.includes('429') ? 429 : 500;
        return res.status(status).json({ error: err.message || 'Internal server error' });
    }
}
