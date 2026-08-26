import { Image } from 'react-native';
import { Svg, Path, Circle, Rect } from 'react-native-svg';
import { C } from '../constants/colors';

// Navigation
export const IcBack = ({ stroke = '#fff' }) => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <Path d="M12.5 16l-6-6 6-6" stroke={stroke} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IcChevron = ({ s = 7, c = C.border }) => (
  <Svg width={s} height={s + 4} viewBox="0 0 8 12" fill="none">
    <Path d="M1.5 1.5l5 5-5 5" stroke={c} strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

// Default avatar (SVG placeholder used when a user has no profile photo)
export const IcDefaultAvatar = ({ size = 36, bg = C.green, c = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Rect x="0" y="0" width="36" height="36" rx="11" fill={bg}/>
    <Circle cx="18" cy="14.5" r="6" fill={c}/>
    <Path d="M5 33c1.4-7.6 7.2-12 13-12s11.6 4.4 13 12" fill={c}/>
  </Svg>
);

// User / Auth 
export const IcUser = ({ s = 18, c = C.green }) => (
  <Svg width={s} height={s} viewBox="0 0 18 18" fill="none">
    <Circle cx="9" cy="7" r="3.2" stroke={c} strokeWidth="1.4"/>
    <Path d="M3 16c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
  </Svg>
);

export const IcUserEdit = ({ c = C.green }) => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Circle cx="8" cy="7" r="3" stroke={c} strokeWidth="1.4"/>
    <Path d="M2 16c0-3.3 2.7-6 6-6" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    <Path d="M12 13l2-2 1.5 1.5-2 2H12v-1.5z" stroke={c} strokeWidth="1.2"
      strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IcMail = ({ s = 18, c = C.muted }) => (
  <Svg width={s} height={s} viewBox="0 0 18 18" fill="none">
    <Rect x="2" y="4" width="14" height="10" rx="2.5" stroke={c} strokeWidth="1.4"/>
    <Path d="M2 7l7 4.5L16 7" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
  </Svg>
);

export const IcLock = ({ s = 18, c = C.muted }) => (
  <Svg width={s} height={s} viewBox="0 0 38 38" fill="none">
    <Rect x="8" y="17" width="22" height="16" rx="4" stroke={c} strokeWidth="2"/>
    <Path d="M12 17v-5a7 7 0 0114 0v5" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    <Circle cx="19" cy="25" r="2.5" fill={c}/>
    <Path d="M19 25v3" stroke={c} strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

export const IcEye = ({ show, c = C.muted }) => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path d="M1.5 9S4 4 9 4s7.5 5 7.5 5S14 14 9 14 1.5 9 1.5 9z" stroke={c} strokeWidth="1.4"/>
    <Circle cx="9" cy="9" r="2.2" stroke={c} strokeWidth="1.4"/>
    {!show && <Path d="M2 2l14 14" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>}
  </Svg>
);

export const IcLogin = ({ c = C.green }) => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path d="M11 3h2.5A1.5 1.5 0 0115 4.5v9A1.5 1.5 0 0113.5 15H11" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    <Path d="M6 12l3-3-3-3M9 9H3" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IcLogout = ({ c = C.red }) => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path d="M7 3H4.5A1.5 1.5 0 003 4.5v9A1.5 1.5 0 004.5 15H7" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    <Path d="M12 6l3 3-3 3M15 9H7" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

// Actions 
export const IcSend = ({ c = '#fff' }) => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path d="M15.5 2.5L8.5 9.5M15.5 2.5l-4.5 13-3-5.5-5.5-3 13-4.5z"
      stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IcEdit = ({ c = '#fff' }) => (
  <Svg width={15} height={15} viewBox="0 0 16 16" fill="none">
    <Path d="M11 2l3 3-8 8H3v-3l8-8z" stroke={c} strokeWidth="1.3"
      strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IcCamera = ({ s = 18, c = '#136835' }) => (
  <Svg width={s} height={s} viewBox="0 0 22 22" fill="none">
    <Path d="M3 8.5A2.5 2.5 0 015.5 6H7l1.5-2h5L15 6h1.5A2.5 2.5 0 0119 8.5v7a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 013 15.5v-7z"
      stroke={c} strokeWidth="1.4"/>
    <Circle cx="11" cy="12" r="2.8" stroke={c} strokeWidth="1.3"/>
  </Svg>
);

export const IcImage = ({ s = 18, c = C.green }) => (
  <Svg width={s} height={s} viewBox="0 0 18 18" fill="none">
    <Rect x="2" y="3" width="14" height="12" rx="2.5" stroke={c} strokeWidth="1.4"/>
    <Circle cx="6.2" cy="7" r="1.4" stroke={c} strokeWidth="1.3"/>
    <Path d="M3 13l4-4 2.5 2.5L13 8l2 2.5" stroke={c} strokeWidth="1.3"
      strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IcVideo = ({ s = 18, c = '#136835' }) => (
  <Svg width={s} height={s} viewBox="0 0 22 22" fill="none">
    <Rect x="2.5" y="5.5" width="12" height="11" rx="2.5" stroke={c} strokeWidth="1.4"/>
    <Path d="M14.5 9.5l4.5-2.5v9l-4.5-2.5" stroke={c} strokeWidth="1.4"
      strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IcPlay = ({ s = 22, c = '#fff' }) => (
  <Svg width={s} height={s} viewBox="0 0 22 22" fill="none">
    <Circle cx="11" cy="11" r="10" fill="rgba(0,0,0,0.45)"/>
    <Path d="M9 7.5l6 3.5-6 3.5v-7z" fill={c}/>
  </Svg>
);

export const IcTrash = ({ c = C.red }) => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path d="M2 4h12M5 4V2.5a.5.5 0 01.5-.5h5a.5.5 0 01.5.5V4M6 7v5M10 7v5"
      stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
    <Path d="M3 4l.8 9.5a.5.5 0 00.5.5h7.4a.5.5 0 00.5-.5L13 4"
      stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
  </Svg>
);

export const IcCheck = ({ s = 18, c = C.green }) => (
  <Svg width={s} height={s} viewBox="0 0 18 18" fill="none">
    <Circle cx="9" cy="9" r="7" stroke={c} strokeWidth="1.4"/>
    <Path d="M5.5 9l2.5 2.5 4.5-4.5" stroke={c} strokeWidth="1.4"
      strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IcSave = ({ c = '#fff' }) => (
  <Svg width={17} height={17} viewBox="0 0 18 18" fill="none">
    <Path d="M3 9l4 4 8-8" stroke={c} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IcSearch = ({ c = 'rgba(255,255,255,0.8)' }) => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Circle cx="7" cy="7" r="4.5" stroke={c} strokeWidth="1.4"/>
    <Path d="M10.5 10.5l3 3" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
  </Svg>
);

// Features
export const IcReport = ({ s = 22, c = C.red }) => (
  <Svg width={s} height={s} viewBox="0 0 22 22" fill="none">
    <Rect x="4" y="3" width="14" height="16" rx="2.5" stroke={c} strokeWidth="1.4"/>
    <Path d="M8 8h6M8 11h6M8 14h4" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
    <Circle cx="15" cy="16" r="3.5" fill={c}/>
    <Path d="M13.8 16l.9.9 1.8-1.8" stroke="#fff" strokeWidth="1.2"
      strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IcNews = ({ s = 22, c = C.skyDk }) => (
  <Svg width={s} height={s} viewBox="0 0 22 22" fill="none">
    <Rect x="3" y="4" width="16" height="14" rx="2.5" stroke={c} strokeWidth="1.4"/>
    <Path d="M3 8h16" stroke={c} strokeWidth="1.3"/>
    <Circle cx="7" cy="6" r="1" fill={c}/>
    <Circle cx="11" cy="6" r="1" fill={c}/>
    <Path d="M6 12h10M6 15h7" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
  </Svg>
);

export const IcPhone = ({ s = 22, c = C.green }) => (
  <Svg width={s} height={s} viewBox="0 0 22 22" fill="none">
    <Path d="M5 3h-.5A2.5 2.5 0 002 5.5v.5c0 7.2 5.8 13 13 13h.5A2.5 2.5 0 0018 16.5V16a1 1 0 00-.6-.9l-3.5-1.5a1 1 0 00-1.1.2l-1.3 1.3a9.1 9.1 0 01-4.1-4.1l1.3-1.3a1 1 0 00.2-1.1L7.4 5.1A1 1 0 006.5 4.5L5 4.5"
      stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IcMore = ({ s = 22, c = '#7B5EA7' }) => (
  <Svg width={s} height={s} viewBox="0 0 22 22" fill="none">
    <Circle cx="6" cy="11" r="1.8" fill={c}/>
    <Circle cx="11" cy="11" r="1.8" fill={c}/>
    <Circle cx="16" cy="11" r="1.8" fill={c}/>
  </Svg>
);

export const IcMap = ({ c = C.muted }) => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path d="M9 1.5A5.5 5.5 0 013.5 7C3.5 11 9 16.5 9 16.5S14.5 11 14.5 7A5.5 5.5 0 009 1.5z"
      stroke={c} strokeWidth="1.4"/>
    <Circle cx="9" cy="7" r="2" stroke={c} strokeWidth="1.3"/>
  </Svg>
);

export const IcGPS = ({ c = '#fff' }) => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Circle cx="9" cy="9" r="6.5" stroke={c} strokeWidth="1.4"/>
    <Circle cx="9" cy="9" r="2" fill={c}/>
    <Path d="M9 1v2.5M9 14.5V17M1 9h2.5M14.5 9H17" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
  </Svg>
);

export const IcDesc = ({ c = C.green }) => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Rect x="2.5" y="2.5" width="13" height="13" rx="2.5" stroke={c} strokeWidth="1.4"/>
    <Path d="M5.5 6.5h7M5.5 9h7M5.5 11.5h4.5" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
  </Svg>
);

export const IcNote = ({ c = C.green }) => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Rect x="2.5" y="2.5" width="13" height="13" rx="2.5" stroke={c} strokeWidth="1.4"/>
    <Path d="M5.5 6.5h7M5.5 9h5" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
    <Path d="M11 13l2-2-1-1-2 2v1h1z" stroke={c} strokeWidth="1.1"
      strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IcPermit = ({ s = 26, c = C.yellowDk }) => (
  <Svg width={s} height={s} viewBox="0 0 26 26" fill="none">
    <Rect x="3" y="3" width="20" height="20" rx="3.5" stroke={c} strokeWidth="1.6"/>
    <Path d="M8 9h10M8 13h10M8 17h6" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    <Circle cx="19" cy="18" r="4.5" fill={c}/>
    <Path d="M17.5 18l1.2 1.2 2.3-2.3" stroke="#fff" strokeWidth="1.4"
      strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IcCoin = ({ s = 26, c = C.yellowDk }) => (
  <Svg width={s} height={s} viewBox="0 0 26 26" fill="none">
    <Circle cx="13" cy="13" r="9.5" stroke={c} strokeWidth="1.6"/>
    <Path d="M13 8v10M15.8 10.2c0-1.2-1.3-2-2.8-2s-2.8.8-2.8 1.9c0 2.7 5.6 1.3 5.6 4 0 1.1-1.3 1.9-2.8 1.9s-2.8-.8-2.8-2"
      stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IcBuilding = ({ s = 18, c = C.green }) => (
  <Svg width={s} height={s} viewBox="0 0 20 20" fill="none">
    <Rect x="4" y="3" width="12" height="15" rx="1.4" stroke={c} strokeWidth="1.5"/>
    <Path d="M7 6.5h1.6M11.4 6.5H13M7 9.5h1.6M11.4 9.5H13M7 12.5h1.6M11.4 12.5H13"
      stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
    <Rect x="8" y="14.5" width="4" height="3.5" stroke={c} strokeWidth="1.3"/>
  </Svg>
);

export const IcSOS = ({ c = '#fff' }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.7"/>
    <Path d="M12 7v5" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
    <Circle cx="12" cy="16" r="1.3" fill={c}/>
  </Svg>
);

// Notifications
export const IcBell = ({ s = 17, c = '#fff' }) => (
  <Svg width={s} height={s} viewBox="0 0 18 18" fill="none">
    <Path d="M9 1a5 5 0 00-5 5v3.5L2.5 12h13L14 9.5V6A5 5 0 009 1z"
      stroke={c} strokeWidth="1.4" strokeLinejoin="round"/>
    <Path d="M7 14a2 2 0 004 0" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
  </Svg>
);
export const IcBell2 = ({ s = 17, c = '#29ABE2' }) => (
  <Svg width={s} height={s} viewBox="0 0 18 18" fill="none">
    <Path d="M9 1a5 5 0 00-5 5v3.5L2.5 12h13L14 9.5V6A5 5 0 009 1z"
      stroke={c} strokeWidth="1.4" strokeLinejoin="round"/>
    <Path d="M7 14a2 2 0 004 0" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
  </Svg>
);
export const IcAlert = ({ s = 18, c = C.yellowDk }) => (
  <Svg width={s} height={s} viewBox="0 0 18 18" fill="none">
    <Path d="M9 1.5L1.5 15.5h15L9 1.5z" stroke={c} strokeWidth="1.4" strokeLinejoin="round"/>
    <Rect x="8.3" y="7" width="1.4" height="4.5" rx="0.7" fill={c}/>
    <Circle cx="9" cy="13" r="0.9" fill={c}/>
  </Svg>
);

export const IcX = ({ s = 18, c = C.red }) => (
  <Svg width={s} height={s} viewBox="0 0 18 18" fill="none">
    <Circle cx="9" cy="9" r="7" stroke={c} strokeWidth="1.4"/>
    <Path d="M6.5 6.5l5 5M11.5 6.5l-5 5" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
  </Svg>
);

export const IcInfo = ({ s = 18, c = C.skyDk }) => (
  <Svg width={s} height={s} viewBox="0 0 18 18" fill="none">
    <Circle cx="9" cy="9" r="7" stroke={c} strokeWidth="1.4"/>
    <Path d="M9 8v5" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    <Circle cx="9" cy="5.5" r="1" fill={c}/>
  </Svg>
);

export const IcHelp = ({ s = 18, c = C.skyDk }) => (
  <Svg width={s} height={s} viewBox="0 0 18 18" fill="none">
    <Path d="M2.5 4.2c0-1 .8-1.7 1.7-1.7h9.6c1 0 1.7.8 1.7 1.7v6.3c0 1-.8 1.7-1.7 1.7H8.2L4.8 15v-2.8H4.2c-1 0-1.7-.8-1.7-1.7V4.2z"
      stroke={c} strokeWidth="1.4" strokeLinejoin="round"/>
    <Path d="M6.9 6.3c0-1.1.9-1.8 1.9-1.8s1.9.6 1.9 1.7c0 1.3-1.9 1.3-1.9 2.9"
      stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="8.8" cy="10.8" r="0.9" fill={c}/>
  </Svg>
);

export const IcWarn = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path d="M9 1.5L1 16h16L9 1.5z" fill={C.yellow} stroke={C.yellowDk} strokeWidth="1" strokeLinejoin="round"/>
    <Rect x="8.3" y="7" width="1.5" height="5" rx="0.75" fill={C.yellowDk}/>
    <Circle cx="9" cy="13.5" r="0.9" fill={C.yellowDk}/>
  </Svg>
);

// Profile / Settings

export const IcProfile = ({ s = 18, c = C.green }) => (
  <Svg width={s} height={s} viewBox="0 0 18 18" fill="none">
    <Circle cx="9" cy="7" r="3.2" stroke={c} strokeWidth="1.4"/>
    <Path d="M3 16c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    <Circle cx="13.5" cy="13.5" r="3" fill={c}/>
    <Path d="M12.2 13.5l1 1 2-2" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
export const IcSupport = ({ c = C.green }) => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Circle cx="9" cy="9" r="7" stroke={c} strokeWidth="1.4"/>
    <Path d="M6.5 6.5A2.5 2.5 0 019 4a2.5 2.5 0 012.5 2.5c0 1.4-.9 2-1.8 2.6-.5.3-.7.7-.7 1.2"
      stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
    <Circle cx="9" cy="13" r="1" fill={c}/>
  </Svg>
);

export const IcShield = () => (
  <Svg width={12} height={12} viewBox="0 0 14 14" fill="none">
    <Path d="M7 1L2 3v4c0 3.5 2.3 5.5 5 6.5 2.7-1 5-3 5-6.5V3L7 1z"
      fill={C.green} stroke={C.greenDk} strokeWidth="0.8"/>
    <Path d="M4.5 7l2 2 3-3" stroke="#fff" strokeWidth="1.2"
      strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IcClock = ({ s = 18, c = C.muted }) => (
  <Svg width={s} height={s} viewBox="0 0 18 18" fill="none">
    <Circle cx="9" cy="9" r="7" stroke={c} strokeWidth="1.4"/>
    <Path d="M9 5v4l3 2" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IcEyeView = ({ s = 11, c = C.muted }) => (
  <Svg width={s} height={s} viewBox="0 0 12 12" fill="none">
    <Path d="M1 6s2-4 5-4 5 4 5 4-2 4-5 4-5-4-5-4z" stroke={c} strokeWidth="1.2"/>
    <Circle cx="6" cy="6" r="1.5" stroke={c} strokeWidth="1.2"/>
  </Svg>
);

export const IcEmpty = () => (
  <Svg width={52} height={52} viewBox="0 0 52 52" fill="none">
    <Rect x="8" y="10" width="36" height="32" rx="5" stroke={C.border} strokeWidth="1.8"/>
    <Path d="M8 18h36" stroke={C.border} strokeWidth="1.6"/>
    <Path d="M16 26h20M16 31h14" stroke={C.border} strokeWidth="1.5" strokeLinecap="round"/>
    <Circle cx="38" cy="38" r="8" fill={C.bg} stroke={C.border} strokeWidth="1.5"/>
    <Path d="M35 38h6M38 35v6" stroke={C.border} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

// Contact 
export const IcMsg = ({ c = C.green }) => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Rect x="1.5" y="2.5" width="15" height="11" rx="2.5" stroke={c} strokeWidth="1.4"/>
    <Path d="M5 13.5l2 3 2-3" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M5 7h8M5 10h5" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
  </Svg>
);

export const IcFB = ({ c = '#1877F2' }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"
      stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

//  Logo
export const LogoMark = ({ size = 140, radius = 32 }) => (
  <Image
    source={require('../assets/nvgo-logo.png')}
    style={{ width: size, height: size, borderRadius: radius }}
    resizeMode="cover"
  />
);