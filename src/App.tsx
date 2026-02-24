import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CCEA_VERBS } from './constants';
import { Tense, GCSETheme, Tier, GrammaticalPerson } from './types';
import type { VerbExplanation } from './types';
import { getVerbExplanation, getAiConfig } from './services/geminiService';
import VerbDisplay from './components/VerbDisplay';

const App: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTense, setCurrentTense] = useState<Tense>(Tense.PRESENT);
  const [currentTheme, setCurrentTheme] = useState<GCSETheme>(GCSETheme.FAMILY);
  const [currentTier, setCurrentTier] = useState<Tier>(Tier.FOUNDATION);
  const [currentPerson, setCurrentPerson] = useState<GrammaticalPerson>(GrammaticalPerson.YO);
  const [activeModelName, setActiveModelName] = useState<string>('Flash 2.5');
  const [explanation, setExplanation] = useState<VerbExplanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutoplaying, setIsAutoplaying] = useState(false);
  const [activeAudioPart, setActiveAudioPart] = useState<'none' | 'verb' | 'spanish' | 'english'>('none');

  const isComponentMounted = useRef(true);
  const isAutoplayingRef = useRef(false);
  const speechRef = useRef<SpeechSynthesis | null>(window.speechSynthesis);
  const spanishVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const englishVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const activeUtterances = useRef<SpeechSynthesisUtterance[]>([]);

  // ─── Voice Setup ──────────────────────────────────────────
  const findBestVoices = useCallback(() => {
    if (!speechRef.current) return;
    const allVoices = speechRef.current.getVoices();

    const spanishVoices = allVoices.filter(v => v.lang.startsWith('es'));
    spanishVoiceRef.current =
      spanishVoices.find(v => v.name.includes('Neural') || v.name.includes('Premium') || v.name.includes('Natural')) ||
      spanishVoices.find(v => v.name.includes('Helena') || v.name.includes('Monica') || v.name.includes('Lucia')) ||
      spanishVoices[0] ||
      null;

    const englishVoices = allVoices.filter(v => v.lang.startsWith('en'));
    englishVoiceRef.current =
      englishVoices.find(v => v.name.includes('Female') && v.lang.includes('GB')) ||
      englishVoices.find(v => v.name.includes('Female')) ||
      englishVoices[0] ||
      null;
  }, []);

  useEffect(() => {
    if (!speechRef.current) return;
    findBestVoices();
    if (speechRef.current.onvoiceschanged !== undefined) {
      speechRef.current.onvoiceschanged = findBestVoices;
    }
  }, [findBestVoices]);

  useEffect(() => {
    // Disable logging warnings for cleaner console
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('speechSynthesis')) return;
      originalWarn(...args);
    };

    // Pre-warm the context cache and fetch config
    getAiConfig().then((config) => {
      if (config.model.includes('3-flash')) {
        setActiveModelName('Flash 3.0');
      } else {
        setActiveModelName('Flash 2.5');
      }
    });

    // Do a dummy request just to wake up Vercel completely in the background
    getVerbExplanation(
      { spanish: 'ser', english: 'to be', category: 'irregular' },
      Tense.PRESENT,
      currentTheme,
      Tier.HIGHER,
      GrammaticalPerson.YO
    ).catch(() => { });
  }, []);

  // ─── Speech Controls ─────────────────────────────────────
  const stopAllSpeech = useCallback(() => {
    if (speechRef.current) speechRef.current.cancel();
    activeUtterances.current = [];
    setActiveAudioPart('none');
  }, []);

  const handleNext = useCallback(() => {
    stopAllSpeech();
    setCurrentIndex(prev => (prev + 1) % CCEA_VERBS.length);
  }, [stopAllSpeech]);

  const handlePrev = useCallback(() => {
    stopAllSpeech();
    setCurrentIndex(prev => (prev - 1 + CCEA_VERBS.length) % CCEA_VERBS.length);
  }, [stopAllSpeech]);

  // Speak sequence: verb(ES) → meaning(EN) → conjugation(ES) → sentence(ES) → translation(EN) → exam tip(EN)
  const speakSequence = useCallback((exp: VerbExplanation) => {
    if (!speechRef.current) return;
    stopAllSpeech();

    const currentVerb = CCEA_VERBS[currentIndex];

    // 6. Exam tip (EN) — final item, then advance
    const utterTip = new SpeechSynthesisUtterance(exp.contextNote);
    if (englishVoiceRef.current) utterTip.voice = englishVoiceRef.current;
    utterTip.lang = 'en-GB';
    utterTip.rate = 1.0;
    utterTip.onstart = () => setActiveAudioPart('english');
    utterTip.onend = () => {
      setActiveAudioPart('none');
      if (isAutoplayingRef.current && isComponentMounted.current) {
        setTimeout(() => {
          if (isAutoplayingRef.current && isComponentMounted.current) {
            handleNext();
          }
        }, 3000);
      }
    };

    // 5. English translation
    const utterTranslation = new SpeechSynthesisUtterance(exp.englishTranslation);
    if (englishVoiceRef.current) utterTranslation.voice = englishVoiceRef.current;
    utterTranslation.lang = 'en-GB';
    utterTranslation.rate = 1.0;
    utterTranslation.onstart = () => setActiveAudioPart('english');
    utterTranslation.onend = () => {
      if (isComponentMounted.current) speechRef.current?.speak(utterTip);
    };

    // 4. Spanish sentence
    const utterSpanish = new SpeechSynthesisUtterance(exp.exampleSentence);
    if (spanishVoiceRef.current) utterSpanish.voice = spanishVoiceRef.current;
    utterSpanish.lang = 'es-ES';
    utterSpanish.rate = 0.7;
    utterSpanish.onstart = () => setActiveAudioPart('spanish');
    utterSpanish.onend = () => {
      if (isComponentMounted.current) speechRef.current?.speak(utterTranslation);
    };

    // 3. Conjugation in Spanish
    const utterConjugation = new SpeechSynthesisUtterance(exp.conjugation);
    if (spanishVoiceRef.current) utterConjugation.voice = spanishVoiceRef.current;
    utterConjugation.lang = 'es-ES';
    utterConjugation.rate = 0.7;
    utterConjugation.onstart = () => setActiveAudioPart('verb');
    utterConjugation.onend = () => {
      if (isComponentMounted.current) speechRef.current?.speak(utterSpanish);
    };

    // 2. Verb meaning in English
    const utterVerbEnglish = new SpeechSynthesisUtterance(currentVerb.english);
    if (englishVoiceRef.current) utterVerbEnglish.voice = englishVoiceRef.current;
    utterVerbEnglish.lang = 'en-GB';
    utterVerbEnglish.rate = 1.0;
    utterVerbEnglish.onstart = () => setActiveAudioPart('english');
    utterVerbEnglish.onend = () => {
      if (isComponentMounted.current) speechRef.current?.speak(utterConjugation);
    };

    // 1. Verb in Spanish
    const utterVerb = new SpeechSynthesisUtterance(currentVerb.spanish);
    if (spanishVoiceRef.current) utterVerb.voice = spanishVoiceRef.current;
    utterVerb.lang = 'es-ES';
    utterVerb.rate = 0.7;
    utterVerb.onstart = () => setActiveAudioPart('verb');
    utterVerb.onend = () => {
      if (isComponentMounted.current) speechRef.current?.speak(utterVerbEnglish);
    };

    activeUtterances.current = [utterVerb, utterVerbEnglish, utterConjugation, utterSpanish, utterTranslation, utterTip];
    speechRef.current.speak(utterVerb);
  }, [currentIndex, handleNext, stopAllSpeech]);

  // Keep a ref to speakSequence to avoid dependency cycles
  const speakSequenceRef = useRef(speakSequence);
  speakSequenceRef.current = speakSequence;

  // ─── Data Loading ─────────────────────────────────────────
  // Use a counter to cancel stale requests (handles React StrictMode double-fire)
  const loadIdRef = useRef(0);

  const doLoad = useCallback(async (thisLoadId: number) => {
    const currentVerb = CCEA_VERBS[currentIndex];

    try {
      const result = await getVerbExplanation(currentVerb, currentTense, currentTheme, currentTier, currentPerson);
      console.log('doLoad got result, loadId match?', thisLoadId, loadIdRef.current);
      // Only apply if this is still the latest request
      if (thisLoadId === loadIdRef.current) {
        setExplanation(result);
        setLoading(false);
        if (isAutoplayingRef.current) {
          setTimeout(() => {
            if (isAutoplayingRef.current && thisLoadId === loadIdRef.current) {
              speakSequenceRef.current(result);
            }
          }, 800);
        }
      }
    } catch (err: any) {
      console.error('API Error:', err);
      if (thisLoadId === loadIdRef.current) {
        const message = String(err?.message || 'Unknown AI error');
        const retryable = /429|5\d\d|timeout|temporar|unavailable|internal|resource exhausted/i.test(message);
        setError(retryable ? 'AI is busy, retrying...' : `AI error: ${message}`);
        setLoading(false);
      }
    }
  }, [currentIndex, currentTense, currentTheme, currentTier, currentPerson]);

  useEffect(() => {
    const thisLoadId = ++loadIdRef.current;
    setLoading(true);
    setError(null);
    setExplanation(null);
    stopAllSpeech();
    doLoad(thisLoadId);
  }, [doLoad, stopAllSpeech]);

  // For the refresh button
  const loadExplanation = useCallback(() => {
    const thisLoadId = ++loadIdRef.current;
    setLoading(true);
    setError(null);
    setExplanation(null);
    stopAllSpeech();
    doLoad(thisLoadId);
  }, [doLoad, stopAllSpeech]);

  useEffect(() => {
    return () => {
      isComponentMounted.current = false;
      isAutoplayingRef.current = false;
      stopAllSpeech();
    };
  }, [stopAllSpeech]);

  const toggleAutoplay = () => {
    const nextState = !isAutoplaying;
    setIsAutoplaying(nextState);
    isAutoplayingRef.current = nextState;
    if (nextState) {
      findBestVoices();
      if (speechRef.current) speechRef.current.cancel();
      if (explanation) speakSequence(explanation);
    } else {
      stopAllSpeech();
    }
  };

  const currentVerb = CCEA_VERBS[currentIndex];

  return (
    <div className="min-h-screen bg-slate-950 pb-28 font-sans antialiased">
      {/* Header */}
      <header className="bg-slate-900/90 glass border-b border-slate-800 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-lg mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-red-500/20">
              S
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white leading-none">CCEA Spanish</h1>
              <p className="text-[10px] font-medium text-slate-500 leading-none mt-0.5">Verb Master</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!loading && (
              <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {activeModelName} Ready
              </span>
            )}
            <div className="text-xs font-bold text-slate-500 bg-slate-800 px-2.5 py-1 rounded-lg">
              {currentIndex + 1}/{CCEA_VERBS.length}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 flex flex-col items-center max-w-lg mx-auto">
        {/* Progress bar */}
        <div className="w-full h-1 bg-slate-800 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-1000 ease-out rounded-full"
            style={{
              width: loading ? '30%' : activeAudioPart !== 'none' ? '80%' : '100%',
              opacity: isAutoplaying ? 1 : 0.4,
            }}
          />
        </div>

        {/* Verb Selection */}
        <div className="w-full mb-5 space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
            Target Verb
          </label>
          <select
            id="verb-select"
            value={currentIndex}
            onChange={(e) => setCurrentIndex(parseInt(e.target.value))}
            className="w-full bg-slate-900 border-2 border-red-500/20 focus:border-red-500 rounded-2xl p-4 text-lg font-black text-white shadow-lg outline-none transition-all cursor-pointer appearance-none"
            style={{
              backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23e11d48\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              backgroundSize: '1em',
            }}
          >
            {CCEA_VERBS.map((verb, index) => (
              <option key={verb.spanish} value={index}>
                {verb.spanish.toUpperCase()} — {verb.english}
              </option>
            ))}
          </select>
        </div>

        {/* Tier & Person Row */}
        <div className="w-full grid grid-cols-2 gap-3 mb-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
              Tier
            </label>
            <select
              id="tier-select"
              value={currentTier}
              onChange={(e) => setCurrentTier(e.target.value as Tier)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-bold text-white shadow-sm outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
            >
              {Object.values(Tier).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
              Person
            </label>
            <select
              id="person-select"
              value={currentPerson}
              onChange={(e) => setCurrentPerson(e.target.value as GrammaticalPerson)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-bold text-white shadow-sm outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
            >
              {Object.values(GrammaticalPerson).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Tense & Theme */}
        <div className="w-full mb-6 space-y-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
              Tense
            </label>
            <select
              id="tense-select"
              value={currentTense}
              onChange={(e) => setCurrentTense(e.target.value as Tense)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-semibold text-white shadow-sm outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
            >
              {Object.values(Tense).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
              GCSE Theme Area
            </label>
            <select
              id="theme-select"
              value={currentTheme}
              onChange={(e) => setCurrentTheme(e.target.value as GCSETheme)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-bold text-white shadow-sm outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
            >
              <optgroup label="1. Identity, Lifestyle & Culture">
                <option value={GCSETheme.FAMILY}>{GCSETheme.FAMILY}</option>
                <option value={GCSETheme.SOCIAL_MEDIA}>{GCSETheme.SOCIAL_MEDIA}</option>
                <option value={GCSETheme.FREE_TIME}>{GCSETheme.FREE_TIME}</option>
                <option value={GCSETheme.ROUTINE}>{GCSETheme.ROUTINE}</option>
              </optgroup>
              <optgroup label="2. Local, National & Global Interests">
                <option value={GCSETheme.LOCAL_AREA}>{GCSETheme.LOCAL_AREA}</option>
                <option value={GCSETheme.TRAVEL}>{GCSETheme.TRAVEL}</option>
                <option value={GCSETheme.GLOBAL_CHALLENGES}>{GCSETheme.GLOBAL_CHALLENGES}</option>
                <option value={GCSETheme.FESTIVALS}>{GCSETheme.FESTIVALS}</option>
              </optgroup>
              <optgroup label="3. School & World of Work">
                <option value={GCSETheme.SCHOOL_LIFE}>{GCSETheme.SCHOOL_LIFE}</option>
                <option value={GCSETheme.STUDIES}>{GCSETheme.STUDIES}</option>
                <option value={GCSETheme.FUTURE_PLANS}>{GCSETheme.FUTURE_PLANS}</option>
                <option value={GCSETheme.JOBS}>{GCSETheme.JOBS}</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="w-full bg-amber-500/10 border border-amber-500/20 text-amber-300 px-4 py-2.5 rounded-xl mb-4 text-xs font-bold animate-pulse text-center">
            {error}
          </div>
        )}

        {/* Verb Card */}
        <VerbDisplay
          verb={currentVerb}
          explanation={explanation}
          tense={currentTense}
          loading={loading}
          activeAudioPart={activeAudioPart}
          onRefresh={loadExplanation}
        />
      </main>

      {/* Floating Bottom Navigation */}
      <footer className="fixed bottom-5 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
        <div className="flex bg-slate-900/90 glass rounded-3xl shadow-2xl shadow-black/50 p-2 border border-slate-700/50 justify-around items-center ring-1 ring-white/5">
          <button
            id="prev-btn"
            onClick={handlePrev}
            className="p-3 hover:bg-slate-800 rounded-2xl transition-all text-slate-500 hover:text-red-400 active:scale-90"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            id="autoplay-btn"
            onClick={toggleAutoplay}
            className={`px-6 py-3.5 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center gap-2.5 ${isAutoplaying
              ? 'bg-slate-700 text-white ring-2 ring-white/10'
              : 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-500/30 hover:shadow-red-500/50 pulse-glow'
              }`}
          >
            {isAutoplaying ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-bold text-sm">Pause</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span className="font-bold text-sm">Teach Me</span>
              </>
            )}
          </button>

          <button
            id="next-btn"
            onClick={handleNext}
            className="p-3 hover:bg-slate-800 rounded-2xl transition-all text-slate-500 hover:text-red-400 active:scale-90"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;
