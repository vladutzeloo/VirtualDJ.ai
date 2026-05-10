import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Heart,
  ThumbsDown,
  Trash2,
  ListMusic,
  Sparkles,
  Loader2,
  Search,
  AlertTriangle,
} from 'lucide-react';
import type { TrackRecommendation } from '../services/musicService';
import {
  analyzePreferences,
  tracksToFeedback,
  type TasteProfile,
} from '../services/preferenceAgentService';

interface PlaylistPanelProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: TrackRecommendation[];
  liked: TrackRecommendation[];
  disliked: TrackRecommendation[];
  onRemoveFromPlaylist: (id: string) => void;
  onClearVerdict: (id: string) => void;
  onUseSeedQuery: (seed: string) => void;
  theme: 'dark' | 'light';
}

export const PlaylistPanel = ({
  isOpen,
  onClose,
  playlist,
  liked,
  disliked,
  onRemoveFromPlaylist,
  onClearVerdict,
  onUseSeedQuery,
  theme,
}: PlaylistPanelProps) => {
  const [profile, setProfile] = useState<TasteProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const feedback = useMemo(
    () => tracksToFeedback([...liked, ...disliked]),
    [liked, disliked],
  );

  const fingerprint = useMemo(
    () =>
      feedback
        .map((f) => `${f.id}:${f.verdict}:${f.reason ?? ''}`)
        .sort()
        .join('|'),
    [feedback],
  );

  useEffect(() => {
    if (!isOpen) return;
    if (feedback.length === 0) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    analyzePreferences(feedback)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? 'Preference agent failed.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, fingerprint]);

  const reasonForId = (id: string) =>
    profile?.per_track.find((p) => p.id === id)?.why;

  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] bg-vdj-bg/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full sm:max-w-2xl max-h-[92vh] overflow-hidden flex flex-col rounded-t-3xl sm:rounded-3xl border ${
              isDark
                ? 'bg-jarvis-card border-jarvis-accent-cyan/20'
                : 'bg-white border-slate-200'
            }`}
          >
            <header className={`flex items-center justify-between px-5 py-4 border-b ${
              isDark ? 'border-white/10' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <ListMusic className="w-5 h-5 text-jarvis-accent-cyan" />
                <h2 className={`text-sm font-display font-bold uppercase tracking-[0.2em] ${
                  isDark ? 'text-white' : 'text-slate-800'
                }`}>
                  My Playlist
                </h2>
                <span className="text-[10px] font-mono text-slate-500">
                  {playlist.length} saved · {liked.length} liked · {disliked.length} disliked
                </span>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-full transition-colors ${
                  isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="overflow-y-auto custom-scrollbar p-5 flex flex-col gap-5">
              {/* Insight panel */}
              <section className={`rounded-2xl border p-4 ${
                isDark
                  ? 'bg-gradient-to-br from-jarvis-accent-cyan/10 to-jarvis-accent-pink/5 border-jarvis-accent-cyan/20'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-jarvis-accent-pink" />
                  <h3 className={`text-[10px] font-display font-bold uppercase tracking-[0.2em] ${
                    isDark ? 'text-white' : 'text-slate-700'
                  }`}>
                    Taste Agent · powered by Claude
                  </h3>
                </div>

                {loading && (
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <Loader2 className="w-3 h-3 animate-spin" /> Analyzing your ratings…
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 text-xs font-mono text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {!loading && !error && !profile && (
                  <p className="text-xs font-mono text-slate-400 leading-relaxed">
                    Like or dislike a few suggestions and the agent will explain why those choices
                    fit together — and what to play next.
                  </p>
                )}

                {!loading && !error && profile && (
                  <div className="flex flex-col gap-3">
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {profile.summary}
                    </p>

                    {profile.loved_traits.length > 0 && (
                      <div>
                        <p className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 font-bold mb-1">
                          You're drawn to
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.loved_traits.map((trait) => (
                            <span
                              key={trait}
                              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                            >
                              {trait}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {profile.rejected_traits.length > 0 && (
                      <div>
                        <p className="text-[9px] font-mono uppercase tracking-widest text-rose-400 font-bold mb-1">
                          You're steering away from
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.rejected_traits.map((trait) => (
                            <span
                              key={trait}
                              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300"
                            >
                              {trait}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {profile.next_move && (
                      <div>
                        <p className="text-[9px] font-mono uppercase tracking-widest text-jarvis-accent-cyan font-bold mb-1">
                          Next move
                        </p>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                          {profile.next_move}
                        </p>
                      </div>
                    )}

                    {profile.search_seed && (
                      <button
                        onClick={() => {
                          onUseSeedQuery(profile.search_seed);
                          onClose();
                        }}
                        className="self-start mt-1 flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-jarvis-accent-cyan/20 border border-jarvis-accent-cyan/40 text-jarvis-accent-cyan hover:bg-jarvis-accent-cyan/30 transition-all"
                      >
                        <Search className="w-3 h-3" />
                        Search "{profile.search_seed}"
                      </button>
                    )}
                  </div>
                )}
              </section>

              {/* Playlist */}
              <section>
                <h3 className={`text-[10px] font-display font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-700'
                }`}>
                  <ListMusic className="w-3.5 h-3.5 text-jarvis-accent-cyan" /> Saved Tracks
                </h3>
                {playlist.length === 0 ? (
                  <p className="text-xs font-mono text-slate-500 italic">
                    Tap the playlist icon on a suggestion card to save it here.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {playlist.map((t) => (
                      <li
                        key={t.id}
                        className={`flex items-center gap-3 p-2 rounded-lg border ${
                          isDark
                            ? 'bg-slate-900/50 border-jarvis-border/40'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        {t.imageUrl ? (
                          <img
                            src={t.imageUrl}
                            alt=""
                            className="w-10 h-10 rounded object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-slate-800 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${
                            isDark ? 'text-white' : 'text-slate-800'
                          }`}>{t.title}</p>
                          <p className="text-[10px] font-mono text-slate-500 truncate">{t.artist}</p>
                        </div>
                        <button
                          onClick={() => onRemoveFromPlaylist(t.id)}
                          className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Remove from playlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Liked with reasons */}
              {liked.length > 0 && (
                <section>
                  <h3 className="text-[10px] font-display font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2 text-emerald-400">
                    <Heart className="w-3.5 h-3.5 fill-current" /> Liked · why the agent thinks you liked them
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {liked.map((t) => (
                      <li
                        key={t.id}
                        className={`p-3 rounded-lg border ${
                          isDark
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : 'bg-emerald-50 border-emerald-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className={`text-xs font-bold truncate ${
                              isDark ? 'text-white' : 'text-slate-800'
                            }`}>{t.title}</p>
                            <p className="text-[10px] font-mono text-slate-500 truncate">{t.artist}</p>
                          </div>
                          <button
                            onClick={() => onClearVerdict(t.id)}
                            className="text-[9px] font-mono uppercase text-slate-500 hover:text-slate-300"
                          >
                            clear
                          </button>
                        </div>
                        {t.feedbackReason && (
                          <p className="mt-2 text-[10px] font-mono text-emerald-300/90 italic">
                            Your note: "{t.feedbackReason}"
                          </p>
                        )}
                        {reasonForId(t.id) && (
                          <p className={`mt-1 text-[11px] leading-snug ${
                            isDark ? 'text-emerald-100/90' : 'text-emerald-900'
                          }`}>
                            <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-400 mr-1">
                              Agent:
                            </span>
                            {reasonForId(t.id)}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Disliked with reasons */}
              {disliked.length > 0 && (
                <section>
                  <h3 className="text-[10px] font-display font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2 text-rose-400">
                    <ThumbsDown className="w-3.5 h-3.5" /> Disliked · why the agent thinks you skipped them
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {disliked.map((t) => (
                      <li
                        key={t.id}
                        className={`p-3 rounded-lg border ${
                          isDark
                            ? 'bg-rose-500/5 border-rose-500/20'
                            : 'bg-rose-50 border-rose-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className={`text-xs font-bold truncate ${
                              isDark ? 'text-white' : 'text-slate-800'
                            }`}>{t.title}</p>
                            <p className="text-[10px] font-mono text-slate-500 truncate">{t.artist}</p>
                          </div>
                          <button
                            onClick={() => onClearVerdict(t.id)}
                            className="text-[9px] font-mono uppercase text-slate-500 hover:text-slate-300"
                          >
                            clear
                          </button>
                        </div>
                        {t.feedbackReason && (
                          <p className="mt-2 text-[10px] font-mono text-rose-300/90 italic">
                            Your note: "{t.feedbackReason}"
                          </p>
                        )}
                        {reasonForId(t.id) && (
                          <p className={`mt-1 text-[11px] leading-snug ${
                            isDark ? 'text-rose-100/90' : 'text-rose-900'
                          }`}>
                            <span className="font-mono text-[9px] uppercase tracking-widest text-rose-400 mr-1">
                              Agent:
                            </span>
                            {reasonForId(t.id)}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
