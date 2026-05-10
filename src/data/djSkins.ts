export type SkinRarity = 'standard' | 'rare' | 'epic' | 'legendary';

export interface DJSkin {
  id: string;
  name: string;
  description: string;
  rarity: SkinRarity;
  price: number;
  vinyl: string;
  label: string;
  platter: string;
  tonearm: string;
  cartridge: string;
  glow: string;
  accentClass: string;
}

export const RARITY_META: Record<SkinRarity, { label: string; chip: string; ring: string }> = {
  standard: {
    label: 'Standard',
    chip: 'bg-slate-700/40 text-slate-200 border-slate-500/40',
    ring: 'ring-slate-400/30',
  },
  rare: {
    label: 'Rare',
    chip: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/40',
    ring: 'ring-cyan-400/40',
  },
  epic: {
    label: 'Epic',
    chip: 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/40',
    ring: 'ring-fuchsia-400/40',
  },
  legendary: {
    label: 'Legendary',
    chip: 'bg-amber-500/15 text-amber-200 border-amber-400/40',
    ring: 'ring-amber-400/50',
  },
};

export const DEFAULT_SKIN_ID = 'cyber-cyan';

export const DJ_SKINS: DJSkin[] = [
  {
    id: 'cyber-cyan',
    name: 'Cyber Cyan',
    description: 'The factory issue. Cool blue label, dark wax, jarvis-grade pulse.',
    rarity: 'standard',
    price: 0,
    vinyl: '#050505',
    label: '#00f2ff',
    platter: '#111111',
    tonearm: '#888888',
    cartridge: '#ff00ff',
    glow: '#00f2ff',
    accentClass: 'text-cyan-300',
  },
  {
    id: 'magenta-pulse',
    name: 'Magenta Pulse',
    description: 'Hot pink heart. Tuned for late-set euphoria and high-BPM rooms.',
    rarity: 'standard',
    price: 200,
    vinyl: '#0a0010',
    label: '#ff2ee6',
    platter: '#1a0322',
    tonearm: '#9d9d9d',
    cartridge: '#fff',
    glow: '#ff2ee6',
    accentClass: 'text-fuchsia-300',
  },
  {
    id: 'toxic-lime',
    name: 'Toxic Lime',
    description: 'Acid green isotope. Mid-bass slaps with a slightly radioactive aura.',
    rarity: 'standard',
    price: 250,
    vinyl: '#020806',
    label: '#7CFF6B',
    platter: '#0a1410',
    tonearm: '#8aa090',
    cartridge: '#e6ffe1',
    glow: '#7CFF6B',
    accentClass: 'text-emerald-300',
  },
  {
    id: 'solar-gold',
    name: 'Solar Gold',
    description: 'Warm amber master. Smooth low-end, rich harmonics, vintage soul.',
    rarity: 'rare',
    price: 400,
    vinyl: '#100805',
    label: '#FFB13B',
    platter: '#1f1208',
    tonearm: '#d4a85a',
    cartridge: '#fff1c1',
    glow: '#FFB13B',
    accentClass: 'text-amber-300',
  },
  {
    id: 'phantom-violet',
    name: 'Phantom Violet',
    description: 'Spectral purple plate for ambient sets and 3am dub-techno.',
    rarity: 'rare',
    price: 500,
    vinyl: '#08020e',
    label: '#9C5BFF',
    platter: '#15082a',
    tonearm: '#7a6ba0',
    cartridge: '#e3d5ff',
    glow: '#9C5BFF',
    accentClass: 'text-violet-300',
  },
  {
    id: 'hyper-crimson',
    name: 'Hyper Crimson',
    description: 'Blood-red rotor for the warehouse. Drops harder, tracks faster.',
    rarity: 'rare',
    price: 600,
    vinyl: '#0a0202',
    label: '#FF1F4B',
    platter: '#1a0509',
    tonearm: '#c9c9c9',
    cartridge: '#fff',
    glow: '#FF1F4B',
    accentClass: 'text-rose-300',
  },
  {
    id: 'frost-aurora',
    name: 'Frost Aurora',
    description: 'Sub-zero ice plate. Glacial blue glow, mirror-polished tonearm.',
    rarity: 'epic',
    price: 850,
    vinyl: '#020a10',
    label: '#A8F0FF',
    platter: '#06141d',
    tonearm: '#dff2ff',
    cartridge: '#A8F0FF',
    glow: '#7BD7FF',
    accentClass: 'text-sky-200',
  },
  {
    id: 'onyx-mirror',
    name: 'Onyx Mirror',
    description: 'Black chrome stealth deck. Reads the room without showing its hand.',
    rarity: 'epic',
    price: 1000,
    vinyl: '#000000',
    label: '#C8CDD6',
    platter: '#1a1a22',
    tonearm: '#f4f6fb',
    cartridge: '#bfc3cc',
    glow: '#A0AEC0',
    accentClass: 'text-slate-200',
  },
  {
    id: 'plasma-inferno',
    name: 'Plasma Inferno',
    description: 'Molten orange core. Phasing flame glow that spikes on the drop.',
    rarity: 'legendary',
    price: 1400,
    vinyl: '#0c0301',
    label: '#FF6A00',
    platter: '#1f0a02',
    tonearm: '#ffb27a',
    cartridge: '#FFE08A',
    glow: '#FF6A00',
    accentClass: 'text-orange-300',
  },
  {
    id: 'cosmic-drift',
    name: 'Cosmic Drift',
    description: 'Nebula-forged limited run. Twin pinks bleed into deep space violet.',
    rarity: 'legendary',
    price: 1800,
    vinyl: '#08001a',
    label: '#FF7AE0',
    platter: '#1a0633',
    tonearm: '#d2a8ff',
    cartridge: '#FFD9F8',
    glow: '#C77BFF',
    accentClass: 'text-pink-200',
  },
];

export const findSkin = (id: string | null | undefined): DJSkin =>
  DJ_SKINS.find(s => s.id === id) ?? DJ_SKINS[0];
