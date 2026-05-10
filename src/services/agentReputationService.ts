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
  agentLabel,
  upvotes: 0,
  downvotes: 0,
  trackLikes: 0,
  trackDislikes: 0,
  bonusCreditsEarned: 0,
  lastFeedbackAt: 0,
  notes: [],
});

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
      out[key] = {
        agentLabel: String(v.agentLabel ?? key),
        upvotes: Number(v.upvotes) || 0,
        downvotes: Number(v.downvotes) || 0,
        trackLikes: Number(v.trackLikes) || 0,
        trackDislikes: Number(v.trackDislikes) || 0,
        bonusCreditsEarned: Number(v.bonusCreditsEarned) || 0,
        lastFeedbackAt: Number(v.lastFeedbackAt) || 0,
        notes: Array.isArray(v.notes) ? v.notes.map(String).slice(-12) : [],
      };
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
