export interface YouTubeVideo {
  videoId: string;
  contentUrl: string;
  embedUrl: string;
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function isYouTubeUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase().replace(/^www\./, '');
    return host === 'youtu.be' || host === 'youtube.com' || host === 'm.youtube.com';
  } catch {
    return false;
  }
}

/** Returns normalized metadata only for supported YouTube URLs. */
export function parseYouTubeUrl(value: string): YouTubeVideo | undefined {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  let videoId: string | null = null;
  if (host === 'youtu.be') videoId = url.pathname.split('/').filter(Boolean)[0] ?? null;
  if (['youtube.com', 'm.youtube.com'].includes(host)) {
    if (url.pathname === '/watch') videoId = url.searchParams.get('v');
    else if (/^\/(embed|shorts|live)\//.test(url.pathname))
      videoId = url.pathname.split('/').filter(Boolean)[1] ?? null;
  }
  if (!videoId || !VIDEO_ID.test(videoId)) return undefined;
  return {
    videoId,
    contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
  };
}
