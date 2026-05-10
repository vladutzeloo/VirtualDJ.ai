// Static hardware reference for known phone profiles. Browser APIs cannot
// reveal model-specific specs (chip, camera, exact RAM tier), so we ship a
// curated catalog and pick the right card based on user-agent hints + the
// user's manual selection.

export interface DeviceProfile {
  id: string;
  brand: string;
  model: string;
  codename: string;
  releaseYear: number;
  chip: string;
  chipProcess: string;
  gpu: string;
  ramGB: number;
  storageGB: number[];
  display: {
    sizeIn: number;
    resolution: string;
    refreshHz: number;
    panel: string;
    peakNits: number;
  };
  battery: {
    capacityMah: number;
    fastWattW: number;
  };
  camera: {
    main: string;
    tele: string;
    ultra: string;
    front: string;
  };
  os: string;
  accent: string; // tailwind class for primary identity tint
  uaHints: string[]; // substrings that suggest this device
}

export const DEVICE_PROFILES: DeviceProfile[] = [
  {
    id: 's23-ultra',
    brand: 'Samsung',
    model: 'Galaxy S23 Ultra',
    codename: 'SM-S918',
    releaseYear: 2023,
    chip: 'Snapdragon 8 Gen 2 for Galaxy',
    chipProcess: '4 nm TSMC',
    gpu: 'Adreno 740 @ 719 MHz',
    ramGB: 12,
    storageGB: [256, 512, 1024],
    display: {
      sizeIn: 6.8,
      resolution: '3088 x 1440',
      refreshHz: 120,
      panel: 'Dynamic AMOLED 2X LTPO',
      peakNits: 1750,
    },
    battery: {
      capacityMah: 5000,
      fastWattW: 45,
    },
    camera: {
      main: '200 MP f/1.7 OIS',
      tele: '10 MP 10x f/4.9 OIS',
      ultra: '12 MP 120 deg f/2.2',
      front: '12 MP f/2.2',
    },
    os: 'Android 14 / One UI 6',
    accent: 'jarvis-accent-cyan',
    uaHints: ['SM-S918', 'SM-S91', 'S23 Ultra'],
  },
  {
    id: 's24-ultra',
    brand: 'Samsung',
    model: 'Galaxy S24 Ultra',
    codename: 'SM-S928',
    releaseYear: 2024,
    chip: 'Snapdragon 8 Gen 3 for Galaxy',
    chipProcess: '4 nm TSMC',
    gpu: 'Adreno 750',
    ramGB: 12,
    storageGB: [256, 512, 1024],
    display: {
      sizeIn: 6.8,
      resolution: '3120 x 1440',
      refreshHz: 120,
      panel: 'Dynamic AMOLED 2X LTPO',
      peakNits: 2600,
    },
    battery: { capacityMah: 5000, fastWattW: 45 },
    camera: {
      main: '200 MP f/1.7 OIS',
      tele: '50 MP 5x f/3.4 OIS',
      ultra: '12 MP 120 deg f/2.2',
      front: '12 MP f/2.2',
    },
    os: 'Android 14 / One UI 6.1',
    accent: 'jarvis-accent-cyan',
    uaHints: ['SM-S928', 'SM-S92'],
  },
  {
    id: 'pixel-8-pro',
    brand: 'Google',
    model: 'Pixel 8 Pro',
    codename: 'husky',
    releaseYear: 2023,
    chip: 'Tensor G3',
    chipProcess: '4 nm Samsung',
    gpu: 'Mali-G715 MC10',
    ramGB: 12,
    storageGB: [128, 256, 512, 1024],
    display: {
      sizeIn: 6.7,
      resolution: '2992 x 1344',
      refreshHz: 120,
      panel: 'LTPO OLED',
      peakNits: 2400,
    },
    battery: { capacityMah: 5050, fastWattW: 30 },
    camera: {
      main: '50 MP f/1.68 OIS',
      tele: '48 MP 5x f/2.8 OIS',
      ultra: '48 MP 125.5 deg f/1.95',
      front: '10.5 MP f/2.2',
    },
    os: 'Android 14',
    accent: 'jarvis-accent-cyan',
    uaHints: ['Pixel 8 Pro'],
  },
  {
    id: 'iphone-15-pro-max',
    brand: 'Apple',
    model: 'iPhone 15 Pro Max',
    codename: 'iPhone16,2',
    releaseYear: 2023,
    chip: 'Apple A17 Pro',
    chipProcess: '3 nm TSMC',
    gpu: '6-core Apple GPU',
    ramGB: 8,
    storageGB: [256, 512, 1024],
    display: {
      sizeIn: 6.7,
      resolution: '2796 x 1290',
      refreshHz: 120,
      panel: 'Super Retina XDR LTPO',
      peakNits: 2000,
    },
    battery: { capacityMah: 4422, fastWattW: 27 },
    camera: {
      main: '48 MP f/1.78 OIS',
      tele: '12 MP 5x f/2.8 OIS',
      ultra: '12 MP 120 deg f/2.2',
      front: '12 MP f/1.9',
    },
    os: 'iOS 17',
    accent: 'jarvis-accent-cyan',
    uaHints: ['iPhone'],
  },
];

export const DEFAULT_DEVICE_ID = 's23-ultra';

export const detectDeviceFromUA = (): string => {
  if (typeof navigator === 'undefined') return DEFAULT_DEVICE_ID;
  const ua = navigator.userAgent || '';
  for (const profile of DEVICE_PROFILES) {
    if (profile.uaHints.some(hint => ua.includes(hint))) return profile.id;
  }
  return DEFAULT_DEVICE_ID;
};

export const getDeviceProfile = (id: string): DeviceProfile =>
  DEVICE_PROFILES.find(d => d.id === id) ?? DEVICE_PROFILES[0];
