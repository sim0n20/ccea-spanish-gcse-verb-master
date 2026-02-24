import type { Verb } from './types';

// Verb bank sourced from CCEA past-paper corpus frequency analysis
// Top 50 verbs ranked by frequency and spread across exam papers
export const CCEA_VERBS: Verb[] = [
    // --- Highest frequency (spread 5 papers) ---
    { spanish: 'ser', english: 'to be (permanent)', category: 'irregular' },
    { spanish: 'haber', english: 'to have (auxiliary)', category: 'irregular' },
    { spanish: 'tener', english: 'to have', category: 'irregular' },
    { spanish: 'estar', english: 'to be (temporary/location)', category: 'irregular' },
    { spanish: 'gustar', english: 'to like', category: 'irregular' },
    { spanish: 'hacer', english: 'to do/make', category: 'irregular' },
    { spanish: 'poder', english: 'to be able to', category: 'stem-changing' },
    { spanish: 'ir', english: 'to go', category: 'irregular' },
    { spanish: 'encantar', english: 'to love (something)', category: 'regular' },
    { spanish: 'querer', english: 'to want', category: 'stem-changing' },
    { spanish: 'creer', english: 'to believe', category: 'regular' },
    { spanish: 'escribir', english: 'to write', category: 'regular' },
    { spanish: 'comprar', english: 'to buy', category: 'regular' },
    { spanish: 'preferir', english: 'to prefer', category: 'stem-changing' },
    { spanish: 'dar', english: 'to give', category: 'irregular' },
    // --- High frequency (spread 4 papers) ---
    { spanish: 'trabajar', english: 'to work', category: 'regular' },
    { spanish: 'usar', english: 'to use', category: 'regular' },
    { spanish: 'vivir', english: 'to live', category: 'regular' },
    { spanish: 'ver', english: 'to see', category: 'irregular' },
    { spanish: 'decir', english: 'to say/tell', category: 'irregular' },
    { spanish: 'poner', english: 'to put', category: 'irregular' },
    { spanish: 'salir', english: 'to go out', category: 'irregular' },
    { spanish: 'ahorrar', english: 'to save (money)', category: 'regular' },
    { spanish: 'pasar', english: 'to spend (time)/happen', category: 'regular' },
    { spanish: 'ganar', english: 'to earn/win', category: 'regular' },
    // --- Medium frequency (spread 3 papers) ---
    { spanish: 'llevar', english: 'to wear/carry', category: 'regular' },
    { spanish: 'ayudar', english: 'to help', category: 'regular' },
    { spanish: 'pensar', english: 'to think', category: 'stem-changing' },
    { spanish: 'vender', english: 'to sell', category: 'regular' },
    { spanish: 'aprender', english: 'to learn', category: 'regular' },
    { spanish: 'hablar', english: 'to speak', category: 'regular' },
    { spanish: 'viajar', english: 'to travel', category: 'regular' },
    { spanish: 'venir', english: 'to come', category: 'irregular' },
    { spanish: 'comer', english: 'to eat', category: 'regular' },
    { spanish: 'beber', english: 'to drink', category: 'regular' },
    { spanish: 'dormir', english: 'to sleep', category: 'stem-changing' },
    { spanish: 'estudiar', english: 'to study', category: 'regular' },
    { spanish: 'jugar', english: 'to play', category: 'stem-changing' },
    { spanish: 'leer', english: 'to read', category: 'regular' },
    { spanish: 'conocer', english: 'to know (people/places)', category: 'irregular' },
    { spanish: 'saber', english: 'to know (info)', category: 'irregular' },
    { spanish: 'volver', english: 'to return', category: 'stem-changing' },
    { spanish: 'llegar', english: 'to arrive', category: 'regular' },
];

export const APP_CONFIG = {
    AUTOPLAY_DELAY_MS: 3000,
};
