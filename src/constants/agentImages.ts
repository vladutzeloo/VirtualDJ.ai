import { canonicalizePersona } from '../services/agentPersonas';

export const AGENT_IMAGES: Record<string, string> = {
  "Bass Enhancer": "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?q=80&w=400&h=400&auto=format&fit=crop",
  "Vocal Refiner": "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400&h=400&auto=format&fit=crop",
  "Harmonic Sync": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=400&h=400&auto=format&fit=crop",
  "Sync Master": "https://images.unsplash.com/photo-1534823683081-3d9e358596ea?q=80&w=400&h=400&auto=format&fit=crop",
  "Ambient Soul": "https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=400&h=400&auto=format&fit=crop",
  "Rhythm Refiner": "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=400&h=400&auto=format&fit=crop",
  "Distortion Core": "https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=400&h=400&auto=format&fit=crop",
  "Groove Archivist": "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=400&h=400&auto=format&fit=crop",
  "Default": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&h=400&auto=format&fit=crop"
};

export const getAgentImage = (name: string): string => {
  const canonical = canonicalizePersona(name);
  return AGENT_IMAGES[canonical] ?? AGENT_IMAGES.Default;
};
