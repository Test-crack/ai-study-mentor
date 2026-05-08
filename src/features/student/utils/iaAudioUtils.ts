/**
 * IA Audio Utilities
 * 
 * Helper functions for handling audio URLs in Internal Assessment sessions.
 * Audio files are served from the frontend's public folder for simplicity.
 */

/**
 * Transforms a relative audio URL to use the public folder
 * 
 * @param audioUrl - Relative path from database (e.g., "/ia/audio/listening_beg_1.mp3")
 * @returns Public folder path that works in both dev and production
 * 
 * @example
 * transformAudioUrl("/ia/audio/listening_beg_1.mp3")
 * // Returns: "/ia/audio/listening_beg_1.mp3" (served from public folder)
 */
export function transformAudioUrl(
  audioUrl: string | null
): string | null {
  if (!audioUrl) return null;
  
  // If already a full URL (starts with http:// or https://), extract the path
  if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
    try {
      const url = new URL(audioUrl);
      return url.pathname;
    } catch {
      return audioUrl;
    }
  }
  
  // If relative path (starts with /), return as-is (will be served from public folder)
  if (audioUrl.startsWith('/')) {
    return audioUrl;
  }
  
  // Otherwise, prepend / to make it a public folder path
  return `/${audioUrl}`;
}

/**
 * Transforms all audio URLs in IA sections to use public folder
 * 
 * @param sections - Array of IA sections from backend response
 * @returns Sections with transformed audio URLs
 */
export function transformSectionAudioUrls<T extends { audio_url: string | null }>(
  sections: T[]
): T[] {
  return sections.map(section => ({
    ...section,
    audio_url: transformAudioUrl(section.audio_url)
  }));
}

/**
 * Validates if an audio URL is accessible
 * 
 * @param audioUrl - Audio URL to validate (relative path from public folder)
 * @returns Promise that resolves to true if audio is accessible
 */
export async function validateAudioUrl(audioUrl: string): Promise<boolean> {
  try {
    const response = await fetch(audioUrl, { method: 'HEAD' });
    return response.ok && response.headers.get('content-type')?.includes('audio');
  } catch {
    return false;
  }
}

/**
 * Preloads an audio file for smoother playback
 * 
 * @param audioUrl - Audio URL to preload (relative path from public folder)
 * @returns Promise that resolves when audio is loaded
 */
export function preloadAudio(audioUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.oncanplaythrough = () => resolve();
    audio.onerror = () => reject(new Error(`Failed to load audio: ${audioUrl}`));
    audio.src = audioUrl;
  });
}
