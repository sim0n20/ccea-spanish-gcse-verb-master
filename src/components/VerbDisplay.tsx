import React, { useState } from 'react';
import type { Verb, VerbExplanation, ChatMessage, Tense } from '../types';
import { askVerbQuestion } from '../services/geminiService';

interface VerbDisplayProps {
    verb: Verb;
    explanation: VerbExplanation | null;
    tense: Tense;
    loading: boolean;
    activeAudioPart: 'none' | 'verb' | 'spanish' | 'english';
    onRefresh: () => void;
}

const VerbDisplay: React.FC<VerbDisplayProps> = ({
    verb,
    explanation,
    tense,
    loading,
    activeAudioPart,
    onRefresh,
}) => {
    const [chatOpen, setChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    // Speak a single Spanish phrase
    const speakSpanish = (text: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'es-ES';
        utter.rate = 0.7;
        const voices = window.speechSynthesis.getVoices();
        const esVoice = voices.find(v => v.lang.startsWith('es'));
        if (esVoice) utter.voice = esVoice;
        window.speechSynthesis.speak(utter);
    };

    const SpeakerIcon = ({ text }: { text: string }) => (
        <button
            onClick={(e) => { e.stopPropagation(); speakSpanish(text); }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 transition-all active:scale-90 ml-2 shrink-0"
            title="Listen"
        >
            <svg className="w-3.5 h-3.5 text-white/70" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" />
            </svg>
        </button>
    );

    const handleAskQuestion = async () => {
        if (!chatInput.trim() || !explanation) return;
        const question = chatInput.trim();
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', content: question }]);
        setChatLoading(true);

        try {
            const answer = await askVerbQuestion(
                question,
                verb,
                tense,
                explanation.exampleSentence,
                explanation.englishTranslation
            );
            setChatMessages(prev => [...prev, { role: 'assistant', content: answer }]);
        } catch {
            setChatMessages(prev => [
                ...prev,
                { role: 'assistant', content: 'Sorry, I had trouble answering. Please try again!' },
            ]);
        } finally {
            setChatLoading(false);
        }
    };

    const categoryColor = {
        regular: 'from-emerald-500 to-teal-600',
        irregular: 'from-rose-500 to-pink-600',
        'stem-changing': 'from-amber-500 to-orange-600',
        reflexive: 'from-violet-500 to-purple-600',
    }[verb.category];

    if (loading) {
        return (
            <div className="w-full fade-in-up">
                <div className="bg-slate-900/80 glass rounded-3xl border border-slate-700/50 p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-700/50 shimmer" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 bg-slate-700/50 rounded-lg shimmer" />
                            <div className="h-3 w-20 bg-slate-700/50 rounded-lg shimmer" />
                        </div>
                    </div>
                    <div className="h-12 bg-slate-700/50 rounded-xl shimmer" />
                    <div className="h-16 bg-slate-700/50 rounded-xl shimmer" />
                    <div className="h-16 bg-slate-700/50 rounded-xl shimmer" />
                    <div className="h-10 bg-slate-700/50 rounded-xl shimmer" />
                </div>
            </div>
        );
    }

    if (!explanation) return null;

    return (
        <div className="w-full space-y-3 fade-in-up">
            {/* Main Card */}
            <div className="bg-slate-900/80 glass rounded-3xl border border-slate-700/50 overflow-hidden">
                {/* Gradient Header */}
                <div className={`bg-gradient-to-r ${categoryColor} p-4`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight">
                                    {verb.spanish.toUpperCase()}
                                </h2>
                                <p className="text-white/70 text-sm font-medium">{verb.english}</p>
                            </div>
                            <SpeakerIcon text={verb.spanish} />
                        </div>
                        <span className="text-xs font-bold text-white/60 bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider">
                            {verb.category}
                        </span>
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    {/* Conjugation */}
                    <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/30">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                            Conjugation
                        </p>
                        <div className="flex items-center">
                            <p className={`text-xl font-black tracking-tight transition-all duration-300 ${activeAudioPart === 'verb' ? 'text-amber-400 scale-105' : 'text-white'
                                }`}>
                                {explanation.conjugation}
                            </p>
                            <button
                                onClick={() => speakSpanish(explanation.conjugation)}
                                className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-all active:scale-90 ml-2 shrink-0"
                                title="Listen"
                            >
                                <svg className="w-3.5 h-3.5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Spanish Sentence */}
                    <div className={`rounded-2xl p-4 border transition-all duration-300 ${activeAudioPart === 'spanish'
                        ? 'bg-red-500/10 border-red-500/30 ring-2 ring-red-500/20'
                        : 'bg-slate-800/40 border-slate-700/30'
                        }`}>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                            🇪🇸 Ejemplo
                        </p>
                        <div className="flex items-start gap-2">
                            <p className={`text-base font-semibold leading-relaxed transition-colors duration-300 flex-1 ${activeAudioPart === 'spanish' ? 'text-red-300' : 'text-slate-200'
                                }`}>
                                {explanation.exampleSentence}
                            </p>
                            <button
                                onClick={() => speakSpanish(explanation.exampleSentence)}
                                className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-all active:scale-90 shrink-0 mt-0.5"
                                title="Listen"
                            >
                                <svg className="w-3.5 h-3.5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* English Translation */}
                    <div className={`rounded-2xl p-4 border transition-all duration-300 ${activeAudioPart === 'english'
                        ? 'bg-blue-500/10 border-blue-500/30 ring-2 ring-blue-500/20'
                        : 'bg-slate-800/40 border-slate-700/30'
                        }`}>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                            🇬🇧 Translation
                        </p>
                        <p className={`text-base font-medium leading-relaxed transition-colors duration-300 ${activeAudioPart === 'english' ? 'text-blue-300' : 'text-slate-400'
                            }`}>
                            {explanation.englishTranslation}
                        </p>
                    </div>

                    {/* Exam Tip */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                        <p className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest mb-1">
                            💡 Exam Tip
                        </p>
                        <p className="text-sm text-amber-200/80 leading-relaxed">
                            {explanation.contextNote}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 justify-end">
                        <button
                            onClick={onRefresh}
                            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all active:scale-95 text-slate-400 hover:text-white"
                            title="Generate new example"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        <button
                            onClick={() => { setChatOpen(!chatOpen); }}
                            className={`p-3 rounded-xl transition-all active:scale-95 ${chatOpen
                                ? 'bg-indigo-500 text-white'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                                }`}
                            title="Ask the tutor"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tutor Chat Panel */}
            {chatOpen && (
                <div className="bg-slate-900/80 glass rounded-3xl border border-indigo-500/30 overflow-hidden fade-in-up">
                    <div className="bg-indigo-500/10 px-5 py-3 border-b border-indigo-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                            <h3 className="text-sm font-bold text-indigo-300">Spanish Tutor</h3>
                        </div>
                        <button
                            onClick={() => { setChatMessages([]); }}
                            className="text-[10px] font-bold text-indigo-400/60 hover:text-indigo-300 uppercase tracking-widest"
                        >
                            Clear
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="max-h-48 overflow-y-auto custom-scrollbar p-4 space-y-3">
                        {chatMessages.length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4">
                                Ask me anything about <span className="text-indigo-400 font-bold">{verb.spanish}</span> — grammar, usage, exam tips!
                            </p>
                        )}
                        {chatMessages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-indigo-500/20 text-indigo-200 rounded-br-md'
                                    : 'bg-slate-800/80 text-slate-300 rounded-bl-md'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800/80 px-4 py-3 rounded-2xl rounded-bl-md">
                                    <div className="flex gap-1.5">
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-slate-700/30">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                                placeholder="Ask a question..."
                                className="flex-1 bg-slate-800/60 border border-slate-700/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
                            />
                            <button
                                onClick={handleAskQuestion}
                                disabled={chatLoading || !chatInput.trim()}
                                className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VerbDisplay;
