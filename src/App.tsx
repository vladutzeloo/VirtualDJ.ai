import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { 
  Radio, 
  Menu, 
  Search, 
  Bell, 
  Settings, 
  LayoutGrid, 
  MessageSquare, 
  Briefcase, 
  Globe, 
  Building2, 
  Music,
  Disc,
  Heart,
  Plus,
  Trash2,
  Bot,
  ChevronRight,
  TrendingUp,
  Activity,
  Zap,
  Camera,
  X,
  Volume2,
  Moon,
  Sun
} from "lucide-react";
import { StatItem } from './components/StatItem';
import { MixerKnob } from './components/MixerKnob';
import { TrackLayer, TrackData } from './components/TrackLayer';
import { getTrackRecommendations, TrackRecommendation } from './services/musicService';
import { generateTrackArtwork, generateAgentAvatar } from './services/imageService';
import { JulesAgent } from './components/JulesAgent';
import { TrackModal } from './components/TrackModal';
import { AIBrain } from './components/AIBrain';
import { ControlDeck } from './components/ControlDeck';
import { PhoneFrame } from './components/PhoneFrame';
import { Turntable3D } from './components/Turntable3D';
import { VisionScanner } from './components/VisionScanner';
import { AgentShowcase } from './components/AgentShowcase';
import { RecordPicker } from './components/RecordPicker';
import { SocialPickups } from './components/SocialPickups';
import { Vault } from './components/Vault';

import { Logo } from './components/Logo';

