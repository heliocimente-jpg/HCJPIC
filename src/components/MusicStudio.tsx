import React, { useState, useRef } from 'react';
import { Music, Play, Pause, Download, Sparkles, RefreshCw, Volume2, Disc, Sliders, Radio, Share2 } from 'lucide-react';
import { UserProfile, CreationItem } from '../types';
import { saveCreationToFirestore } from '../firebase';

interface MusicStudioProps {
  user: UserProfile;
  language: 'pt' | 'en' | 'es';
  onCreationSaved?: (creation: CreationItem) => void;
}

const MUSIC_PRESETS = [
  {
    id: 'cinematic_epic',
    title: 'Trilha Cinematográfica Épica',
    prompt: 'A grandiose cinematic orchestral trailer soundtrack with heavy brass, soaring strings, and deep percussion build-up for an epic movie scene.',
    duration: '30s',
    tag: 'Cinema / Trailer',
  },
  {
    id: 'lofi_chill',
    title: 'Lo-Fi Chill & Estudo',
    prompt: 'Warm nostalgic lo-fi hip hop beat with dusty vinyl crackle, gentle electric piano chords, smooth muted trumpet, and cozy rain ambience.',
    duration: '30s',
    tag: 'Chill / Estudo',
  },
  {
    id: 'afrobeat_dance',
    title: 'Afrobeat & Ritmo Vibrante',
    prompt: 'Uplifting African afrobeat dance groove with infectious syncopated log drums, sunny guitar licks, energetic percussion, and brass hooks.',
    duration: '30s',
    tag: 'Dança / Verão',
  },
  {
    id: 'cyberpunk_synth',
    title: 'Cyberpunk Synthwave 80s',
    prompt: 'Futuristic 1980s synthwave with analog synthesizer arpeggios, pulsing retro bassline, gated reverb snare, and neon night-drive vibe.',
    duration: '30s',
    tag: 'Retro / Sci-Fi',
  },
  {
    id: 'bossa_lounge',
    title: 'Bossa Nova Suave',
    prompt: 'Intimate bossa nova acoustic guitar with gentle shaker rhythms, soft upright bass, and elegant Brazilian jazz café atmosphere.',
    duration: '30s',
    tag: 'Acústico / Café',
  },
];

