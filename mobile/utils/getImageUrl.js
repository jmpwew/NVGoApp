import api_url from './api';


export const getImageUrl = (path, cacheBust = false) => {
  if (!path) return null;

  const base = path.startsWith('http')
    ? path
    : `${api_url}/uploads/${path}`;

  return cacheBust ? `${base}?t=${Date.now()}` : base;
};

export default getImageUrl;