const STATIONS = [
  { id: 'sw', label: 'Synthwave', sub: 'SYNTHWAVE', color: 'bg-pink-600/20 text-pink-400 border-pink-500/30' },
  { id: 'cp', label: 'Cyberpunk', sub: 'CYBERPUNK', color: 'bg-cyan-600/20 text-cyan-400 border-cyan-500/30' },
  { id: 'el', label: 'Electronic', sub: 'ELECTRONIC', color: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30' },
  { id: 'tc', label: 'Techno', sub: 'TECHNO', color: 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30' },
  { id: 'tr', label: 'Trap', sub: 'TRAP', color: 'bg-orange-600/20 text-orange-400 border-orange-500/30' },
  { id: 'rk', label: 'Rock', sub: 'ROCK', color: 'bg-red-600/20 text-red-400 border-red-500/30' },
];

interface LogEntry {
  id: string;
  agent: string;
  msg: string;
  time: string;
  type: 'info' | 'warn' | 'success';
}

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState('RADIO');
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [tracks, setTracks] = useState<TrackData[]>([
    { id: '1', title: 'Neon Nights', artist: 'Jarvis Original', agentLabel: 'BASS ENHANCER', duration: '04:20', isPlaying: false, color: 'cyan' },
    { id: '2', title: 'Data Stream', artist: 'Noisia - Dustup', agentLabel: 'SYNC MASTER', duration: '05:02', isPlaying: false, color: 'pink' },
  ]);
  const [suggestions, setSuggestions] = useState<TrackRecommendation[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<TrackRecommendation | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('spor dnb');
  const [searchMode, setSearchMode] = useState<'GLOBAL' | 'LOCAL'>('GLOBAL');
  const [isOffline, setIsOffline] = useState(false);
  const [isGymMode, setIsGymMode] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [gymStats, setGymStats] = useState({ hr: 72, steps: 2450, session: '00:00:00' });
  const [agentAvatars, setAgentAvatars] = useState<Record<string, string>>({});
  const [localTracks, setLocalTracks] = useState<TrackData[]>([
    { id: 'loc-1', title: 'Home Recording 01', artist: 'Local File', agentLabel: 'CLEANER', duration: '02:45', isPlaying: false, color: 'emerald' },
  ]);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', agent: 'JULES', msg: 'System initialized. Waiting for music search input.', time: '21:35:02', type: 'info' },
    { id: '2', agent: 'SYNC', msg: 'Layer synchronization established.', time: '21:35:05', type: 'success' },
  ]);
  const [mixerValues, setMixerValues] = useState({
    volume: 100,
    bass: 50,
    mid: 45,
    treble: 60,
    crossfader: 50,
    tempo: 128
  });

  const addLog = (agent: string, msg: string, type: 'info' | 'warn' | 'success' = 'info') => {
    setLogs(prev => [{
      id: Math.random().toString(36),
      agent,
      msg,
      time: new Date().toLocaleTimeString([], { hour12: false }),
      type
    }, ...prev].slice(0, 50));
  };

  const fetchSuggestions = async (query: string) => {
    setLoadingSuggestions(true);
    addLog(searchMode === 'GLOBAL' ? 'DIGGER' : 'LOCAL-BOT', `Scanning ${searchMode.toLowerCase()} archives for ${query}...`, 'info');
    const recs = await getTrackRecommendations(`${query}${searchMode === 'LOCAL' ? ' (local recording style)' : ''}`);
    setSuggestions(recs);
    setLoadingSuggestions(false);
    addLog('ANALYST', `Processed ${recs.length} candidates. Pattern matching rank confirmed.`, 'success');

    // Background image generation using Gemini 3.1 Flash Image (Banana 2)
    recs.forEach(async (rec, index) => {
      const imageUrl = await generateTrackArtwork(rec.title, rec.artist, rec.genre);
      if (imageUrl) {
        setSuggestions(prev => prev.map((s, i) => i === index ? { ...s, imageUrl } : s));
      }

      // Pre-generate agent avatars if not already present
      if (!agentAvatars[rec.agentLabel]) {
        const avatarUrl = await generateAgentAvatar(rec.agentLabel, 'Music Discovery Specialist');
        if (avatarUrl) setAgentAvatars(prev => ({ ...prev, [rec.agentLabel]: avatarUrl }));
      }
    });
  };

  useEffect(() => {
    let interval: any;
    if (isGymMode) {
      interval = setInterval(() => {
        setGymStats(prev => ({
          ...prev,
          hr: Math.floor(110 + Math.random() * 40),
          steps: prev.steps + Math.floor(Math.random() * 5)
        }));
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isGymMode]);

  useEffect(() => {
    fetchSuggestions('Drum & Bass');
  }, []);

  const togglePlay = (id: string) => {
    const track = tracks.find(t => t.id === id);
    if (!track) return;
    addLog(track.agentLabel, `${track.isPlaying ? 'Paused' : 'Playing'} track: ${track.title}`, track.isPlaying ? 'info' : 'success');
    setTracks(prev => prev.map(t => t.id === id ? { ...t, isPlaying: !t.isPlaying } : t));
  };

  const addTrack = (rec: TrackRecommendation, notes?: string) => {
    addLog('JULES', `Deploying agent "${rec.agentLabel}" to new track: ${rec.title}${notes ? ' (with neural notes)' : ''}`, 'info');
    setIsDeploying(true);
    
    // Simulate planning state
    setTimeout(() => {
      const newTrack: TrackData = {
        id: Math.random().toString(36).substr(2, 9),
        title: rec.title,
        artist: rec.artist,
        agentLabel: rec.agentLabel,
        duration: '03:45',
        isPlaying: false,
        color: tracks.length % 2 === 0 ? 'cyan' : 'pink'
      };
      setTracks(prev => [...prev, newTrack]);
      setIsDeploying(false);
      if (notes) addLog(rec.agentLabel, `Notes integration: ${notes.slice(0, 50)}...`, 'success');
      addLog(rec.agentLabel, `Track successfully integrated into the mix.`, 'success');
    }, 1500);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    addLog('SYSTEM', `Analyzing ${files.length} uploaded files...`, 'info');
    
    Array.from(files).forEach(file => {
      const newLocalTrack: TrackData = {
        id: Math.random().toString(36).substr(2, 9),
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'User Upload',
        agentLabel: 'UPLOADER',
        duration: '??:??',
        isPlaying: false,
        color: 'emerald'
      };
      setLocalTracks(prev => [newLocalTrack, ...prev]);
      addLog('UPLOADER', `Track "${file.name}" imported to local library.`, 'success');
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileUpload(e.dataTransfer.files);
  };

  const handleGesture = (gesture: string) => {
    const g = gesture.toLowerCase();
    addLog('NEURAL-LINK', `Gesture detected: ${g.toUpperCase()}`, 'success');
    
    if (g.includes('fist')) {
       setTracks(prev => prev.map(t => ({ ...t, isPlaying: false })));
       addLog('SYSTEM', 'Emergency Stop: Global pause initiated.', 'warn');
    } else if (g.includes('open hand')) {
       if (tracks.length > 0) {
         setTracks(prev => prev.map((t, i) => i === 0 ? { ...t, isPlaying: true } : t));
         addLog('SYSTEM', 'Neural Play: Layer A engaged.', 'success');
       }
    } else if (g.includes('pointing')) {
       setMixerValues(prev => ({ ...prev, volume: Math.min(100, prev.volume + 10) }));
       addLog('SYSTEM', 'Volume increase detected via gesture.', 'info');
    } else if (g.includes('two fingers spread')) {
       setMixerValues(prev => ({ ...prev, tempo: Math.min(180, prev.tempo + 5) }));
       addLog('SYSTEM', 'Tempo sync: Increasing BPM via gesture.', 'success');
    } else if (g.includes('thumbs up')) {
       setTracks(prev => prev.map(t => t.isPlaying ? { ...t, liked: true } : t));
       addLog('SYSTEM', 'Neural Like: Track added to favorites.', 'success');
    }
  };

  return (
    <div 
      className={`flex h-screen w-screen overflow-hidden font-sans relative items-center justify-center transition-colors duration-500 ${theme === 'dark' ? 'bg-[#030708] dark' : 'bg-slate-50'}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Mobile-Only Centered Frame (S23 Ultra Optimized) */}
      <div className="w-full h-full lg:max-w-[420px] lg:h-[90vh] lg:max-h-[900px] relative z-10 flex flex-col group">
        {/* S23 Ultra Bezel Effect */}
        <div className="hidden lg:block absolute -inset-6 bg-gradient-to-br from-slate-800 to-black rounded-[4.5rem] -z-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/5" />
        
        {/* Notch Area (Top Speaker/Camera) */}
        <div className="hidden lg:flex absolute top-4 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/10 rounded-full z-50 overflow-hidden">
           <div className="w-4 h-full bg-white/20 animate-[marquee_5s_linear_infinite]" />
        </div>

        <div className={`flex-1 flex flex-col overflow-hidden border relative transition-colors duration-500 ${
          theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-slate-200'
        } lg:rounded-[3.5rem] lg:shadow-2xl`}>
          <AIBrain searching={loadingSuggestions} deploying={isDeploying} offline={isOffline} theme={theme} />
          <AppContent 
            theme={theme}
            setTheme={setTheme}
            isVaultOpen={isVaultOpen}
            setIsVaultOpen={setIsVaultOpen}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tracks={tracks}
            suggestions={suggestions}
            loadingSuggestions={loadingSuggestions}
            selectedTrack={selectedTrack}
            setSelectedTrack={setSelectedTrack}
            isDeploying={isDeploying}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            logs={logs}
            mixerValues={mixerValues}
            setMixerValues={setMixerValues}
            fetchSuggestions={fetchSuggestions}
            togglePlay={togglePlay}
            addTrack={addTrack}
            searchMode={searchMode}
            setSearchMode={setSearchMode}
            isOffline={isOffline}
            setIsOffline={setIsOffline}
            localTracks={localTracks}
            isGymMode={isGymMode}
            setIsGymMode={setIsGymMode}
            showScanner={showScanner}
            setShowScanner={setShowScanner}
            gymStats={gymStats}
            agentAvatars={agentAvatars}
            setSuggestions={setSuggestions}
            onGesture={handleGesture}
            onFileUpload={handleFileUpload}
            isMobile={true}
          />
        </div>
      </div>

      <AnimatePresence>
        {isVaultOpen && <Vault isOpen={isVaultOpen} onClose={() => setIsVaultOpen(false)} theme={theme} />}
      </AnimatePresence>
    </div>
  );
}

// Sub-component for the main app content to avoid repeating logic
function AppContent({ 
  theme,
  setTheme,
  isVaultOpen,
  setIsVaultOpen,
  activeTab, 
  setActiveTab, 
  tracks, 
  suggestions, 
  loadingSuggestions, 
  selectedTrack, 
  setSelectedTrack, 
  isDeploying, 
  searchQuery, 
  setSearchQuery, 
  logs, 
  mixerValues, 
  setMixerValues, 
  fetchSuggestions, 
  togglePlay, 
  addTrack,
  searchMode,
  setSearchMode,
  isOffline,
  setIsOffline,
  localTracks,
  isGymMode,
  setIsGymMode,
  showScanner,
  setShowScanner,
  gymStats,
  agentAvatars,
  setSuggestions,
  onGesture,
  onFileUpload,
  isMobile = false
}: any) {
  return (
    <div className={`flex flex-col h-full w-full bg-transparent selection:bg-jarvis-accent-cyan/30 relative ${isMobile ? 'overflow-x-hidden' : ''}`}>
      {/* Discovery Animation 2: Deployment Beam */}
      <AnimatePresence>
        {isDeploying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] pointer-events-none"
          >
            <motion.div 
              className="absolute top-1/2 left-1/4 w-[120vw] h-[2px] bg-gradient-to-r from-jarvis-accent-cyan to-transparent"
              initial={{ x: -1000, opacity: 0 }}
              animate={{ x: 0, opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
               <motion.div 
                 animate={{ scale: [1, 2, 1], opacity: [0.5, 1, 0.5] }}
                 transition={{ duration: 1, repeat: Infinity }}
                 className="w-40 h-40 rounded-full border-4 border-jarvis-accent-cyan/30 blur-xl"
               />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discovery Overlays */}
      <AnimatePresence>
        {showScanner && (
          <VisionScanner 
            onClose={() => setShowScanner(false)} 
            onScanResult={(res) => {
              fetchSuggestions(res);
              setShowScanner(false);
            }} 
            onGesture={onGesture}
          />
        )}
        {selectedTrack && (
          <TrackModal 
            track={selectedTrack} 
            onClose={() => setSelectedTrack(null)} 
            onAdd={addTrack} 
          />
        )}
        {isGymMode && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 inset-x-4 z-[60] flex justify-center pointer-events-none"
          >
            <div className="glass bg-black border border-emerald-500/30 rounded-3xl p-6 flex items-center gap-10 pointer-events-auto shadow-3xl backdrop-blur-3xl">
               <div className="flex flex-col items-center">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold tracking-widest">HEART RATE</span>
                  <div className="flex items-center gap-3">
                     <Activity className="w-6 h-6 text-red-500 animate-pulse" />
                     <span className="text-3xl font-display font-black text-white">{gymStats.hr}</span>
                  </div>
               </div>
               <div className="w-px h-12 bg-white/10" />
               <div className="flex flex-col items-center">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold tracking-widest">STEPS</span>
                  <span className="text-3xl font-display font-black text-white">{gymStats.steps.toLocaleString()}</span>
               </div>
               <button onClick={() => setIsGymMode(false)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white border border-white/10 active:scale-95 transition-all">
                 <X className="w-6 h-6" />
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header - Hidden on Mobile to save space */}
      {!isMobile && (
        <header className={`flex items-center justify-between px-6 py-4 border-b transition-colors z-50 ${
          theme === 'dark' ? 'border-jarvis-border bg-black/20 backdrop-blur-xl' : 'border-slate-200 bg-white/80'
        }`}>
          <div className="flex items-center gap-12">
            <Logo />

            <nav className="hidden md:flex items-center gap-2">
              {['RADIO', 'SIGNALS', 'CRATE', 'MIXER', 'AGENTS', 'BRAIN'].map(item => (
                <button
                  key={item}
                  onClick={() => setActiveTab(item)}
                  className={`px-3 py-1 text-[11px] font-mono font-bold tracking-widest transition-all rounded-md ${
                    activeTab === item 
                      ? theme === 'dark' ? 'bg-jarvis-accent-cyan/20 text-jarvis-accent-cyan border border-jarvis-accent-cyan/30' : 'bg-jarvis-accent-cyan/10 text-jarvis-accent-cyan border border-jarvis-accent-cyan/20'
                      : theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-lg border transition-all ${
                theme === 'dark' ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm'
              }`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className={`flex items-center px-3 py-1 rounded-full border transition-colors ${
              theme === 'dark' ? 'bg-black/40 border-jarvis-accent-pink/30' : 'bg-slate-50 border-jarvis-accent-pink/20 shadow-sm'
            }`}>
              <div className="flex gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-sm ${i < 4 ? 'bg-jarvis-accent-pink shadow-[0_0_5px_var(--color-jarvis-accent-pink)]' : theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`} />
                ))}
              </div>
              <span className="ml-3 text-[10px] font-mono font-bold text-jarvis-accent-pink tracking-widest leading-none">LV 4</span>
            </div>
            <div className="flex items-center gap-3">
              <Bell className={`w-5 h-5 cursor-pointer transition-colors ${theme === 'dark' ? 'text-slate-500 hover:text-jarvis-accent-cyan' : 'text-slate-400 hover:text-slate-600'}`} />
              <Settings 
                onClick={() => setIsVaultOpen(true)}
                className={`w-5 h-5 cursor-pointer transition-colors ${theme === 'dark' ? 'text-slate-500 hover:text-jarvis-accent-cyan' : 'text-slate-400 hover:text-slate-600'}`} 
              />
              <div className={`w-8 h-8 rounded-full border-2 overflow-hidden transition-colors ${
                theme === 'dark' ? 'border-jarvis-accent-cyan/50 bg-slate-800' : 'border-slate-200 bg-slate-100'
              }`}>
                  <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=Jarvis`} alt="Avatar" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>
        </header>
      )}

      {/* S23 Ultra Mobile Header */}
      {isMobile && (
        <header className={`flex items-center justify-between px-6 py-4 backdrop-blur-md z-50 border-b transition-colors ${
          theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-white/40 border-slate-200'
        }`}>
           <Logo className="scale-90 origin-left" />
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setIsVaultOpen(true)}
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                <Settings className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowScanner(true)} 
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                <Camera className="w-5 h-5" />
              </button>
              <div className={`w-10 h-10 rounded-full border overflow-hidden ring-2 ${
                theme === 'dark' ? 'border-jarvis-accent-cyan/20 ring-jarvis-accent-cyan/10' : 'border-slate-200 ring-slate-100'
              }`}>
                <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=Jarvis`} alt="User" />
              </div>
           </div>
        </header>
      )}

      {/* System Resource Bar */}
      <div className={`${isMobile ? 'flex-wrap py-2 overflow-x-hidden' : ''} flex items-center px-6 py-1 border-b transition-colors relative z-20 ${
        theme === 'dark' ? 'border-jarvis-border/30 bg-transparent' : 'border-slate-100 bg-slate-50/50'
      }`}>
        <StatItem icon="cpu" label="CPU" value="28%" subValue="- -" theme={theme}/>
        <StatItem icon="ram" label="RAM" value="12.4 GB" subValue="- -" theme={theme}/>
        <StatItem icon="vram" label="VRAM" value="6.2 GB" subValue="- -" theme={theme}/>
        <StatItem icon="pwr" label="SESS" value="1.2k tok" theme={theme}/>
        <StatItem icon="vram" label="TOTAL" value="84.5k tok" theme={theme}/>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">LOADED</span>
          <span className="text-[9px] font-mono text-emerald-500 uppercase font-bold">AI SERVER ONLINE</span>
        </div>
      </div>

      <main className="flex-1 flex overflow-hidden mb-10">
        {/* Left Sidebar - Stations */}
        <aside className={`${isMobile ? 'hidden' : 'hidden lg:flex'} w-52 border-r border-jarvis-border flex-col p-4 gap-4 bg-jarvis-card/30 glass overflow-y-auto custom-scrollbar`}>
          <div className="flex flex-col gap-3">
             <h3 className="text-[10px] font-display font-bold uppercase tracking-[0.2em] text-jarvis-accent-cyan flex justify-between">
               STATIONS <span>via Audius</span>
             </h3>
             <div className="grid grid-cols-2 gap-2">
                {STATIONS.map(station => (
                  <button 
                    key={station.id}
                    className={`flex flex-col items-start p-2 rounded-lg border transition-all hover:scale-105 active:scale-95 ${station.color}`}
                  >
                    <span className="text-[8px] font-mono font-bold opacity-70 mb-1">{station.sub.slice(0, 2)}</span>
                    <span className="text-[10px] font-bold leading-tight">{station.label}</span>
                  </button>
                ))}
             </div>
          </div>

          <div className="flex flex-col gap-4">
             <div className="p-3 glass rounded-xl bg-gradient-to-br from-jarvis-accent-cyan/5 to-transparent border-jarvis-accent-cyan/10">
                <div className="flex justify-center mb-4">
                  <JulesAgent planning={loadingSuggestions || isDeploying} />
                </div>
                <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-2">
                     <Bot className="w-4 h-4 text-jarvis-accent-cyan" />
                     <span className="text-[10px] font-display font-bold uppercase tracking-widest text-white">Discovery Agent</span>
                   </div>
                   <div className="flex gap-2">
                     <button 
                       onClick={() => setShowScanner(true)}
                       className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-slate-400 hover:text-jarvis-accent-cyan transition-colors"
                       title="Scan Room for Music Suggestions"
                     >
                        <Camera className="w-3 h-3" />
                     </button>
                     <button 
                       onClick={() => setIsGymMode(!isGymMode)}
                       className={`w-6 h-6 rounded flex items-center justify-center transition-all ${isGymMode ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-emerald-400'}`}
                       title="Toggle Gym Optimization Mode"
                     >
                        <Zap className="w-3 h-3" />
                     </button>
                     <button 
                       onClick={() => setIsOffline(!isOffline)}
                     className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold transition-all ${isOffline ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}
                   >
                     {isOffline ? 'EDGE NODE' : 'CLOUD'}
                   </button>
                </div>
             </div>
             <div className="flex gap-1 mb-2">
                  {['GLOBAL', 'LOCAL'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setSearchMode(mode as any)}
                      className={`flex-1 text-[8px] font-mono font-bold py-1 rounded border transition-all ${
                        searchMode === mode 
                          ? isOffline ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-jarvis-accent-cyan/20 border-jarvis-accent-cyan text-jarvis-accent-cyan' 
                          : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/50 border border-jarvis-border rounded-lg px-2 py-1.5 text-[10px] font-mono text-jarvis-accent-cyan focus:outline-none focus:border-jarvis-accent-cyan/60"
                  />
                  <Search className="absolute right-2 top-1.5 w-3 h-3 text-slate-500" />
                </div>
                <button 
                   onClick={() => fetchSuggestions(searchQuery)}
                   className="w-full mt-2 py-1.5 rounded-lg bg-jarvis-accent-cyan/20 border border-jarvis-accent-cyan/30 text-[10px] font-mono font-bold text-jarvis-accent-cyan hover:bg-jarvis-accent-cyan/30 transition-all uppercase tracking-widest"
                >
                  Find Matching
                </button>
             </div>
          </div>

          <div className="mt-auto pt-4 border-t border-jarvis-border flex flex-col gap-4">
             <div className="flex flex-col gap-2">
               <h3 className="text-[9px] font-display font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                 Local Music Library <span>{localTracks.length}</span>
               </h3>
               <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                  {localTracks.map((lt: any) => (
                    <div key={lt.id} className="p-2 rounded bg-slate-900/50 border border-jarvis-border/20 flex flex-col hover:border-jarvis-accent-cyan/30 cursor-pointer">
                      <span className="text-[10px] font-bold text-slate-300 truncate">{lt.title}</span>
                      <span className="text-[8px] font-mono text-slate-500 uppercase">IMPORTED FILE</span>
                    </div>
                  ))}
                  <label className="py-2 border border-dashed border-jarvis-border/50 rounded text-[9px] font-mono text-slate-600 hover:text-slate-400 hover:border-jarvis-border transition-all mt-1 cursor-pointer text-center block">
                    + IMPORT FILES
                    <input 
                      type="file" 
                      multiple 
                      className="hidden" 
                      onChange={(e) => onFileUpload(e.target.files)}
                    />
                  </label>
               </div>
             </div>

             <div className="flex flex-col gap-2">
               <h3 className="text-[9px] font-display font-bold text-slate-500 uppercase tracking-widest">Agent Activity</h3>
               <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {logs.slice(0, 10).map(log => (
                    <div key={log.id} className="flex flex-col gap-0.5 border-l border-jarvis-border pl-2 py-0.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        {agentAvatars[log.agent] && (
                          <img src={agentAvatars[log.agent]} className="w-3 h-3 rounded-full grayscale opacity-50" />
                        )}
                        <span className={`text-[8px] font-bold uppercase ${
                          log.type === 'success' ? 'text-emerald-400' : log.type === 'warn' ? 'text-amber-400' : 'text-jarvis-accent-cyan'
                        }`}>
                          {log.agent}
                        </span>
                      </div>
                      <span className="text-[7px] font-mono text-slate-600">{log.time}</span>
                    </div>
                      <p className="text-[9px] font-mono text-slate-400 leading-tight italic">{log.msg}</p>
                    </div>
                  ))}
               </div>
             </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className={`flex-1 flex flex-col overflow-y-auto custom-scrollbar ${isMobile ? 'p-4 gap-4' : 'p-6 gap-6'} pb-20`}>
          {activeTab === 'AGENTS' ? (
            <AgentShowcase />
          ) : activeTab === 'SIGNALS' ? (
            <SocialPickups onAdd={(track) => addTrack({ ...track, agentLabel: 'SOCIAL-BOT', genre: track.tags[0], confidence: 1 })} />
          ) : activeTab === 'CRATE' ? (
            <RecordPicker 
              suggestions={suggestions} 
              onAdd={(track, artist) => addTrack({ title: track, artist, agentLabel: 'CRATE-BOT', genre: 'Selected', confidence: 1, tags: [], id: Math.random().toString() })}
              isLoading={loadingSuggestions}
            />
          ) : activeTab === 'MIXER' && isMobile ? (
            <div className="flex flex-col gap-10 py-10">
               <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-mono font-black text-jarvis-accent-cyan tracking-[0.4em] uppercase drop-shadow-[0_0_8px_rgba(0,242,255,0.3)]">Neural Console</span>
                  <h2 className="text-white font-display text-2xl font-black tracking-tighter drop-shadow-md">MASTER MIXER</h2>
               </div>
               
               <div className="grid grid-cols-3 gap-6 px-4">
                  <MixerKnob label="GAIN" value={mixerValues.volume} />
                  <MixerKnob label="TEMPO" value={mixerValues.tempo} unit="BPM" />
                  <MixerKnob label="BASS" value={mixerValues.bass} color="pink" />
                  <MixerKnob label="MID" value={mixerValues.mid} />
                  <MixerKnob label="TREB" value={mixerValues.treble} />
               </div>

               <div className="flex flex-col gap-4 px-6 mt-6">
                  <div className="flex justify-between text-[10px] font-mono uppercase text-slate-500 font-bold tracking-widest leading-none">
                    <span>L-CH</span>
                    <span>CROSSFADER</span>
                    <span>R-CH</span>
                  </div>
                  <div className="relative h-12 flex items-center px-4 bg-white/5 rounded-2xl border border-white/10">
                     <div className="absolute inset-x-8 h-[2px] bg-white/10 rounded-full" />
                     <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={mixerValues.crossfader}
                        onChange={(e) => setMixerValues({...mixerValues, crossfader: parseInt(e.target.value)})}
                        className="w-full appearance-none bg-transparent cursor-pointer relative z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-14 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-lg [&::-webkit-slider-thumb]:shadow-[0_0_20px_white] transition-all"
                     />
                  </div>
               </div>

               <div className="px-6 flex flex-col gap-4">
                  <h3 className="text-xs font-mono font-black text-white/40 tracking-widest uppercase">Deck Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 rounded-2xl bg-jarvis-accent-cyan/10 border border-jarvis-accent-cyan/30">
                        <span className="text-[8px] font-mono font-black text-jarvis-accent-cyan block mb-1">DECK A</span>
                        <p className="text-white font-bold truncate text-xs">{tracks[0]?.title || 'EMPTY'}</p>
                     </div>
                     <div className="p-4 rounded-2xl bg-jarvis-accent-pink/10 border border-jarvis-accent-pink/30">
                        <span className="text-[8px] font-mono font-black text-jarvis-accent-pink block mb-1">DECK B</span>
                        <p className="text-white font-bold truncate text-xs">{tracks[1]?.title || 'EMPTY'}</p>
                     </div>
                  </div>
               </div>
            </div>
          ) : (
            <>
              <Turntable3D isPlaying={tracks.some((t: any) => t.isPlaying)} />

              {/* Top Mix Area */}
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-6 items-start`}>
             <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 glass bg-black/20 backdrop-blur-md p-6 rounded-2xl relative border-jarvis-accent-cyan/10">
                <div className="flex justify-between items-center mb-2">
                   <div className="flex items-center gap-2">
                     <LayoutGrid className="w-4 h-4 text-jarvis-accent-cyan" />
                     <span className="text-[10px] font-display font-bold uppercase tracking-widest text-slate-400">Master Mixer</span>
                   </div>
                   <div className="flex gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[9px] font-mono text-emerald-500 uppercase">Input A: Active</span>
                   </div>
                </div>
                
                <div className="flex justify-around items-end gap-2">
                   <MixerKnob label="VOL" value={mixerValues.volume} />
                   <MixerKnob label="BPM" value={mixerValues.tempo} unit="BPM" />
                   <MixerKnob label="BASS" value={mixerValues.bass} color="pink" />
                   <MixerKnob label="MID" value={mixerValues.mid} />
                   <MixerKnob label="TREB" value={mixerValues.treble} />
                   
                   <div className="hidden lg:flex flex-col items-center gap-2 ml-4">
                      <div className="flex flex-col gap-1 h-32 w-1 bg-slate-800/50 rounded-full relative">
                         <div className="absolute inset-x-0 bottom-0 bg-jarvis-accent-cyan rounded-full transition-all duration-300" style={{ height: '65%' }} />
                         <motion.div 
                           className="absolute left-1/2 -translate-x-1/2 w-4 h-2 bg-white rounded shadow-[0_0_10px_white]"
                           style={{ bottom: '65%' }}
                         />
                      </div>
                      <span className="text-[9px] font-mono uppercase opacity-50">Gain</span>
                   </div>
                </div>

                <div className="mt-8 flex flex-col gap-2">
                   <div className="flex justify-between text-[9px] font-mono uppercase opacity-50 px-2">
                     <span>Layer A</span>
                     <span>Crossfader</span>
                     <span>Layer B</span>
                   </div>
                   <div className="relative h-6 flex items-center px-2 group">
                      <div className="absolute inset-x-2 h-[2px] bg-slate-800 rounded-full" />
                      <div className="absolute left-[50%] top-0 bottom-0 w-[1px] bg-white/20" />
                      <input 
                         type="range" 
                         min="0" 
                         max="100" 
                         value={mixerValues.crossfader}
                         onChange={(e) => setMixerValues({...mixerValues, crossfader: parseInt(e.target.value)})}
                         className="absolute inset-x-0 w-full appearance-none bg-transparent cursor-pointer relative z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-10 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:shadow-[0_0_15px_white] transition-all"
                      />
                   </div>
                </div>
                
                <ControlDeck />
             </div>
          </div>

          <div className="flex flex-col gap-4 h-full">
                <div className="flex items-center justify-between">
                   <h2 className="text-sm font-display font-bold uppercase tracking-[0.2em] text-white">UP NEXT</h2>
                   <button className="text-[10px] font-mono text-jarvis-accent-cyan hover:underline flex items-center gap-1 uppercase tracking-tighter">
                     View All <ChevronRight className="w-3 h-3" />
                   </button>
                </div>
                <div className="flex flex-col gap-2">
                   {tracks.map(track => (
                     <TrackLayer 
                       key={track.id} 
                       title={track.id === '1' ? 'Layer A' : 'Layer B'} 
                       track={track}
                       onPlayToggle={() => togglePlay(track.id)}
                     />
                   ))}
                </div>
             </div>
          </div>

          {/* AI Workbench Area */}
          <div className="flex flex-col gap-4 mt-4">
             <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                   <TrendingUp className="w-4 h-4 text-jarvis-accent-pink" />
                   <h2 className="text-sm font-display font-bold uppercase tracking-[0.2em] text-white italic underline decoration-jarvis-accent-pink decoration-2 underline-offset-8">AI SUGGESTIONS</h2>
                </div>
                <div className="flex items-center gap-2 glass px-3 py-1 rounded-full border-jarvis-accent-cyan/20">
                   <Bot className="w-4 h-4 text-jarvis-accent-cyan" />
                   <span className="text-[10px] font-mono text-slate-400">Agent:</span>
                   <span className="text-[10px] font-mono font-bold text-jarvis-accent-cyan uppercase">Auto-Curator V.2</span>
                </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
                {/* Discovery Animation 1: Scanning Overlay */}
                <AnimatePresence>
                  {loadingSuggestions && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-10 glass rounded-2xl bg-jarvis-accent-cyan/5 border border-jarvis-accent-cyan/20 flex flex-col items-center justify-center pointer-events-none"
                    >
                      <motion.div 
                        animate={{ y: [-100, 400] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-full h-1 bg-gradient-to-r from-transparent via-jarvis-accent-cyan to-transparent shadow-[0_0_15px_var(--color-jarvis-accent-cyan)]"
                      />
                      <span className="text-[10px] font-display font-bold text-jarvis-accent-cyan uppercase tracking-widest mt-4">Scanning Deep Grid...</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="popLayout">
                  {loadingSuggestions ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-28 glass rounded-xl bg-slate-900/40 animate-pulse border-jarvis-border/5" />
                    ))
                  ) : (
                    suggestions.map((rec, i) => (
                      <motion.div
                        key={rec.title + i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ y: -5 }}
                        onClick={() => setSelectedTrack(rec)}
                        className="flex flex-col glass rounded-xl bg-black/20 backdrop-blur-md border-jarvis-border group relative overflow-hidden cursor-pointer h-full"
                      >
                        {/* Background Artwork */}
                        <div className="h-24 overflow-hidden relative">
                           {rec.imageUrl ? (
                             <img src={rec.imageUrl} alt={rec.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                           ) : (
                             <div className="w-full h-full bg-slate-900/50 flex items-center justify-center">
                                <Music className="w-6 h-6 text-slate-800 animate-pulse" />
                             </div>
                           )}
                           <div className="absolute inset-0 bg-gradient-to-t from-jarvis-card via-jarvis-card/20 to-transparent" />
                        </div>

                        <div className="p-3 pt-1">
                          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setSuggestions(prev => prev.map(s => s.id === rec.id ? { ...s, isLiked: !s.isLiked } : s));
                               }}
                               className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-lg ${rec.isLiked ? 'bg-red-500 text-white' : 'bg-slate-800 text-white hover:bg-red-500/20'}`}
                             >
                               <Heart className={`w-3.5 h-3.5 ${rec.isLiked ? 'fill-current' : ''}`} />
                             </button>
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 addTrack(rec);
                               }}
                               className="w-7 h-7 rounded-full bg-jarvis-accent-cyan flex items-center justify-center text-jarvis-bg hover:scale-110 active:scale-95 transition-all shadow-lg"
                             >
                               <Plus className="w-4 h-4 stroke-[3]" />
                             </button>
                          </div>
                          <div className="flex items-start justify-between mb-1">
                             <div className="flex items-center gap-1">
                                {agentAvatars[rec.agentLabel] ? (
                                  <img src={agentAvatars[rec.agentLabel]} className="w-3 h-3 rounded-full border border-jarvis-accent-pink/50" />
                                ) : (
                                  <div className="w-3 h-3 rounded-full bg-jarvis-accent-pink/20 animate-pulse" />
                                )}
                                <span className="text-[8px] font-mono text-jarvis-accent-pink font-bold bg-jarvis-accent-pink/10 px-1 py-0.5 rounded border border-jarvis-accent-pink/20 uppercase tracking-tighter italic">
                                  {rec.agentLabel}
                                </span>
                             </div>
                             <span className="text-[10px] font-mono text-slate-500">{Math.round(rec.confidence * 100)}%</span>
                          </div>
                          <h4 className="text-xs font-display font-bold text-white group-hover:text-jarvis-accent-cyan transition-colors truncate">
                            {rec.title}
                          </h4>
                          <p className="text-[9px] font-mono text-slate-400 mb-1 truncate">{rec.artist}</p>
                          <div className="flex flex-wrap gap-1">
                             {rec.tags?.slice(0, 2).map(tag => (
                               <span key={tag} className="text-[7px] font-mono text-slate-500 uppercase px-1 py-0.5 border border-slate-700/50 rounded">
                                 #{tag}
                               </span>
                             ))}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
             </div>
          </div>
        </>
      )}
    </section>

        {/* Right Rail - Quick Info (Optional) */}
        <aside className={`${isMobile ? 'hidden' : 'hidden xl:flex'} w-16 border-l border-jarvis-border flex-col items-center py-6 gap-8 glass bg-jarvis-card/20`}>
           <div className="flex flex-col items-center gap-1 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-jarvis-border flex items-center justify-center group-hover:border-jarvis-accent-cyan transition-colors">
                 <LayoutGrid className="w-5 h-5 text-slate-400 group-hover:text-jarvis-accent-cyan" />
              </div>
              <span className="text-[8px] font-display font-bold text-slate-500 uppercase">Grid</span>
           </div>
           <div className="flex flex-col items-center gap-1 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-jarvis-border flex items-center justify-center group-hover:border-jarvis-accent-cyan transition-colors">
                 <MessageSquare className="w-5 h-5 text-slate-400 group-hover:text-jarvis-accent-cyan" />
              </div>
              <span className="text-[8px] font-display font-bold text-slate-500 uppercase">Comm</span>
           </div>
           <div className="flex flex-col items-center gap-1 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-jarvis-border flex items-center justify-center group-hover:border-jarvis-accent-cyan transition-colors">
                 <Briefcase className="w-5 h-5 text-slate-400 group-hover:text-jarvis-accent-cyan" />
              </div>
              <span className="text-[8px] font-display font-bold text-slate-500 uppercase">Jobs</span>
           </div>
           <div className="flex flex-col items-center gap-1 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-jarvis-border flex items-center justify-center group-hover:border-jarvis-accent-cyan transition-colors">
                 <Globe className="w-5 h-5 text-slate-400 group-hover:text-jarvis-accent-cyan" />
              </div>
              <span className="text-[8px] font-display font-bold text-slate-500 uppercase">Net</span>
           </div>
           <div className="flex flex-col items-center gap-1 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-jarvis-border flex items-center justify-center group-hover:border-jarvis-accent-cyan transition-colors">
                 <Building2 className="w-5 h-5 text-slate-400 group-hover:text-jarvis-accent-cyan" />
              </div>
              <span className="text-[8px] font-display font-bold text-slate-500 uppercase">Meta</span>
           </div>

           <div className="mt-auto flex flex-col items-center gap-2">
              <div className="flex flex-col gap-0.5">
                 {Array.from({ length: 8 }).map((_, i) => (
                   <div key={i} className={`w-1 h-3 rounded-full ${i > 4 ? 'bg-jarvis-accent-cyan/20' : 'bg-jarvis-accent-cyan shadow-[0_0_5px_var(--color-jarvis-accent-cyan)]'}`} />
                 ))}
              </div>
              <span className="rotate-90 text-[8px] font-mono text-jarvis-accent-cyan uppercase tracking-widest mt-4">System OK</span>
           </div>
        </aside>
      </main>

      {/* Floating Status Bar / Notification Area at bottom */}
      <footer className={`${isMobile ? 'h-auto py-3 px-4 flex-col text-center gap-2' : 'h-10 px-6'} fixed bottom-0 inset-x-0 glass border-t border-jarvis-border flex items-center justify-between z-[60] bg-jarvis-bg/80`}>
        <div className={`flex items-center ${isMobile ? 'flex-col gap-2' : 'gap-4'}`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-emerald-500' : 'bg-emerald-500'}`} />
            <span className={`text-[10px] font-mono uppercase font-bold ${isOffline ? 'text-emerald-500' : 'text-emerald-500'}`}>
              {isOffline ? 'Edge Node Sync: Stable' : 'Terminal Sync: Active'}
            </span>
          </div>
          <span className={`${isMobile ? 'border-none pl-0' : 'border-l border-white/10 pl-4'} text-[10px] font-mono text-slate-500 uppercase`}>
            {isOffline ? 'Local Processing Mode' : 'Connected to Global Grid'}
          </span>
          {!isMobile && <span className={`text-[10px] font-mono ${isOffline ? 'text-emerald-400' : 'text-jarvis-accent-pink'} border-l border-white/10 pl-4 uppercase`}>
            {isOffline ? 'Secure Edge Encryption' : '4 Critical Agents Active'}
          </span>}
        </div>
        
        <div className={`flex items-center ${isMobile ? 'gap-4 mt-1' : 'gap-4'}`}>
          <div className="text-[10px] font-mono flex items-center gap-2">
            <span className="text-slate-500 font-bold">LAT:</span>
            <span className="text-jarvis-accent-cyan">0.24ms</span>
          </div>
          <div className="text-[10px] font-mono flex items-center gap-2">
            <span className="text-slate-500 font-bold">BUFFER:</span>
            <span className="text-jarvis-accent-cyan">STABLE</span>
          </div>
          <div className="text-[10px] font-mono text-white opacity-50 ml-4 group cursor-pointer hover:opacity-100 transition-opacity">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </footer>

      {/* S23 Ultra Foot Navigation */}
      {isMobile && (
        <footer className={`fixed bottom-0 inset-x-0 h-20 border-t flex items-center justify-around px-4 pb-2 z-[100] transition-colors duration-500 ${
          theme === 'dark' ? 'bg-black/80 backdrop-blur-3xl border-white/5' : 'bg-white/90 backdrop-blur-3xl border-slate-200'
        }`}>
           {[
             { id: 'RADIO', icon: Music, label: 'RADIO' },
             { id: 'SIGNALS', icon: TrendingUp, label: 'SIGNALS' },
             { id: 'CRATE', icon: Disc, label: 'CRATE' },
             { id: 'AGENTS', icon: Bot, label: 'AGENTS' }
           ].map((item: any) => (
             <button 
               key={item.id}
               onClick={() => setActiveTab(item.id)}
               className={`flex flex-col items-center gap-1.5 transition-all duration-300 w-16 ${
                 activeTab === item.id ? 'text-jarvis-accent-cyan scale-110' : theme === 'dark' ? 'text-slate-600' : 'text-slate-400'
               }`}
             >
                <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'drop-shadow-[0_0_10px_rgba(0,242,255,0.5)]' : ''}`} />
                <span className={`text-[8px] font-mono font-black tracking-[0.2em] uppercase ${activeTab === item.id ? 'opacity-100' : 'opacity-40'}`}>
                  {item.label}
                </span>
             </button>
           ))}
        </footer>
      )}
    </div>
  );
}
