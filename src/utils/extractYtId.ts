/**
 * Extracts the YouTube video ID from various YouTube URL formats.
 * 
 * @param url The YouTube URL string.
 * @returns The 11-character video ID or null if no valid ID is found.
 */
export function extractYoutubeId(url: string): string | null {
  // Regex pattern to match various YouTube URL formats:
  // 1. https://www.youtube.com/watch?v=VIDEO_ID
  // 2. https://youtu.be/VIDEO_ID
  // 3. https://www.youtube.com/embed/VIDEO_ID
  // 4. https://www.youtube.com/v/VIDEO_ID
  // 5. https://m.youtube.com/watch?v=VIDEO_ID
  // 6. https://music.youtube.com/watch?v=VIDEO_ID
  const regex = /(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|shorts\/)?([a-zA-Z0-9_-]{11})/;
  
  const match = url.match(regex);
  
  // The video ID (11 characters) is captured in the first group of the regex
  // The captured group is at index 1 of the match array.
  if (match && match[1] && match[1].length === 11) {
    return match[1];
  }

  return null;
}