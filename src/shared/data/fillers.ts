/**
 * FILLER_WORDS — comprehensive list of English filler words and phrases.
 *
 * Rule: A token is only flagged as a filler if it exists in this list
 * AND it does NOT appear anywhere in the user's speaking prompt text.
 * This avoids false positives (e.g. "actually" in "Tell me what you actually did...").
 */
export const FILLER_WORDS: string[] = [
    // Hesitation sounds
    "um", "uh", "ah", "er", "err", "hmm", "hm", "erm", "uhm", "umm",

    // Very common verbal fillers
    "like", "so", "right", "okay", "ok", "well", "now", "then",
    "just", "basically", "actually", "literally", "honestly", "frankly",
    "obviously", "clearly", "definitely", "totally", "absolutely",
    "certainly", "surely", "naturally", "apparently",

    // Thinking phrases
    "you know", "i mean", "you see", "i think", "i guess", "i suppose",
    "you know what", "i feel like", "let me think", "how do i say",
    "what i mean is", "what i'm saying is", "the thing is",

    // Hedge phrases
    "sort of", "kind of", "more or less", "somewhat", "pretty much",
    "in a way", "in a sense", "in some ways", "more or less",

    // Transition fillers
    "anyway", "anyways", "anyhow", "and so", "and then", "but then",
    "so yeah", "so like", "right so",

    // Opinion softeners used as fillers
    "to be honest", "to be fair", "to tell you the truth",
    "at the end of the day", "if you will", "so to speak",
    "as it were", "per se",

    // Redundant affirmatives
    "yeah", "yep", "yup", "yes yes", "no no",

    // Filler adjectives & nouns
    "stuff", "things", "something", "whatever", "etc",

    // Very specific common filler combos
    "and stuff", "and things", "or whatever", "or something",
    "you know what i mean", "do you know what i mean",
    "if that makes sense", "does that make sense",
];

/** Converts a FILLER_WORDS entry to a regex-compatible pattern. */
function filler_to_pattern(f: string): string {
    return f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // escape special chars
}

/**
 * Build a single compiled RegExp to test against a full transcript string.
 * Uses word boundaries so "like" doesn't match "likely".
 */
export const FILLERS_REGEX = new RegExp(
    `\\b(${FILLER_WORDS.map(filler_to_pattern).join("|")})\\b`,
    "gi"
);

/**
 * Detect fillers in a transcript, excluding any words that appear in the prompt.
 *
 * @param transcript  The final transcript string.
 * @param promptText  The speaking prompt text shown to the user (exclusion list).
 * @returns Object with total count and per-word counts.
 */
export function detectFillers(
    transcript: string,
    promptText: string
): { total: number; counts: Record<string, number> } {
    // Build exclusion set from the prompt (lowercase, cleaned)
    const promptTokens = new Set(
        promptText
            .toLowerCase()
            .split(/\s+/)
            .map((w) => w.replace(/[^a-z\s]/g, "").trim())
            .filter(Boolean)
    );

    const counts: Record<string, number> = {};
    let total = 0;

    const matches = transcript.matchAll(FILLERS_REGEX);
    for (const match of matches) {
        const word = match[0].toLowerCase().trim();
        // Skip if this filler word appears in the prompt
        if (promptTokens.has(word)) continue;
        counts[word] = (counts[word] || 0) + 1;
        total++;
    }

    return { total, counts };
}

/**
 * Checks if a single word (already lowercased, cleaned of punctuation) is a filler.
 * Uses a Set for O(1) lookup.
 */
export const FILLER_SET = new Set(FILLER_WORDS);

export function isFiller(word: string): boolean {
    return FILLER_SET.has(word.toLowerCase().trim());
}
