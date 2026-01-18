import { NextRequest, NextResponse } from 'next/server';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

type MusicLookupResponse = {
  title: string | null;
  singer: string | null;
  image: string | null;
  toneKey: string | null;
  youtubeLink: string | null;
};

const KEY_MAP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

const getInput = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  let title = searchParams.get('title');
  let singer = searchParams.get('singer');

  if (request.method !== 'GET') {
    try {
      const body = await request.json();
      title = title || body?.title;
      singer = singer || body?.singer;
    } catch (error) {
      return { title, singer };
    }
  }

  return { title, singer };
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

const fetchItunes = async (title: string, singer: string) => {
  const term = encodeURIComponent(`${title} ${singer}`);
  const response = await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&limit=1`);
  if (!response.ok) {
    throw new Error('Failed to fetch iTunes data');
  }
  const data = await response.json();
  const result = data?.results?.[0];
  if (!result) return { title: null, singer: null, image: null };

  return {
    title: result.trackName || null,
    singer: result.artistName || null,
    image: getHighResArtwork(result.artworkUrl100 || result.artworkUrl60 || result.artworkUrl30)
  };
};

const fetchYoutube = async (title: string, singer: string) => {
  if (!YOUTUBE_API_KEY) return null;
  const query = encodeURIComponent(`${title} ${singer} official`);
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${query}&key=${YOUTUBE_API_KEY}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch YouTube data');
  }
  const data = await response.json();
  return pickYoutubeLink(data?.items || []);
};

const fetchSpotifyToken = async () => {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) return null;
  const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' })
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Spotify token');
  }

  const data = await response.json();
  return data?.access_token || null;
};

const fetchSpotifyToneKey = async (title: string, singer: string) => {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) return null;
  const token = await fetchSpotifyToken();
  if (!token) return null;

  const query = encodeURIComponent(`track:${title} artist:${singer}`);
  const searchResponse = await fetch(`https://api.spotify.com/v1/search?type=track&limit=1&q=${query}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!searchResponse.ok) {
    throw new Error('Failed to fetch Spotify search data');
  }

  const searchData = await searchResponse.json();
  const track = searchData?.tracks?.items?.[0];
  if (!track?.id) return null;

  const featuresResponse = await fetch(`https://api.spotify.com/v1/audio-features/${track.id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!featuresResponse.ok) {
    throw new Error('Failed to fetch Spotify audio features');
  }

  const features = await featuresResponse.json();
  const keyIndex = typeof features?.key === 'number' ? features.key : null;
  return keyIndex === null || keyIndex < 0 ? null : (KEY_MAP[keyIndex] || null);
};

const handleLookup = async (request: NextRequest) => {
  const { title, singer } = await getInput(request);

  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  if (!singer || typeof singer !== 'string' || !singer.trim()) {
    return NextResponse.json({ error: 'Singer is required' }, { status: 400 });
  }

  try {
    const [itunes, youtubeLink, toneKey] = await Promise.all([
      fetchItunes(title.trim(), singer.trim()),
      fetchYoutube(title.trim(), singer.trim()),
      fetchSpotifyToneKey(title.trim(), singer.trim())
    ]);

    const response: MusicLookupResponse = {
      title: itunes.title,
      singer: itunes.singer,
      image: itunes.image,
      toneKey: toneKey || null,
      youtubeLink: youtubeLink || null
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Music lookup failed:', error);
    return NextResponse.json({ error: 'Failed to fetch music metadata' }, { status: 500 });
  }
};

export async function GET(request: NextRequest) {
  return handleLookup(request);
}

export async function POST(request: NextRequest) {
  return handleLookup(request);
}
