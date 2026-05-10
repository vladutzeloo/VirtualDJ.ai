/**
 * Single source of truth for AI DJ persona labels.
 *
 * Reputation entries (`agentReputationService`), suggestion labels assigned by
 * the Audius/Gemini orchestrators (`musicService`), the Showcase deck
 * (`AgentShowcase`) and the avatar lookup (`agentImages`) all reference these
 * names. Persona keys are case-sensitive in localStorage, so callers must run
 * incoming labels through `canonicalizePersona()` before comparing or storing
 * them.
 */

export const AGENT_PERSONAS = [
  'Bass Enhancer',
  'Vocal Refiner',
  'Harmonic Sync',
  'Sync Master',
  'Ambient Soul',
  'Rhythm Refiner',
  'Distortion Core',
  'Groove Archivist',
  'Auto-Curator',
  'Neural Scout',
  'Crate Digger',
  'Waveform Sage',
  'Rick Rubin',
] as const;

export type AgentPersona = (typeof AGENT_PERSONAS)[number];

const CANONICAL_BY_NORMALIZED = new Map<string, AgentPersona>(
  AGENT_PERSONAS.map((p) => [p.toLowerCase().replace(/\s+/g, ' ').trim(), p]),
);

const ALIAS_TO_CANONICAL: Record<string, AgentPersona> = {
  'bass architect': 'Bass Enhancer',
  'sub master': 'Bass Enhancer',
  'beat master': 'Sync Master',
  'techno weaver': 'Sync Master',
  'melody scaper': 'Harmonic Sync',
};

/**
 * Normalize an arbitrary persona string to a canonical label so that case,
 * whitespace and known synonyms collapse into one reputation entry.
 *
 * Unknown labels are returned in Title Case (and trimmed) but are still
 * permitted — Gemini may invent new persona names and we don't want to drop
 * the suggestion entirely.
 */
export const canonicalizePersona = (label: string): string => {
  const cleaned = (label ?? '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const normalized = cleaned.toLowerCase();
  const canonical = CANONICAL_BY_NORMALIZED.get(normalized);
  if (canonical) return canonical;
  const aliased = ALIAS_TO_CANONICAL[normalized];
  if (aliased) return aliased;
  return cleaned
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');
};

/** Genre seed associated with each canonical persona, used by the showcase
 *  "DEPLOY AGENT" action to seed a search. */
export const PERSONA_GENRE_SEED: Record<AgentPersona, string> = {
  'Bass Enhancer': 'bass house',
  'Vocal Refiner': 'vocal pop',
  'Harmonic Sync': 'electronic melodic',
  'Sync Master': 'techno',
  'Ambient Soul': 'ambient chill',
  'Rhythm Refiner': 'hip hop',
  'Distortion Core': 'rock',
  'Groove Archivist': 'funk soul',
  'Auto-Curator': 'top hits',
  'Neural Scout': 'new releases',
  'Crate Digger': 'deep cuts',
  'Waveform Sage': 'electronic',
  'Rick Rubin': 'hip hop classics',
};
