/**
 * ANATOMY_PROMPTS — static speaking prompt bank for Speech Anatomy feature.
 *
 * Each prompt is a realistic IELTS Speaking Part 2 style topic.
 * Grouped by target band. One prompt is randomly selected at session start.
 *
 * TODO: Replace with API fetch from backend/database in a future iteration.
 */

export type AnatomyBand = "Band 5" | "Band 6" | "Band 7" | "Band 8";

export interface AnatomyPrompt {
    id: string;
    question: string;
    hint: string; // 1 short tip shown below the prompt
    targetWpm: { min: number; max: number };
}

export const ANATOMY_PROMPTS: Record<AnatomyBand, AnatomyPrompt[]> = {
    "Band 5": [
        {
            id: "b5-1",
            question: "Describe your hometown. What do you like about it?",
            hint: "Speak naturally. Mention location, things to do, and why you enjoy it.",
            targetWpm: { min: 110, max: 140 },
        },
        {
            id: "b5-2",
            question: "Talk about your favourite food. Why do you enjoy eating it?",
            hint: "Describe the taste, where you eat it, and how often.",
            targetWpm: { min: 110, max: 140 },
        },
        {
            id: "b5-3",
            question: "Describe a hobby you enjoy in your free time.",
            hint: "Explain when you started, what you do, and how it makes you feel.",
            targetWpm: { min: 110, max: 140 },
        },
        {
            id: "b5-4",
            question: "Talk about a person in your family who is important to you.",
            hint: "Describe who they are, what they do, and why they matter to you.",
            targetWpm: { min: 110, max: 140 },
        },
    ],

    "Band 6": [
        {
            id: "b6-1",
            question:
                "Describe a time when you learned something new. What was it and how did you learn it?",
            hint: "Use past tense. Include a specific example and what you found challenging.",
            targetWpm: { min: 125, max: 155 },
        },
        {
            id: "b6-2",
            question:
                "Talk about a place you have visited that left a strong impression on you.",
            hint: "Describe the location, what you saw and how it made you feel.",
            targetWpm: { min: 125, max: 155 },
        },
        {
            id: "b6-3",
            question:
                "Describe a goal you have for the future. Explain why it is important to you.",
            hint: "Be specific about the goal and give reasons. Include a timeframe if possible.",
            targetWpm: { min: 125, max: 155 },
        },
        {
            id: "b6-4",
            question:
                "Describe a book, film, or show that you enjoyed. Why would you recommend it?",
            hint: "Briefly summarise the story without spoilers, then explain the impact it had on you.",
            targetWpm: { min: 125, max: 155 },
        },
    ],

    "Band 7": [
        {
            id: "b7-1",
            question:
                "Some people believe technology has made human relationships less meaningful. To what extent do you agree?",
            hint: "Present a balanced view. Use examples and link ideas clearly with discourse markers.",
            targetWpm: { min: 140, max: 165 },
        },
        {
            id: "b7-2",
            question:
                "Describe a situation where you had to solve a difficult problem under pressure. How did you handle it?",
            hint: "Use rich vocabulary. Show your thought process and reflect on the outcome.",
            targetWpm: { min: 140, max: 165 },
        },
        {
            id: "b7-3",
            question:
                "Many young people today prefer to work remotely rather than in an office. Discuss the advantages and disadvantages.",
            hint: "Cover both sides equally. Avoid repeating vocabulary — use synonyms and paraphrasing.",
            targetWpm: { min: 140, max: 165 },
        },
        {
            id: "b7-4",
            question:
                "Describe a person who has significantly influenced your thinking or career. How did they do this?",
            hint: "Focus on specific interactions or moments. Use a range of tenses accurately.",
            targetWpm: { min: 140, max: 165 },
        },
    ],

    "Band 8": [
        {
            id: "b8-1",
            question:
                "Critically evaluate the impact of social media on political discourse in democratic societies.",
            hint: "Demonstrate sophisticated vocabulary. Show nuanced reasoning and avoid oversimplifying.",
            targetWpm: { min: 150, max: 175 },
        },
        {
            id: "b8-2",
            question:
                "To what extent should governments intervene in the regulation of artificial intelligence?",
            hint: "Argue a clear position with evidence. Use conditionals, hedging language, and cohesive devices.",
            targetWpm: { min: 150, max: 175 },
        },
        {
            id: "b8-3",
            question:
                "Discuss the ethical implications of genetic engineering in healthcare versus agricultural applications.",
            hint: "Compare two domains precisely. Show command of technical and abstract vocabulary.",
            targetWpm: { min: 150, max: 175 },
        },
        {
            id: "b8-4",
            question:
                "Analyse how globalisation has reshaped cultural identity among young people worldwide.",
            hint: "Use sophisticated linking phrases. Integrate specific examples from different regions.",
            targetWpm: { min: 150, max: 175 },
        },
    ],
};

/**
 * Pick a pseudo-random prompt from a given band.
 * Shuffles on seed based on current date so it changes daily,
 * but remains stable within a session.
 */
export function getRandomPrompt(band: AnatomyBand): AnatomyPrompt {
    const prompts = ANATOMY_PROMPTS[band];
    const seed = new Date().getDate(); // changes daily
    const index = seed % prompts.length;
    return prompts[index];
}

export const ALL_BANDS: AnatomyBand[] = ["Band 5", "Band 6", "Band 7", "Band 8"];
