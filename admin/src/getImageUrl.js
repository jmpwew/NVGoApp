import { API } from './config';

export const getImageUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API}/uploads/${path}`;
};

export default getImageUrl;
