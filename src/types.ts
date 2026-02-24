
export interface Verb {
    spanish: string;
    english: string;
    category: 'regular' | 'irregular' | 'stem-changing' | 'reflexive';
}

// Using const objects instead of enums for erasableSyntaxOnly compliance

export const Tense = {
    PRESENT: 'Present',
    PRETERITE: 'Preterite (Past)',
    IMPERFECT: 'Imperfect (Past)',
    FUTURE: 'Future',
    CONDITIONAL: 'Conditional',
} as const;
export type Tense = (typeof Tense)[keyof typeof Tense];

export const GCSETheme = {
    // Theme 1: Identity, Lifestyle & Culture
    FAMILY: 'Myself, family, and relationships',
    SOCIAL_MEDIA: 'Social media and technology',
    FREE_TIME: 'Free time and leisure',
    ROUTINE: 'Daily routine and celebrations',
    // Theme 2: Local, National & Global Interests
    LOCAL_AREA: 'My local area',
    TRAVEL: 'Travel and tourism',
    GLOBAL_CHALLENGES: 'Global challenges (Environment/Social)',
    FESTIVALS: 'Spanish festivals',
    // Theme 3: School & World of Work
    SCHOOL_LIFE: 'School life',
    STUDIES: 'Studies and pressure',
    FUTURE_PLANS: 'Future plans (Uni/Careers)',
    JOBS: 'Part-time jobs and work experience',
} as const;
export type GCSETheme = (typeof GCSETheme)[keyof typeof GCSETheme];

export const Tier = {
    FOUNDATION: 'Foundation',
    HIGHER: 'Higher',
} as const;
export type Tier = (typeof Tier)[keyof typeof Tier];

export const GrammaticalPerson = {
    YO: 'Yo (I)',
    TU: 'Tú (You)',
    EL_ELLA: 'Él/Ella (He/She)',
    NOSOTROS: 'Nosotros (We)',
    ELLOS_ELLAS: 'Ellos/Ellas (They)',
} as const;
export type GrammaticalPerson = (typeof GrammaticalPerson)[keyof typeof GrammaticalPerson];

export interface VerbExplanation {
    conjugation: string;
    exampleSentence: string;
    englishTranslation: string;
    contextNote: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}
