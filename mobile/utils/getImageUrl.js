import api_url from './api';

// Resolves an image/video path coming from the backend into a usable URL.
// - Supabase Storage (current) already returns a full https:// URL — use as-is.
// - Old local-disk uploads (pre-migration) were just a bare filename — prepend
//   api_url/uploads/ for backward compatibility with any legacy DB rows.
//   (Those old files no longer physically exist on Render's disk, so this
//   fallback mainly just avoids a crash on stale records rather than actually
//   displaying anything.)
export const getImageUrl = (path, cacheBust = false) => {
  if (!path) return null;

  const base = path.startsWith('http')
    ? path
    : `${api_url}/uploads/${path}`;

  return cacheBust ? `${base}?t=${Date.now()}` : base;
};

export default getImageUrl;
