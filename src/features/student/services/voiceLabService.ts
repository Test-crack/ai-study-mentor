/**
 * voiceLabService.ts — API calls for Voice Lab prompts.
 *
 * Uses VITE_BACKEND_URL directly (e.g. http://localhost:4000)
 * so calls go straight to the backend, not through the Vite proxy.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export interface VoicePrompt {
    id: string;
    band: string;
    feature: string;
    question: string;
    hint: string | null;
    targetWpmMin: number;
    targetWpmMax: number;
}

/**
 * Fetch a single random prompt for the given band.
 * Pass excludeIds to avoid repeating prompts (New Prompt UX).
 */
export async function fetchRandomVoicePrompt(
    band: string,
    feature: string = 'anatomy',
    excludeIds: string[] = []
): Promise<VoicePrompt> {
    const params = new URLSearchParams({ band, feature });
    if (excludeIds.length > 0) params.append('exclude', excludeIds.join(','));

    const res = await fetch(`${BACKEND_URL}/api/voice-lab/prompts/random?${params}`);
    if (!res.ok) throw new Error(`Failed to fetch voice prompt: ${res.status}`);

    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Unknown error');
    return json.data as VoicePrompt;
}

/**
 * Fetch all active prompts. Optionally filter by band and/or feature.
 */
export async function fetchVoicePrompts(
    band?: string,
    feature?: string
): Promise<VoicePrompt[]> {
    const params = new URLSearchParams();
    if (band) params.append('band', band);
    if (feature) params.append('feature', feature);

    const res = await fetch(`${BACKEND_URL}/api/voice-lab/prompts?${params}`);
    if (!res.ok) throw new Error(`Failed to fetch voice prompts: ${res.status}`);

    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Unknown error');
    return json.data as VoicePrompt[];
}
