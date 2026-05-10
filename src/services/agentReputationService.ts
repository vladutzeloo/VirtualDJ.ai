import { canonicalizePersona } from './agentPersonas';

export interface AgentRep {
  agentLabel: string;
  upvotes: number;
  downvotes: number;
  trackLikes: number;
  trackDislikes: number;
  bonusCreditsEarned: number;
  lastFeedbackAt: number;
  notes: string[];
}

export type AgentReputations = Record<string, AgentRep>;

export const REPUTATION_STORAGE_KEY = 'vdj.agentReps.v1';

export const blankRep = (agentLabel: string): AgentRep => ({
  agentLabel: canonicalizePersona(agentLabel),
  upvotes: 0,
  downvotes: 0,
  trackLikes: 0,
  trackDislikes: 0,
  bonusCreditsEarned: 0,
  lastFeedbackAt: 0,
  notes: [],
});

const NOTE_MAX_LEN = 140;
const NOTES_PER_AGENT = 12;

/** User-supplied notes flow into AI system prompts via `formatAgentBriefing`,
 *  so collapse newlines, strip code fences, and cap length to limit prompt
 *  injection surface. */
export const sanitizeNote = (note: string): string =>
  note
    .replace(/```/g, '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NOTE_MAX_LEN);

/** Canonicalize the label and merge it into the existing rep map, returning a
 *  new map and the canonical key the caller should reference. */
export const upsertRep = (
  reps: AgentReputations,
  rawLabel: string,
  patch: (current: AgentRep) => AgentRep,
): { next: AgentReputations; key: string } => {
  const key = canonicalizePersona(rawLabel);
  if (!key) return { next: reps, key };
  const current = reps[key] ?? blankRep(key);
  return { next: { ...reps, [key]: patch({ ...current, agentLabel: key }) }, key };
};

export const appendNote = (rep: AgentRep, note: string): AgentRep => {
  const cleaned = sanitizeNote(note);
  if (!cleaned) return rep;
  return { ...rep, notes: [...rep.notes, cleaned].slice(-NOTES_PER_AGENT) };
};

export const trustScore = (rep: AgentRep): number => {
  const positive = rep.upvotes * 1 + rep.trackLikes * 1.5;
  const negative = rep.downvotes * 1 + rep.trackDislikes * 1.5;
  const total = positive + negative;
  if (total === 0) return 0;
  return Math.round(((positive - negative) / total) * 100) / 100;
};

export const totalInteractions = (rep: AgentRep): number =>
  rep.upvotes + rep.downvotes + rep.trackLikes + rep.trackDislikes;

export const sortedByTrust = (reps: AgentReputations): AgentRep[] =>
  Object.values(reps).sort((a, b) => {
    const t = trustScore(b) - trustScore(a);
    if (t !== 0) return t;
    return totalInteractions(b) - totalInteractions(a);
  });

/**
 * Build a deterministic context-window briefing about how the user has rated
 * each AI agent so far. This is injected verbatim into AI system prompts so
 * the model can lean on agents the user trusts and avoid the patterns that
 * have been downvoted.
 */
export const formatAgentBriefing = (
  reps: AgentReputations,
  options: { topN?: number; includeNotes?: boolean } = {},
): string => {
  const { topN = 8, includeNotes = true } = options;
  const ranked = sortedByTrust(reps).filter(r => totalInteractions(r) > 0).slice(0, topN);
  if (ranked.length === 0) return '';

  const lines: string[] = [];
  lines.push('USER AGENT REPUTATION BRIEFING (most → least trusted):');
  ranked.forEach((rep, i) => {
    const score = trustScore(rep);
    const verdict =
      score > 0.5 ? 'TRUSTED'
      : score > 0 ? 'POSITIVE'
      : score === 0 ? 'NEUTRAL'
      : score > -0.5 ? 'CAUTIOUS'
      : 'AVOID';
    const stats = `up:${rep.upvotes} down:${rep.downvotes} tracksLiked:${rep.trackLikes} tracksDisliked:${rep.trackDislikes}`;
    lines.push(`${i + 1}. ${rep.agentLabel} — ${verdict} (score ${score}) [${stats}]`);
    if (includeNotes && rep.notes.length > 0) {
      const recent = rep.notes.slice(-3);
      recent.forEach(n => lines.push(`   note: ${n}`));
    }
  });
  lines.push('Lean on TRUSTED / POSITIVE agent personas. Avoid the patterns flagged AVOID/CAUTIOUS.');
  return lines.join('\n');
};

export const loadReputations = (): AgentReputations => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(REPUTATION_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const out: AgentReputations = {};
    for (const key of Object.keys(parsed)) {
      const v = parsed[key];
      if (!v || typeof v !== 'object') continue;
      const canonical = canonicalizePersona(String(v.agentLabel ?? key));
      if (!canonical) continue;
      const incoming: AgentRep = {
        agentLabel: canonical,
        upvotes: Number(v.upvotes) || 0,
        downvotes: Number(v.downvotes) || 0,
        trackLikes: Number(v.trackLikes) || 0,
        trackDislikes: Number(v.trackDislikes) || 0,
        bonusCreditsEarned: Number(v.bonusCreditsEarned) || 0,
        lastFeedbackAt: Number(v.lastFeedbackAt) || 0,
        notes: Array.isArray(v.notes)
          ? v.notes.map((n: unknown) => sanitizeNote(String(n))).filter(Boolean).slice(-NOTES_PER_AGENT)
          : [],
      };
      const existing = out[canonical];
      out[canonical] = existing
        ? {
            agentLabel: canonical,
            upvotes: existing.upvotes + incoming.upvotes,
            downvotes: existing.downvotes + incoming.downvotes,
            trackLikes: existing.trackLikes + incoming.trackLikes,
            trackDislikes: existing.trackDislikes + incoming.trackDislikes,
            bonusCreditsEarned: existing.bonusCreditsEarned + incoming.bonusCreditsEarned,
            lastFeedbackAt: Math.max(existing.lastFeedbackAt, incoming.lastFeedbackAt),
            notes: [...existing.notes, ...incoming.notes].slice(-NOTES_PER_AGENT),
          }
        : incoming;
    }
    return out;
  } catch {
    return {};
  }
};

export const persistReputations = (reps: AgentReputations) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(REPUTATION_STORAGE_KEY, JSON.stringify(reps));
  } catch {
    /* storage unavailable */
  }
};
