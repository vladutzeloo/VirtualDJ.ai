import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ThumbsUp, ThumbsDown, Bot, Brain, Coins, Award, ChevronDown } from 'lucide-react';
import {
  AgentReputations,
  sortedByTrust,
  totalInteractions,
  trustScore,
} from '../services/agentReputationService';

interface AgentRankerProps {
  reputations: AgentReputations;
  agentAvatars: Record<string, string>;
  onRate: (agentLabel: string, vote: 'up' | 'down') => void;
  /** Extra agent labels currently visible in the suggestion list — used to seed
   *  ranking entries even before the user has voted on them. */
  visibleAgentLabels?: string[];
  className?: string;
}

const verdictMeta = (score: number, total: number) => {
  if (total === 0) return { label: 'New', color: 'text-slate-400', chip: 'bg-slate-500/15 border-slate-500/40 text-slate-300' };
  if (score > 0.5) return { label: 'Trusted', color: 'text-emerald-300', chip: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' };
  if (score > 0) return { label: 'Positive', color: 'text-cyan-300', chip: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300' };
  if (score === 0) return { label: 'Neutral', color: 'text-slate-300', chip: 'bg-slate-500/15 border-slate-500/40 text-slate-300' };
  if (score > -0.5) return { label: 'Cautious', color: 'text-amber-300', chip: 'bg-amber-500/15 border-amber-500/40 text-amber-300' };
  return { label: 'Avoid', color: 'text-rose-300', chip: 'bg-rose-500/15 border-rose-500/40 text-rose-300' };
};

export const AgentRanker = ({
  reputations,
  agentAvatars,
  onRate,
  visibleAgentLabels = [],
  className,
}: AgentRankerProps) => {
  const [expanded, setExpanded] = useState(false);

  const merged = useMemo(() => {
    const entries = sortedByTrust(reputations);
    const seen = new Set(entries.map(e => e.agentLabel));
    visibleAgentLabels
      .filter(label => label && !seen.has(label))
      .forEach(label => {
        entries.push({
          agentLabel: label,
          upvotes: 0,
          downvotes: 0,
          trackLikes: 0,
          trackDislikes: 0,
          bonusCreditsEarned: 0,
          lastFeedbackAt: 0,
          notes: [],
        });
      });
    return entries;
  }, [reputations, visibleAgentLabels]);

  const ranked = expanded ? merged : merged.slice(0, 4);
  const briefingActive = merged.some(r => totalInteractions(r) > 0);

  return (
    <div
      className={`glass rounded-2xl border border-jarvis-accent-cyan/20 bg-vdj-surface/40 backdrop-blur-md p-4 flex flex-col gap-3 ${className ?? ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-jarvis-accent-cyan" />
          <h3 className="vdj-display text-[11px] font-bold uppercase tracking-[0.2em] text-white">Agent Ranker</h3>
          <span
            className={`text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border ${
              briefingActive
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-500/10 border-slate-500/30 text-slate-400'
            }`}
            title={briefingActive ? 'Reputation briefing is being injected into AI context windows.' : 'Vote on an agent to inject their reputation into AI calls.'}
          >
            {briefingActive ? 'Context · Live' : 'Context · Idle'}
          </span>
        </div>
        {merged.length > 4 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-[9px] font-mono uppercase tracking-widest text-slate-400 hover:text-white flex items-center gap-1"
          >
            {expanded ? 'Less' : `+${merged.length - 4} more`}
            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
        Thumbs-up to teach the recommender to lean into a persona; thumbs-down to deprioritize them. Up-votes pay you <span className="text-amber-300">+15</span> credits.
      </p>

      {ranked.length === 0 ? (
        <div className="text-[10px] font-mono text-slate-500 italic py-2">
          No agents tracked yet. Run a search and rate the agents that surface.
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          <AnimatePresence initial={false}>
            {ranked.map(rep => {
              const total = totalInteractions(rep);
              const score = trustScore(rep);
              const meta = verdictMeta(score, total);
              return (
                <motion.li
                  key={rep.agentLabel}
                  layout
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-black/20 border border-white/5"
                >
                  {agentAvatars[rep.agentLabel] ? (
                    <img
                      src={agentAvatars[rep.agentLabel]}
                      alt={rep.agentLabel}
                      className="w-6 h-6 rounded-full border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center">
                      <Bot className="w-3 h-3 text-slate-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-display font-bold text-white truncate">
                        {rep.agentLabel}
                      </span>
                      <span className={`text-[7px] font-mono uppercase tracking-widest px-1 py-0.5 rounded border ${meta.chip}`}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[8px] font-mono text-slate-500 mt-0.5">
                      <span title="Track likes / dislikes">
                        ♥ {rep.trackLikes} · ✕ {rep.trackDislikes}
                      </span>
                      <span title="Direct upvotes / downvotes">
                        ▲ {rep.upvotes} · ▼ {rep.downvotes}
                      </span>
                      {rep.bonusCreditsEarned > 0 && (
                        <span className="text-amber-300 inline-flex items-center gap-0.5" title="Bonus credits earned for you">
                          <Coins className="w-2.5 h-2.5" />
                          {rep.bonusCreditsEarned}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onRate(rep.agentLabel, 'up')}
                      className="w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-colors flex items-center justify-center"
                      title="Upvote agent (+15 credits)"
                      aria-label={`Upvote ${rep.agentLabel}`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRate(rep.agentLabel, 'down')}
                      className="w-7 h-7 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 transition-colors flex items-center justify-center"
                      title="Downvote agent"
                      aria-label={`Downvote ${rep.agentLabel}`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {briefingActive && (
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-300/80">
          <Award className="w-3 h-3" />
          Reputation briefing is now part of every recommendation prompt.
        </div>
      )}
    </div>
  );
};
