import { Tense, GCSETheme, Tier, GrammaticalPerson } from '../types';
import type { Verb, VerbExplanation } from '../types';

const RAW_API_BASE = (import.meta as any).env.VITE_API_BASE_URL || '/api';
const API_BASE = RAW_API_BASE.endsWith('/') ? RAW_API_BASE.slice(0, -1) : RAW_API_BASE;

type VerbQuestionResponse = { answer: string };

export async function getAiConfig(): Promise<{ model: string }> {
    try {
        const response = await fetch(`${API_BASE}/config`);
        if (!response.ok) return { model: 'gemini-2.5-flash' };
        return await response.json();
    } catch {
        return { model: 'gemini-2.5-flash' };
    }
}

export async function getVerbExplanation(
    verb: Verb,
    tense: Tense,
    theme: GCSETheme,
    tier: Tier,
    person: GrammaticalPerson
): Promise<VerbExplanation> {
    const response = await postJSON<unknown>('/verb-explanation', {
        verb,
        tense,
        theme,
        tier,
        person,
    });

    return assertVerbExplanation(response);
}

export async function askVerbQuestion(
    question: string,
    verb: Verb,
    tense: Tense,
    currentSentence: string,
    currentTranslation: string
): Promise<string> {
    const response = await postJSON<VerbQuestionResponse>('/verb-question', {
        question,
        verb,
        tense,
        currentSentence,
        currentTranslation,
    });

    if (!response?.answer || typeof response.answer !== 'string') {
        throw new Error('Invalid AI response: missing answer text.');
    }

    const trimmed = response.answer.trim();
    if (!trimmed) {
        throw new Error('Invalid AI response: empty answer text.');
    }

    return trimmed;
}

async function postJSON<T>(path: string, payload: unknown): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const raw = await response.text();
    let parsed: any = null;

    if (raw) {
        try {
            parsed = JSON.parse(raw);
        } catch {
            parsed = null;
        }
    }

    if (!response.ok) {
        const message = parsed?.error || parsed?.details || raw || `API request failed (${response.status})`;
        throw new Error(String(message));
    }

    if (parsed === null) {
        throw new Error('Invalid API response: expected JSON body.');
    }

    return parsed as T;
}

function assertVerbExplanation(value: unknown): VerbExplanation {
    const data = value as Partial<VerbExplanation>;

    if (
        !data ||
        typeof data.conjugation !== 'string' ||
        typeof data.exampleSentence !== 'string' ||
        typeof data.englishTranslation !== 'string' ||
        typeof data.contextNote !== 'string'
    ) {
        throw new Error('Invalid AI response: missing explanation fields.');
    }

    return {
        conjugation: data.conjugation,
        exampleSentence: data.exampleSentence,
        englishTranslation: data.englishTranslation,
        contextNote: data.contextNote,
    };
}
