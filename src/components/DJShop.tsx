import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Disc3, Sparkles, Coins, Check, Lock, X, ShoppingBag, Zap, Star, Crown } from 'lucide-react';
import { DJ_SKINS, DJSkin, RARITY_META, SkinRarity, findSkin } from '../data/djSkins';

interface DJShopProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  credits: number;
  ownedSkinIds: string[];
  equippedSkinId: string;
  onPurchase: (skin: DJSkin) => boolean;
  onEquip: (skin: DJSkin) => void;
}

const RARITY_ORDER: SkinRarity[] = ['standard', 'rare', 'epic', 'legendary'];

const RarityIcon = ({ rarity }: { rarity: SkinRarity }) => {
  if (rarity === 'legendary') return <Crown className="w-3 h-3" />;
  if (rarity === 'epic') return <Sparkles className="w-3 h-3" />;
  if (rarity === 'rare') return <Star className="w-3 h-3" />;
  return <Zap className="w-3 h-3" />;
};

const SkinPreview = ({ skin, spinning }: { skin: DJSkin; spinning?: boolean }) => (
  <div
    className="relative w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden border"
    style={{
      background: `radial-gradient(circle at 50% 50%, ${skin.glow}22 0%, transparent 65%), linear-gradient(135deg, ${skin.platter} 0%, #000 100%)`,
      borderColor: `${skin.glow}55`,
      boxShadow: `inset 0 0 24px ${skin.glow}22, 0 0 32px -10px ${skin.glow}88`,
    }}
  >
    <div
      className={spinning ? 'relative animate-spin-slow' : 'relative'}
      style={{ width: '78%', aspectRatio: '1 / 1' }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${skin.label} 0%, ${skin.label} 22%, ${skin.vinyl} 23%, ${skin.vinyl} 100%)`,
          boxShadow: `0 0 0 2px ${skin.tonearm}33, inset 0 0 20px rgba(0,0,0,0.6)`,
        }}
      />
      {/* Concentric grooves */}
      {[0.32, 0.42, 0.52, 0.62, 0.72, 0.82, 0.92].map((r, i) => (
        <div
          key={i}
          className="absolute rounded-full border"
          style={{
            top: `${50 - (r * 100) / 2}%`,
            left: `${50 - (r * 100) / 2}%`,
            width: `${r * 100}%`,
            height: `${r * 100}%`,
            borderColor: 'rgba(255,255,255,0.07)',
          }}
        />
      ))}
      {/* Center spindle */}
      <div
        className="absolute rounded-full"
        style={{
          top: '48%',
          left: '48%',
          width: '4%',
          height: '4%',
          background: skin.tonearm,
          boxShadow: `0 0 6px ${skin.glow}`,
        }}
      />
    </div>
  </div>
);

export const DJShop = ({
  isOpen,
  onClose,
  theme,
  credits,
  ownedSkinIds,
  equippedSkinId,
  onPurchase,
  onEquip,
}: DJShopProps) => {
  const [filter, setFilter] = useState<'all' | SkinRarity>('all');
  const [focusedId, setFocusedId] = useState<string>(equippedSkinId);
  const [pulseId, setPulseId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = filter === 'all' ? DJ_SKINS : DJ_SKINS.filter(s => s.rarity === filter);
    return [...list].sort((a, b) => {
      const owA = ownedSkinIds.includes(a.id) ? 0 : 1;
      const owB = ownedSkinIds.includes(b.id) ? 0 : 1;
      if (owA !== owB) return owA - owB;
      const rA = RARITY_ORDER.indexOf(a.rarity);
      const rB = RARITY_ORDER.indexOf(b.rarity);
      if (rA !== rB) return rA - rB;
      return a.price - b.price;
    });
  }, [filter, ownedSkinIds]);

  const focused = findSkin(focusedId);
  const isFocusedOwned = ownedSkinIds.includes(focused.id);
  const canAfford = credits >= focused.price;

  const handleAction = (skin: DJSkin) => {
    if (ownedSkinIds.includes(skin.id)) {
      onEquip(skin);
      setPulseId(skin.id);
      setTimeout(() => setPulseId(null), 700);
      return;
    }
    if (credits < skin.price) return;
    const ok = onPurchase(skin);
    if (ok) {
      setPulseId(skin.id);
      setTimeout(() => setPulseId(null), 700);
    }
  };

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className={`relative w-full max-w-5xl max-h-[90vh] rounded-3xl border overflow-hidden shadow-2xl flex flex-col ${
            isDark
              ? 'bg-vdj-surface-2/90 border-vdj-border-strong'
              : 'bg-white/95 border-slate-200'
          }`}
          role="dialog"
          aria-label="DJ Shop"
        >
          {/* Header */}
          <div
            className={`relative px-6 py-4 border-b flex items-center gap-3 ${
              isDark ? 'border-white/10' : 'border-slate-200'
            }`}
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-jarvis-accent-cyan" />
              <span className="absolute inset-0 blur-md bg-jarvis-accent-cyan/40 -z-10" />
            </div>
            <div className="flex flex-col">
              <span className={`text-[10px] font-mono uppercase tracking-[0.3em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Neural Outfitter
              </span>
              <span className={`text-base font-display font-black uppercase tracking-[0.18em] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                DJ Shop
              </span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-mono text-xs ${
                  isDark
                    ? 'bg-amber-400/10 border-amber-400/40 text-amber-200'
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}
                title="Earn credits by playing & liking tracks"
              >
                <Coins className="w-3.5 h-3.5" />
                <span className="font-bold tabular-nums">{credits.toLocaleString()}</span>
                <span className="opacity-60 text-[9px] uppercase tracking-widest">credits</span>
              </div>
              <button
                onClick={onClose}
                className={`rounded-lg p-2 transition-colors ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                aria-label="Close DJ Shop"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className={`px-6 py-3 border-b flex items-center gap-2 overflow-x-auto ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
            {(['all', ...RARITY_ORDER] as const).map(opt => {
              const active = filter === opt;
              const meta = opt === 'all' ? null : RARITY_META[opt];
              return (
                <button
                  key={opt}
                  onClick={() => setFilter(opt)}
                  className={`px-3 py-1.5 rounded-full border text-[10px] font-mono uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    active
                      ? isDark
                        ? 'bg-jarvis-accent-cyan/15 border-jarvis-accent-cyan/50 text-jarvis-accent-cyan'
                        : 'bg-jarvis-accent-cyan/10 border-jarvis-accent-cyan/40 text-jarvis-accent-cyan'
                      : isDark
                      ? 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {opt === 'all' ? <Disc3 className="w-3 h-3" /> : <RarityIcon rarity={opt} />}
                  {opt === 'all' ? 'All' : meta?.label}
                </button>
              );
            })}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-0">
            {/* Catalog grid */}
            <div className="md:col-span-2 p-5 grid grid-cols-2 sm:grid-cols-3 gap-3 content-start">
              {filtered.map(skin => {
                const owned = ownedSkinIds.includes(skin.id);
                const equipped = equippedSkinId === skin.id;
                const affordable = credits >= skin.price;
                const meta = RARITY_META[skin.rarity];
                return (
                  <button
                    key={skin.id}
                    onClick={() => setFocusedId(skin.id)}
                    onDoubleClick={() => handleAction(skin)}
                    className={`group relative text-left rounded-2xl border overflow-hidden transition-all ${
                      focusedId === skin.id
                        ? `ring-2 ${meta.ring}`
                        : ''
                    } ${
                      isDark
                        ? 'bg-vdj-surface/60 border-white/10 hover:border-white/30'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    } ${pulseId === skin.id ? 'animate-pulse' : ''}`}
                  >
                    <div className="p-2">
                      <SkinPreview skin={skin} spinning={equipped} />
                    </div>
                    <div className="px-3 pb-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-widest border rounded-sm ${meta.chip}`}>
                          <RarityIcon rarity={skin.rarity} />
                          {meta.label}
                        </span>
                        {equipped && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-widest border rounded-sm bg-emerald-500/15 text-emerald-300 border-emerald-500/40">
                            <Check className="w-3 h-3" /> Equipped
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] font-display font-bold tracking-wide truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {skin.name}
                      </p>
                      <div className="mt-1 flex items-center justify-between">
                        {owned ? (
                          <span className={`text-[9px] font-mono uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Owned
                          </span>
                        ) : (
                          <span className={`text-[10px] font-mono flex items-center gap-1 ${
                            affordable
                              ? isDark ? 'text-amber-300' : 'text-amber-600'
                              : isDark ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            <Coins className="w-3 h-3" />
                            {skin.price.toLocaleString()}
                          </span>
                        )}
                        {!owned && !affordable && (
                          <Lock className={`w-3 h-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detail panel */}
            <aside className={`p-5 border-t md:border-t-0 md:border-l flex flex-col gap-4 ${isDark ? 'border-white/5 bg-black/20' : 'border-slate-100 bg-slate-50/60'}`}>
              <div className={`text-[10px] font-mono uppercase tracking-[0.25em] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                Live Preview
              </div>
              <SkinPreview skin={focused} spinning />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-widest border rounded-sm ${RARITY_META[focused.rarity].chip}`}>
                    <RarityIcon rarity={focused.rarity} />
                    {RARITY_META[focused.rarity].label}
                  </span>
                </div>
                <h3 className={`text-lg font-display font-black tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {focused.name}
                </h3>
                <p className={`text-xs leading-relaxed mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {focused.description}
                </p>
              </div>

              {/* Color palette swatches */}
              <div className="flex items-center gap-2">
                {[
                  { key: 'Vinyl', c: focused.vinyl },
                  { key: 'Label', c: focused.label },
                  { key: 'Platter', c: focused.platter },
                  { key: 'Tonearm', c: focused.tonearm },
                  { key: 'Glow', c: focused.glow },
                ].map(({ key, c }) => (
                  <div key={key} className="flex flex-col items-center gap-1">
                    <span
                      className="w-5 h-5 rounded-full border border-white/20"
                      style={{ background: c, boxShadow: `0 0 8px ${c}66` }}
                    />
                    <span className={`text-[8px] font-mono uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      {key}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => handleAction(focused)}
                disabled={!isFocusedOwned && !canAfford}
                className={`mt-auto w-full px-4 py-3 rounded-xl border font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                  equippedSkinId === focused.id
                    ? isDark
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 cursor-default'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default'
                    : isFocusedOwned
                    ? isDark
                      ? 'bg-jarvis-accent-cyan/15 border-jarvis-accent-cyan/40 text-jarvis-accent-cyan hover:bg-jarvis-accent-cyan/25'
                      : 'bg-jarvis-accent-cyan/10 border-jarvis-accent-cyan/40 text-jarvis-accent-cyan hover:bg-jarvis-accent-cyan/20'
                    : canAfford
                    ? isDark
                      ? 'bg-amber-400/15 border-amber-400/40 text-amber-200 hover:bg-amber-400/25'
                      : 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                    : isDark
                    ? 'bg-white/5 border-white/10 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {equippedSkinId === focused.id ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Currently Equipped
                  </>
                ) : isFocusedOwned ? (
                  <>
                    <Disc3 className="w-3.5 h-3.5" />
                    Equip Skin
                  </>
                ) : canAfford ? (
                  <>
                    <Coins className="w-3.5 h-3.5" />
                    Buy for {focused.price.toLocaleString()}
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    Need {(focused.price - credits).toLocaleString()} more
                  </>
                )}
              </button>

              <div className={`text-[9px] font-mono uppercase tracking-widest text-center ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                +25 / play · +10 / like · +5 / search
              </div>
            </aside>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
