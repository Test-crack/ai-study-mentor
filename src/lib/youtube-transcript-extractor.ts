/**
 * Browser-based YouTube transcript extraction utility
 * Extracts captions directly from YouTube's player response in the browser context
 */

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  name: { simpleText: string };
}

interface PlayerResponse {
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[];
    };
  };
}

/**
 * Extracts transcript from YouTube player response available in browser context
 * @param videoId - YouTube video ID
 * @returns Array of transcript segments with text, start time, and duration
 */
export async function extractTranscriptFromBrowser(
  videoId: string
): Promise<TranscriptSegment[]> {
  // Access YouTube's player response from global window object
  const playerResponse = getPlayerResponse();

  if (!playerResponse) {
    throw new Error("YouTube player response not found in browser context");
  }

  const tracks = getCaptionTracks(playerResponse);

  if (!tracks || tracks.length === 0) {
    throw new Error("No captions available for this video");
  }

  // Select preferred caption track (English first, then fallback to first available)
  const track = selectPreferredTrack(tracks);

  // Fetch and parse the caption XML
  const segments = await fetchAndParseCaptions(track.baseUrl);

  return segments;
}

/**
 * Retrieves YouTube player response from browser globals
 */
function getPlayerResponse(): PlayerResponse | null {
  const win = window as any;

  // Try ytInitialPlayerResponse first (most common)
  if (win.ytInitialPlayerResponse) {
    return win.ytInitialPlayerResponse;
  }

  // Fallback to ytplayer config
  if (win.ytplayer?.config?.args?.player_response) {
    try {
      return JSON.parse(win.ytplayer.config.args.player_response);
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Extracts caption tracks from player response
 */
function getCaptionTracks(
  playerResponse: PlayerResponse
): CaptionTrack[] | null {
  return (
    playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks ||
    null
  );
}

/**
 * Selects the preferred caption track (English preferred, then first available)
 */
function selectPreferredTrack(tracks: CaptionTrack[]): CaptionTrack {
  const preferredLanguages = ["en", "en-US", "en-GB"];

  for (const lang of preferredLanguages) {
    const track = tracks.find((t) => t.languageCode === lang);
    if (track) return track;
  }

  // Fallback to first available track
  return tracks[0];
}

/**
 * Fetches caption XML from YouTube and parses it into transcript segments
 */
async function fetchAndParseCaptions(
  baseUrl: string
): Promise<TranscriptSegment[]> {
  const response = await fetch(baseUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch captions: ${response.statusText}`);
  }

  const xml = await response.text();
  return parseTranscriptXML(xml);
}

/**
 * Parses YouTube caption XML into structured transcript segments
 */
function parseTranscriptXML(xml: string): TranscriptSegment[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, "text/xml");

  const textNodes = Array.from(xmlDoc.getElementsByTagName("text"));

  return textNodes.map((node) => ({
    text: decodeHTMLEntities(node.textContent || ""),
    start: parseFloat(node.getAttribute("start") || "0"),
    duration: parseFloat(node.getAttribute("dur") || "0"),
  }));
}

/**
 * Decodes HTML entities in caption text
 */
function decodeHTMLEntities(text: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}