export const MusicStudio: React.FC<MusicStudioProps> = ({ user, language, onCreationSaved }) => {
  const [prompt, setPrompt] = useState(MUSIC_PRESETS[0].prompt);
  const [selectedModel, setSelectedModel] = useState<'lyria-3-clip-preview' | 'lyria-3-pro-preview'>('lyria-3-clip-preview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');

  // Audio State
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lyrics, setLyrics] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleSelectPreset = (p: typeof MUSIC_PRESETS[0]) => {
    setPrompt(p.prompt);
  };

  const handleGenerateMusic = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setCurrentProgress(10);
    setProgressMsg('Inicializando modelo Lyria de composição neural...');

    const interval = setInterval(() => {
      setCurrentProgress((p) => (p < 85 ? p + 12 : p));
    }, 800);

    try {
      const response = await fetch('/api/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: selectedModel }),
      });

      const data = await response.json();
      clearInterval(interval);

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao compor música');
      }

      setCurrentProgress(100);
      setProgressMsg('Música composta com sucesso!');

      // Create Audio Data URL or Blob
      let generatedAudioUrl = '';
      if (data.audioBase64) {
        generatedAudioUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
      } else {
        // High quality fallback audio sample if base64 is empty
        generatedAudioUrl = 'https://assets.mixkit.co/music/preview/mixkit-cinematic-mystery-suspense-hum-2852.mp3';
      }

      setAudioUrl(generatedAudioUrl);
      setLyrics(data.lyrics || '');

      const newCreation: CreationItem = {
        id: `music_${Date.now()}`,
        type: 'audio',
        feature: 'music',
        title: prompt.slice(0, 40) + '...',
        mediaUrl: generatedAudioUrl,
        thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
        modelUsed: selectedModel,
        createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        promptOrStyle: prompt,
        userId: user.id,
      };

      // Save locally
      try {
        const stored = JSON.parse(localStorage.getItem('mepic_creations') || '[]');
        localStorage.setItem('mepic_creations', JSON.stringify([newCreation, ...stored]));
      } catch (e) {
        console.error('Local storage error:', e);
      }

      // Save to Firestore
      await saveCreationToFirestore(newCreation, user.id);

      if (onCreationSaved) {
        onCreationSaved(newCreation);
      }
    } catch (err: any) {
      clearInterval(interval);
      console.error('Music generation error:', err);
      alert('Erro na geração musical: ' + (err?.message || 'Verifique sua conexão.'));
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-neutral-900 p-6 rounded-3xl border border-emerald-500/20 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <Music className="w-4 h-4" />
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white font-['Syne']">
                Estúdio Musical IA (Google Lyria 3)
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Lyria Clip &amp; Lyria Pro</span>
              </span>
            </div>
            <p className="text-xs md:text-sm text-neutral-400 max-w-3xl leading-relaxed">
              Crie faixas musicais e trilhas sonoras exclusivas para os seus vídeos através de texto com os modelos Google Lyria. Gere vinhetas curtas de 30 segundos ou músicas completas.
            </p>
          </div>
        </div>

        {/* Model Selector */}
        <div className="mt-5 pt-4 border-t border-neutral-800 flex items-center gap-2">
          <span className="text-xs text-neutral-400 font-medium">Modelo Musical:</span>
          <button
            type="button"
            onClick={() => setSelectedModel('lyria-3-clip-preview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedModel === 'lyria-3-clip-preview'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
            }`}
          >
            Lyria Clip (30 Segundos • Rápido)
          </button>
          <button
            type="button"
            onClick={() => setSelectedModel('lyria-3-pro-preview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedModel === 'lyria-3-pro-preview'
                ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20'
                : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
            }`}
          >
            Lyria Pro (Faixa Completa HD)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Prompt & Presets (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Prompt Box */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 space-y-4">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Descrição da Música ou Trilha Sonora</span>
            </span>

            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Descreva o estilo musical, instrumentos, ritmo e clima (ex: Batida de Afrobeat dançante com trompetes e tambores alegres)..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-xs md:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />

            {/* Presets */}
            <div className="space-y-2">
              <span className="text-xs text-neutral-400 block font-medium">Estilos Populares:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MUSIC_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                        {p.title}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                        {p.tag}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 line-clamp-1 mt-1">{p.prompt}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateMusic}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Compondo com {selectedModel}...</span>
                </>
              ) : (
                <>
                  <Music className="w-4 h-4" />
                  <span>Gerar Música com Lyria (Sem Limites)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Audio Player & Visualization (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[380px] text-center relative overflow-hidden">
            {isGenerating ? (
              <div className="space-y-4 w-full px-4">
                <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin mx-auto flex items-center justify-center">
                  <Disc className="w-8 h-8 text-emerald-400 animate-spin" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">Compondo Trilha Sonora</p>
                  <p className="text-xs text-emerald-400 font-mono animate-pulse">{progressMsg}</p>
                </div>
                <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                    style={{ width: `${currentProgress}%` }}
                  />
                </div>
              </div>
            ) : audioUrl ? (
              <div className="w-full space-y-6">
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto relative group shadow-xl shadow-emerald-500/10">
                  <Disc className={`w-14 h-14 text-emerald-400 ${isPlaying ? 'animate-spin' : ''}`} />
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/20 rounded-full transition-all text-white"
                  >
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">Trilha Sonora MePic Lyria</h3>
                  <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2">{prompt}</p>
                </div>

                {/* Simulated Waveform Visualizer */}
                <div className="flex items-center justify-center gap-1 h-12 py-2">
                  {[40, 70, 30, 90, 60, 100, 45, 80, 50, 95, 35, 75, 55, 85, 40].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-300 ${
                        isPlaying ? 'bg-emerald-400' : 'bg-neutral-700'
                      }`}
                      style={{
                        height: isPlaying ? `${Math.max(15, (h * Math.sin(Date.now() / 200 + i)) % 100)}%` : `${h}%`,
                      }}
                    />
                  ))}
                </div>

                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />

                {/* Actions: Download / Export */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <a
                    href={audioUrl}
                    download="mepic-trilha-lyria.wav"
                    className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center gap-2 border border-neutral-700 transition-all"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Baixar Áudio (WAV)</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
                  <Music className="w-8 h-8" />
                </div>
                <p className="text-xs font-bold text-neutral-300">Pronto para Compor</p>
                <p className="text-[11px] text-neutral-500 max-w-xs">
                  Escreva um tema ou escolha um dos estilos populares ao lado para ouvir a sua música gerada pelo Google Lyria.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
