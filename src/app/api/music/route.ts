import { NextRequest, NextResponse } from 'next/server';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const AUDIODB_API_KEY = process.env.AUDIODB_API_KEY;

type MusicLookupResult = {
  title: string | null;
  artist: string | null;
  image: string | null;
};

type MusicLookupResponse = {
  results: MusicLookupResult[];
  youtube: string | null;
  key: string | null;
};

const REQUEST_TIMEOUT_MS = 6000;
const CACHE_TTL_MS = 1000 * 60 * 60;
const MAX_CACHE_ENTRIES = 300;

type CacheEntry = {
  expiresAt: number;
  value: MusicLookupResponse;
};

const responseCache = new Map<string, CacheEntry>();

const getInput = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  let title = searchParams.get('title');
  let artist = searchParams.get('artist') || searchParams.get('singer');

  if (request.method !== 'GET') {
    try {
      const body = await request.json();
      title = title || body?.title;
      artist = artist || body?.artist || body?.singer;
    } catch (error) {
      return { title, artist };
    }
  }

  return { title, artist };
};

const pickYoutubeLink = (items: Array<{ id?: { videoId?: string }; snippet?: { title?: string } }>) => {
  if (!items?.length) return null;
  const preferred = items.find((item) => {
    const text = item.snippet?.title?.toLowerCase() || '';
    return text.includes('official') || text.includes('audio') || text.includes('music video');
  });
  const match = preferred || items[0];
  const videoId = match?.id?.videoId;
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
};

const getHighResArtwork = (url?: string | null) => {
  if (!url) return null;
  return url.replace(/(\d{2,4})x(\d{2,4})bb/, '600x600bb');
};

const fetchWithTimeout = async (url: string, timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const fetchItunes = async (title: string, singer: string) => {
  const term = encodeURIComponent(`${title} ${singer}`);
  const response = await fetchWithTimeout(
    `https://itunes.apple.com/search?term=${term}&entity=song&limit=6`,
    REQUEST_TIMEOUT_MS
  );
  if (!response.ok) {
    throw new Error('Failed to fetch iTunes data');
  }
  const data = await response.json();
  const results = Array.isArray(data?.results) ? data.results : [];
  return results.map((result: { trackName: any; artistName: any; artworkUrl100: any; artworkUrl60: any; artworkUrl30: any; }) => ({
    title: result?.trackName || null,
    artist: result?.artistName || null,
    image: getHighResArtwork(result?.artworkUrl100 || result?.artworkUrl60 || result?.artworkUrl30)
  }));
};

const fetchYoutube = async (title: string, singer: string) => {
  if (!YOUTUBE_API_KEY) return null;
  const query = encodeURIComponent(`${title} ${singer} official`);
  const response = await fetchWithTimeout(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${query}&key=${YOUTUBE_API_KEY}`,
    REQUEST_TIMEOUT_MS
  );
  if (!response.ok) {
    throw new Error('Failed to fetch YouTube data');
  }
  const data = await response.json();
  return pickYoutubeLink(data?.items || []);
};

const fetchAudioDbKey = async (title: string, artist: string) => {
  if (!AUDIODB_API_KEY) return null;
  const queryArtist = encodeURIComponent(artist);
  const queryTitle = encodeURIComponent(title);
  const response = await fetchWithTimeout(
    `https://www.theaudiodb.com/api/v1/json/${AUDIODB_API_KEY}/searchtrack.php?s=${queryArtist}&t=${queryTitle}`,
    REQUEST_TIMEOUT_MS
  );
  if (!response.ok) {
    throw new Error('Failed to fetch AudioDB data');
  }
  const data = await response.json();
  const track = data?.track?.[0];
  return track?.strKey || null;
};

const normalizeInput = (value: string) => value.normalize('NFC').trim();

const getCacheKey = (title: string, artist: string) =>
  `${title.toLowerCase()}::${artist.toLowerCase()}`;

const readCache = (key: string) => {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    responseCache.delete(key);
    return null;
  }
  return entry.value;
};

const writeCache = (key: string, value: MusicLookupResponse) => {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }
  responseCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
};

const safeLookup = async <T>(label: string, fetcher: () => Promise<T | null>) => {
  try {
    return await fetcher();
  } catch (error) {
    console.error(`${label} lookup failed:`, error);
    return null;
  }
};

const handleLookup = async (request: NextRequest) => {
  const { title, artist } = await getInput(request);

  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  if (!artist || typeof artist !== 'string' || !artist.trim()) {
    return NextResponse.json({ error: 'Artist is required' }, { status: 400 });
  }

  const normalizedTitle = normalizeInput(title);
  const normalizedArtist = normalizeInput(artist);
  const cacheKey = getCacheKey(normalizedTitle, normalizedArtist);
  const cached = readCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { status: 200 });
  }

  const [itunesResults, youtubeLink, trackKey] = await Promise.all([
    safeLookup('iTunes', () => fetchItunes(normalizedTitle, normalizedArtist)),
    safeLookup('YouTube', () => fetchYoutube(normalizedTitle, normalizedArtist)),
    safeLookup('AudioDB', () => fetchAudioDbKey(normalizedTitle, normalizedArtist))
  ]);

  const mappedResults = (itunesResults || []).map((result: { title: any; artist: any; image: any; }) => ({
    title: result.title ?? normalizedTitle,
    artist: result.artist ?? normalizedArtist,
    image: result.image ?? null
  }));

  const response: MusicLookupResponse = {
    results: mappedResults.length > 0
      ? mappedResults
      : [{ title: normalizedTitle, artist: normalizedArtist, image: null }],
    youtube: youtubeLink || null,
    key: trackKey || null
  };

  writeCache(cacheKey, response);
  return NextResponse.json(response, { status: 200 });
};

export async function GET(request: NextRequest) {
  return handleLookup(request);
}

export async function POST(request: NextRequest) {
  return handleLookup(request);
}
