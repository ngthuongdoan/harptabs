export type MusicLookupResult = {
  title: string | null;
  artist: string | null;
  image: string | null;
};

export type MusicLookupResponse = {
  results: MusicLookupResult[];
  youtube: string | null;
  key: string | null;
};

export type MusicLookupInput = {
  title: string;
  artist: string;
};

type MusicLookupOptions = {
  signal?: AbortSignal;
};

const normalizeInput = (value: string) => value.normalize("NFC").trim();

const emptyResult = (title?: string, artist?: string): MusicLookupResult => ({
  title: title ?? null,
  artist: artist ?? null,
  image: null
});

const emptyResponse = (title?: string, artist?: string): MusicLookupResponse => ({
  results: [emptyResult(title, artist)],
  youtube: null,
  key: null
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getStringOrNull = (value: unknown) => (typeof value === "string" ? value : null);

const coerceResult = (data: unknown, fallback?: { title?: string; artist?: string }): MusicLookupResult => {
  if (!isRecord(data)) {
    return emptyResult(fallback?.title, fallback?.artist);
  }

  return {
    title: getStringOrNull(data.title) ?? fallback?.title ?? null,
    artist: getStringOrNull(data.artist) ?? fallback?.artist ?? null,
    image: getStringOrNull(data.image)
  };
};

export const coerceMusicLookupResponse = (
  data: unknown,
  fallback?: { title?: string; artist?: string }
): MusicLookupResponse => {
  if (!isRecord(data)) {
    return emptyResponse(fallback?.title, fallback?.artist);
  }

  const rawResults = Array.isArray(data.results) ? data.results : [];
  const results = rawResults.length > 0
    ? rawResults.map((entry) => coerceResult(entry))
    : [coerceResult(data, fallback)];

  return {
    results,
    youtube: getStringOrNull(data.youtube),
    key: getStringOrNull(data.key)
  };
};

export const fetchMusicLookup = async (
  input: MusicLookupInput,
  options: MusicLookupOptions = {}
): Promise<MusicLookupResponse> => {
  const title = normalizeInput(input.title);
  const artist = normalizeInput(input.artist);
  const params = new URLSearchParams({ title, artist });

  try {
    const response = await fetch(`/api/music?${params.toString()}`, {
      method: "GET",
      signal: options.signal
    });

    if (!response.ok) {
      return emptyResponse(title, artist);
    }

    const data = await response.json();
    if (isRecord(data) && typeof data.error === "string") {
      return emptyResponse(title, artist);
    }

    return coerceMusicLookupResponse(data, { title, artist });
  } catch {
    return emptyResponse(title, artist);
  }
};
