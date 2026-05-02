import { C } from '../constants/colors';

export const weatherInfo = (code) => {
  if (code === 0) return { label: 'Clear Sky', emoji: '☀️', bg: '#E65100' };
  if (code <= 3) return { label: 'Partly Cloudy', emoji: '🌤', bg: C.skyDk };
  if (code <= 48) return { label: 'Foggy', emoji: '🌫️', bg: '#546E7A' };
  if (code <= 67) return { label: 'Rainy', emoji: '🌧️', bg: '#1565C0' };
  if (code <= 82) return { label: 'Showers', emoji: '🌦️', bg: '#0277BD' };
  return { label: 'Thunderstorm', emoji: '⛈️', bg: '#4527A0' };
};
export default weatherInfo;