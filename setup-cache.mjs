/**
 * setup-cache.mjs
 * ─────────────────────────────────────────────────────────
 * Uploads the GCSE Spanish Reference Guide to Gemini Files API,
 * creates a Context Cache, and writes the cache name to .env.
 *
 * Usage:  node setup-cache.mjs [path-to-guide]
 * Default guide path: C:\Users\simon\spanish\generated\LLM_GCSE_Spanish_Reference_Guide.txt
 */

import { GoogleGenAI, createUserContent, createPartFromUri } from '@google/genai';
import fs from 'fs';
import path from 'path';

// ─── Config ─────────────────────────────────────────────
const DEFAULT_GUIDE_PATH = String.raw`C:\Users\simon\spanish\generated\LLM_GCSE_Spanish_Reference_Guide.txt`;
const ENV_PATH = path.resolve('.env');
const MODEL_NAME = 'gemini-3-flash-preview';
const CACHE_TTL_SECONDS = 86400; // 24 hours

// ─── Read .env ──────────────────────────────────────────
function readEnv() {
    if (!fs.existsSync(ENV_PATH)) return {};
    const lines = fs.readFileSync(ENV_PATH, 'utf8').split('\n');
    const env = {};
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
            env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
        }
    }
    return env;
}

function writeEnvVar(key, value) {
    let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
        content = content.replace(regex, `${key}=${value}`);
    } else {
        content = content.trimEnd() + `\n${key}=${value}\n`;
    }
    fs.writeFileSync(ENV_PATH, content, 'utf8');
}

// ─── Main ───────────────────────────────────────────────
async function main() {
    const guidePath = process.argv[2] || DEFAULT_GUIDE_PATH;

    console.log('📚 CCEA Spanish Verb Master — Context Cache Setup');
    console.log('──────────────────────────────────────────────────');

    // 1. Read API key
    const env = readEnv();
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_KEY_HERE') {
        console.error('❌ GEMINI_API_KEY not set in .env');
        process.exit(1);
    }
    console.log('✅ API key found');

    // 2. Check guide file exists
    if (!fs.existsSync(guidePath)) {
        console.error(`❌ Reference guide not found at: ${guidePath}`);
        console.error('   Pass the path as an argument: node setup-cache.mjs /path/to/guide.txt');
        process.exit(1);
    }
    const fileSize = fs.statSync(guidePath).size;
    console.log(`✅ Reference guide found (${(fileSize / 1024).toFixed(1)} KB)`);

    // 3. Init client
    const ai = new GoogleGenAI({ apiKey });

    // 4. Upload file
    console.log('⬆️  Uploading reference guide to Gemini Files API...');
    const doc = await ai.files.upload({
        file: guidePath,
        config: { mimeType: 'text/plain' },
    });
    console.log(`✅ File uploaded: ${doc.name}`);

    // 5. Create cache
    console.log('🗃️  Creating context cache...');
    const cache = await ai.caches.create({
        model: MODEL_NAME,
        config: {
            contents: createUserContent(createPartFromUri(doc.uri, doc.mimeType)),
            systemInstruction: `You are a CCEA GCSE Spanish teaching assistant with access to the complete CCEA GCSE Spanish Reference Guide. This guide contains:
- Past paper questions and answers from real CCEA exams
- Marking schemes and assessment criteria
- High-frequency vocabulary lists (verbs, adjectives, connectives)
- Knowledge progression blueprints (Stages A-D)
- Theme-specific content across all 3 CCEA theme areas
- Question type patterns and answer structures

Use this reference guide as your PRIMARY source for generating authentic, exam-aligned content. When creating examples, model them on real past-paper patterns. When giving tips, reference actual marking criteria. Keep all content age-appropriate for GCSE students (14-16 years old).`,
            ttl: `${CACHE_TTL_SECONDS}s`,
            displayName: 'CCEA_Spanish_Reference_Guide',
        },
    });
    console.log(`✅ Cache created: ${cache.name}`);
    console.log(`   Expires: ${cache.expireTime}`);

    // 6. Write to .env
    writeEnvVar('GEMINI_CACHE_NAME', cache.name);
    console.log(`✅ Written GEMINI_CACHE_NAME to .env`);

    console.log('');
    console.log('──────────────────────────────────────────────────');
    console.log('🎉 Done! Restart the dev server to pick up the cache.');
    console.log(`   Cache TTL: ${CACHE_TTL_SECONDS / 60} minutes`);
    console.log(`   Re-run this script when the cache expires.`);
}

main().catch((err) => {
    console.error('❌ Error:', err.message || err);
    process.exit(1);
});
