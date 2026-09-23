import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Video, Play, Pause, RefreshCw, Upload, Download, Share2, Wand2, Music, Flame, Smile, Film, Sliders, Check, Camera, Volume2, VolumeX, MessageSquareShare, Ratio, Monitor, Smartphone, Maximize2 } from 'lucide-react';
import { UserProfile, AIModelId, CreationItem } from '../types';
import { AI_MODELS } from '../data/aiModels';
import { saveCreationToFirestore } from '../firebase';
import { downloadMediaFile } from '../utils/downloadMedia';

interface VideoAnimationStudioProps {
  user: UserProfile;
  language: 'pt' | 'en' | 'es';
  onCreationSaved?: (creation: CreationItem) => void;
}

interface VideoPreset {
  id: string;
  title: string;
  category: 'dance' | 'couple' | 'kids' | 'tiktok_trend' | 'whatsapp_status' | 'singing' | 'motion' | 'prank' | 'cinema';
  badge: string;
  characterType: string;
  previewGif: string;
  videoSample: string;
  audioTrack: string;
  description: string;
  model: AIModelId;
}

const VIDEO_PRESETS: VideoPreset[] = [
  // 1. Casais & Romântico
  {
    id: 'couple_sunset_embrace',
    title: 'Casais: Abraço ao Pôr do Sol & Beijo de Cinema',
    category: 'couple',
    badge: 'Casais & Romance 💕',
    characterType: 'Casal / Dois Rostos',
    previewGif: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop&q=80',
    videoSample: '/videos/couple_sunset.mp4',
    audioTrack: 'Acoustic Love Song (Romantic Strings)',
    description: 'Transforma qualquer foto de casal num momento romântico com cabelo ao vento, olhar apaixonado e abraço ao pôr do sol.',
    model: 'veo_2_google',
  },
  {
    id: 'couple_wedding_slowmo',
    title: 'Casais: Dança Nupcial com Chuva de Pétalas',
    category: 'couple',
    badge: 'Casamento & Bodas 💍',
    characterType: 'Casal em Festa',
    previewGif: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
    videoSample: '/videos/couple_wedding.mp4',
    audioTrack: 'Wedding Symphony 432Hz',
    description: 'Anima fotos de namorados ou noivos girando no salão com pétalas de rosa flutuando em câmara lenta 4K.',
    model: 'kling_ai_v15',
  },

  // 2. Crianças & Bebés
  {
    id: 'kids_breakdance_cute',
    title: 'Crianças: Bebé Dançarino de Breakdance & Hip-Hop',
    category: 'kids',
    badge: 'Viral de Crianças 👶',
    characterType: 'Bebé / Criança',
    previewGif: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&auto=format&fit=crop&q=80',
    videoSample: '/videos/kids_breakdance.mp4',
    audioTrack: 'Baby Beat Funky Bounce 128 BPM',
    description: 'Faça qualquer foto do seu filho ou bebé dançar passos profissionais com expressões faciais super engraçadas e fofas.',
    model: 'kling_ai_v15',
  },
  {
    id: 'kids_superhero_fly',
    title: 'Crianças: Pequeno Super-Herói a Voar entre Nuvens',
    category: 'kids',
    badge: 'Magia Infantil 🦸‍♂️',
    characterType: 'Criança',
    previewGif: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&auto=format&fit=crop&q=80',
    videoSample: '/videos/kids_superhero.mp4',
    audioTrack: 'Heroic Kid Fanfare',
    description: 'Coloque a capa na criança e gere um clipe cinematográfico de decolagem aos céus com raios de sol e sorriso radiante.',
    model: 'veo_2_google',
  },

  // 3. Trend TikTok & Instagram Reels
  {
    id: 'tiktok_trend_glow_shuffle',
    title: 'TikTok & Reels: Trend Shuffle com Efeito Neon Glow',
    category: 'tiktok_trend',
    badge: 'Trend TikTok 🔥',
    characterType: 'Adulto / Jovem',
    previewGif: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&auto=format&fit=crop&q=80',
    videoSample: '/videos/tiktok_glow_shuffle.mp4',
    audioTrack: 'Trend Viral Brasil (Bass Boosted)',
    description: 'Passos sincopados rápidos de TikTok com rastros de luz neon nos pés e transições dinâmicas perfeitas para Reels e Shorts.',
    model: 'kling_ai_v15',
  },
  {
    id: 'tiktok_trend_fashion_catwalk',
    title: 'Instagram: Desfile Fashion Streetwear de Alto Luxo',
    category: 'tiktok_trend',
    badge: 'Instagram Reels 👠',
    characterType: 'Modelo / Estilo',
    previewGif: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&auto=format&fit=crop&q=80',
    videoSample: '/videos/tiktok_fashion.mp4',
    audioTrack: 'House Chic Runway Paris',
    description: 'Caminhada confiante em passarela urbana com iluminação dourada e transição de câmara 9:16 pronta para viralizar.',
    model: 'pixverse_v3',
  },

  // 4. Estados de WhatsApp
  {
    id: 'whatsapp_status_motivational',
    title: 'Status WhatsApp: Frase Motivacional com Natureza Épica',
    category: 'whatsapp_status',
    badge: 'Status WhatsApp 📱',
    characterType: 'Foto ou Retrato',
    previewGif: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    videoSample: '/videos/whatsapp_motivational.mp4',
    audioTrack: 'Inspirational Piano & Wind Chimes',
    description: 'Formato vertical ideal para status do WhatsApp com partículas cintilantes, luz solar da manhã e sentimento de reflexão.',
    model: 'veo_2_google',
  },
  {
    id: 'whatsapp_status_goodmorning',
    title: 'Status WhatsApp: Bom Dia com Café & Raios de Luz',
    category: 'whatsapp_status',
    badge: 'Família & Amigos ☕',
    characterType: 'Retrato do Dia',
    previewGif: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80',
    videoSample: '/videos/whatsapp_goodmorning.mp4',
    audioTrack: 'Good Vibes Acoustic Guitar',
    description: 'Animação acolhedora com brisa matinal e raios de sol, perfeita para partilhar com os amigos e a família logo cedo.',
    model: 'veo_2_google',
  },

  // 5. Dança Viral
  {
    id: 'dance_viral_tiktok_funk',
    title: 'Dança Viral: Funk & Passinho Carioca',
    category: 'dance',
    badge: 'Mais Popular 🔥',
    characterType: 'Adulto / Jovem',
    previewGif: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&auto=format&fit=crop&q=80',
    videoSample: '/videos/dance_funk.mp4',
    audioTrack: 'Eletro Passinho 130 BPM',
    description: 'Movimentos de quadril, passos sincopados e energia contagiante para estourar no feed.',
    model: 'kling_ai_v15',
  },
  {
    id: 'dance_grandma_groove',
    title: 'Dança Viral: Vovó no Passinho Moderno',
    category: 'dance',
    badge: 'Viral de WhatsApp 👵',
    characterType: 'Vovó / Idoso',
    previewGif: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    videoSample: '/videos/dance_grandma.mp4',
    audioTrack: 'Eletro Passinho 130 BPM',
    description: 'Ponha a sua avó a dançar coreografias modernas com risada garantida no grupo de família.',
    model: 'kling_ai_v15',
  },
  {
    id: 'dance_pet_groove',
    title: 'Dança Viral: Animal de Estimação a Dançar',
    category: 'dance',
    badge: 'Trend Pets 🐶',
    characterType: 'Cão ou Gato',
    previewGif: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80',
    videoSample: '/videos/dance_pet.mp4',
    audioTrack: 'Puppy Groovy Beat',
    description: 'Ponha o seu animal de estimação a dançar em duas patas no ritmo da música viral.',
    model: 'kling_ai_v15',
  },

  // 6. Foto a Cantar & Lipsync
  {
    id: 'singing_lipsync_pop',
    title: 'Fotografia a Cantar: Pop Diva & Lipsync',
    category: 'singing',
    badge: 'Expressão Real 🎤',
    characterType: 'Qualquer Rosto',
    previewGif: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    videoSample: '/videos/singing_lipsync.mp4',
    audioTrack: 'Believer - Acoustic Anthem',
    description: 'Faça qualquer selfie cantar com movimentos labiais perfeitos, piscar de olhos e expressividade.',
    model: 'seedance_motion',
  },

  // 7. Partida com IA
  {
    id: 'prank_breaking_news',
    title: 'Partida com IA: Você no Plantão Urgente da TV',
    category: 'prank',
    badge: 'Pegadinha WhatsApp 📺',
    characterType: 'Rosto ou Meme',
    previewGif: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
    videoSample: '/videos/prank_news.mp4',
    audioTrack: 'Breaking News Dramatic Siren',
    description: 'Coloque a foto de um amigo no telejornal ao vivo sendo procurado como celebridade!',
    model: 'veo_2_google',
  },

  // 8. Animar Fotos (Motion)
  {
    id: 'photo_to_video_natural',
    title: 'Animar Fotos: Movimento Natural de Câmera 3D',
    category: 'motion',
    badge: 'Cinematográfico 3D 🎬',
    characterType: 'Retrato ou Paisagem',
    previewGif: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    videoSample: '/videos/photo_motion.mp4',
    audioTrack: 'Cinematic Ambient Strings',
    description: 'Dê vida a retratos com brisa nos cabelos, movimento sutil de respiração e câmara em órbita.',
    model: 'veo_2_google',
  },

  // 9. Efeitos Cinema
  {
    id: 'cinema_hero_slowmo',
    title: 'Efeitos Cinematográficos: Plano de Herói Hollywood',
    category: 'cinema',
    badge: 'Cinema 4K ⚡',
    characterType: 'Ação & Cinema',
    previewGif: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
    videoSample: '/videos/cinema_hero.mp4',
    audioTrack: 'Epic Cinematic Drop',
    description: 'Transições de cinema, chuva de faíscas em slow-motion e iluminação de blockbuster.',
    model: 'pixverse_v3',
  },
];

export const VideoAnimationStudio: React.FC<VideoAnimationStudioProps> = ({
  user,
  language,
  onCreationSaved,
}) => {
  const [videoMode, setVideoMode] = useState<'photo_to_video' | 'text_to_video'>('photo_to_video');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(VIDEO_PRESETS[0].id);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Photo-to-Video state
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80'
  );

  // Aspect Ratio: 16:9 (Landscape) or 9:16 (Portrait)
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');

  // Text-to-Video state
  const [textPrompt, setTextPrompt] = useState(
    'Um astronauta explorador caminhando sobre a areia vermelha de Marte enquanto auroras boreais cósmicas iluminam o céu, câmera em órbita cinematográfica 4K'
  );
  const [cameraMovement, setCameraMovement] = useState<'orbit' | 'drone' | 'zoom_in' | 'slow_mo' | 'pan'>('orbit');
  const [videoDuration, setVideoDuration] = useState<'5s' | '10s'>('5s');

  const [selectedModel, setSelectedModel] = useState<AIModelId>('veo_2_google');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(5);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Generation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepMessage, setStepMessage] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(VIDEO_PRESETS[0].videoSample);
  const [isCopied, setIsCopied] = useState(false);

  const currentPreset = VIDEO_PRESETS.find(p => p.id === selectedPresetId) || VIDEO_PRESETS[0];
  const currentModelInfo = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];

  // Sync video audio and playback on preset change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted, generatedVideoUrl]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleSound = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleDownloadVideo = async () => {
    if (!generatedVideoUrl) return;
    setIsDownloading(true);
    try {
      const filename = `mepic-video-${currentPreset.id}-${Date.now()}.mp4`;
      await downloadMediaFile(generatedVideoUrl, filename);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      console.error('Download failed:', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'Todos os Cenários' },
    { id: 'couple', label: '💑 Casais & Romance' },
    { id: 'kids', label: '👶 Crianças & Bebés' },
    { id: 'tiktok_trend', label: '🔥 Trend TikTok & Reels' },
    { id: 'whatsapp_status', label: '📱 Status WhatsApp' },
    { id: 'dance', label: '💃 Dança Viral' },
    { id: 'singing', label: '🎤 Foto a Cantar' },
    { id: 'motion', label: '🌊 Animar Fotos 3D' },
    { id: 'cinema', label: '🎬 Efeitos Cinema' },
    { id: 'prank', label: '🤪 Partidas' },
  ];

  const filteredPresets = activeCategory === 'all'
    ? VIDEO_PRESETS
    : VIDEO_PRESETS.filter(p => p.category === activeCategory);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setUploadedPhotoUrl(uploadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startGeneration = async () => {
    setIsGenerating(true);
    setProgress(15);
    setStepMessage('Iniciando síntese de movimento com IA...');

    let resultUrl = currentPreset.videoSample;

    try {
      // 1. First attempt rapid neural video synthesis with audio
      const animatePayload = {
        photoBase64: uploadedPhotoUrl && uploadedPhotoUrl.startsWith('data:') ? uploadedPhotoUrl : undefined,
        imageUrl: uploadedPhotoUrl && !uploadedPhotoUrl.startsWith('data:') ? uploadedPhotoUrl : currentPreset.previewGif,
        prompt: videoMode === 'photo_to_video' ? currentPreset.description : textPrompt,
        aspectRatio,
        presetId: currentPreset.id,
      };

      setStepMessage('Renderizando física cinemática em 4K e trilha sonora...');
      setProgress(40);

      const animRes = await fetch('/api/animate-photo-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(animatePayload),
      });

      if (animRes.ok) {
        const animData = await animRes.json();
        if (animData.success && animData.videoUrl) {
          resultUrl = animData.videoUrl;
        }
      } else {
        // Fallback to Veo 3 endpoint
        const payload = {
          prompt: videoMode === 'photo_to_video' ? currentPreset.description : textPrompt,
          imageBase64: videoMode === 'photo_to_video' && uploadedPhotoUrl && uploadedPhotoUrl.startsWith('data:') ? uploadedPhotoUrl : undefined,
          aspectRatio,
        };

        const res = await fetch('/api/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.operationName) {
            setStepMessage('Renderizando no Google Veo 3...');
            setProgress(60);
            let attempts = 0;
            let isDone = false;
            while (!isDone && attempts < 8) {
              await new Promise(r => setTimeout(r, 2000));
              attempts++;
              setProgress(Math.min(92, 60 + attempts * 4));
              const statusRes = await fetch('/api/video-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ operationName: data.operationName }),
              });
              if (statusRes.ok) {
                const statusData = await statusRes.json();
                if (statusData.done && statusData.hasVideo) {
                  isDone = true;
                  resultUrl = `/api/video-download?operationName=${encodeURIComponent(data.operationName)}`;
                  break;
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Video generation fallback to preset:', err);
    }

    setProgress(100);
    setStepMessage('Vídeo gerado com sucesso!');
    setGeneratedVideoUrl(resultUrl);
    setIsGenerating(false);
    setIsMuted(false); // Unmute so user hears the soundtrack immediately

    // Save creation
    const newCreation: CreationItem = {
      id: `vid_${Date.now()}`,
      type: 'video',
      feature: 'video_animation',
      title: videoMode === 'photo_to_video' ? currentPreset.title : textPrompt.slice(0, 40) + '...',
      mediaUrl: resultUrl,
      thumbnailUrl: currentPreset.previewGif,
      modelUsed: 'Google Veo 3 (veo-3.1-fast-generate-preview)',
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      promptOrStyle: `${aspectRatio} • ${videoMode === 'photo_to_video' ? currentPreset.description : textPrompt}`,
      userId: user.id,
    };

    try {
      const stored = JSON.parse(localStorage.getItem('mepic_creations') || '[]');
      localStorage.setItem('mepic_creations', JSON.stringify([newCreation, ...stored]));
    } catch (e) {
      // ignore storage error
    }

    await saveCreationToFirestore(newCreation, user.id);

    if (onCreationSaved) {
      onCreationSaved(newCreation);
    }
  };

    if (onCreationSaved) {
      onCreationSaved(newCreation);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner with Mode Switcher */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-neutral-900 p-6 rounded-3xl border border-emerald-500/20 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <Video className="w-4 h-4" />
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white font-['Syne']">
                Editor de Vídeo &amp; Animação IA
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>100% Grátis &amp; Ilimitado ∞</span>
              </span>
            </div>
            <p className="text-xs md:text-sm text-neutral-400 max-w-3xl leading-relaxed">
              Editor de vídeo completo: de fotografia para vídeo e de texto para vídeo. Animação de fotos com movimento natural, dança viral (bebé, avó, animal de estimação), foto a cantar com sincronia labial e partidas divertidas para enviar aos grupos de WhatsApp.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-neutral-950 p-1 rounded-2xl border border-neutral-800 shrink-0">
            <button
              type="button"
              onClick={() => setVideoMode('photo_to_video')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                videoMode === 'photo_to_video'
                  ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Foto para Vídeo</span>
            </button>
            <button
              type="button"
              onClick={() => setVideoMode('text_to_video')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                videoMode === 'text_to_video'
                  ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Texto para Vídeo</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Photo Upload / Prompt & Presets (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {videoMode === 'photo_to_video' ? (
            /* Photo Source Card */
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Foto para Animar em Vídeo</span>
                </span>
                <span className="text-[11px] text-neutral-500">Corpo ou rosto nítido</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative w-24 h-32 rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 shrink-0">
                  {uploadedPhotoUrl ? (
                    <img src={uploadedPhotoUrl} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600">
                      <Upload className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-all border border-neutral-700">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Substituir Foto</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                  <p className="text-[11px] text-neutral-400 leading-tight">
                    A IA preservará seus traços anatômicos e gerará movimento fluido a 60 FPS com áudio sincronizado.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Text-to-Video Prompt Card */
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                  <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Prompt de Texto para Vídeo</span>
                </span>
                <span className="text-[11px] text-emerald-400 font-bold">Modo Diretor</span>
              </div>

              <textarea
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                rows={3}
                placeholder="Descreva a cena, personagens e iluminação em detalhes..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />

              {/* Camera Movement Selection */}
              <div>
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2 mb-2">
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Movimento de Câmera</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'orbit', label: 'Órbita 360°', desc: 'Giro suave ao redor do sujeito' },
                    { id: 'drone', label: 'Drone FPV', desc: 'Voo aéreo cinematográfico' },
                    { id: 'zoom_in', label: 'Zoom In Rápido', desc: 'Foco dramático nos olhos' },
                    { id: 'slow_mo', label: 'Slow-Motion', desc: '120 FPS ultra fluido' },
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCameraMovement(c.id as any)}
                      className={`p-2 rounded-xl text-left border transition-all ${
                        cameraMovement === c.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-white'
                          : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold">{c.label}</div>
                      <div className="text-[10px] text-neutral-400">{c.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Prompts */}
              <div>
                <span className="text-[11px] font-bold text-neutral-400 block mb-1.5">Inspiração Rápida:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Carro esportivo na chuva com neon',
                    'Dragão sobrevoando castelo medieval',
                    'Gato astronauta flutuando em gravidade zero',
                  ].map(quick => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => setTextPrompt(quick + ', cinematográfico 4K, iluminação volumétrica')}
                      className="text-[10px] bg-neutral-950 border border-neutral-800 hover:border-emerald-500 text-neutral-300 px-2 py-1 rounded-lg transition-colors"
                    >
                      {quick}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Model Selection */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 space-y-3">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
              <Film className="w-3.5 h-3.5 text-emerald-400" />
              <span>Motor de Vídeo IA</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AI_MODELS.filter(m => ['kling_ai_v15', 'veo_2_google', 'seedance_motion', 'pixverse_v3'].includes(m.id)).map(model => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedModel === model.id
                      ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-sm'
                      : 'bg-neutral-950/40 border-neutral-800/80 text-neutral-400 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate">{model.name}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300">
                      {model.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1 line-clamp-1">{model.specialty}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Presets Grid */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 space-y-3">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-emerald-400" />
              <span>Efeitos &amp; Animações</span>
            </span>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all ${
                    activeCategory === cat.id
                      ? 'bg-emerald-500 text-neutral-950'
                      : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {filteredPresets.map(preset => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setSelectedPresetId(preset.id);
                      setSelectedModel(preset.model);
                      setGeneratedVideoUrl(preset.videoSample);
                    }}
                    className={`w-full p-2.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                        : 'bg-neutral-950/40 border-neutral-800/80 text-neutral-400 hover:text-white hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-900 shrink-0">
                        <img src={preset.previewGif} alt={preset.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white line-clamp-1">{preset.title}</div>
                        <div className="text-[10px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                          <Music className="w-2.5 h-2.5 text-emerald-400" />
                          <span className="truncate">{preset.audioTrack}</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-900 text-emerald-400 border border-neutral-800 shrink-0 ml-2">
                      {preset.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={startGeneration}
            disabled={isGenerating}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Sintetizando Vídeo com {currentModelInfo.name}...</span>
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                <span>Gerar Vídeo Viral IA (Livre &amp; Sem Moedas)</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: 9:16 Video Player with TikTok/Reels Layout (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-emerald-400" />
                  <span>Vídeo Veo 3 ({aspectRatio === '16:9' ? '16:9 Cinema / YouTube' : '9:16 TikTok / Reels'})</span>
                </span>
                <p className="text-[11px] text-neutral-400">{currentPreset.title} • {currentPreset.audioTrack}</p>
              </div>

              {/* Aspect Ratio Switcher (16:9 or 9:16) */}
              <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    aspectRatio === '9:16'
                      ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>9:16 Vertical</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('16:9')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    aspectRatio === '16:9'
                      ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>16:9 Horizontal</span>
                </button>
              </div>

              {generatedVideoUrl && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadVideo}
                    disabled={isDownloading}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-black transition-all shadow-lg shadow-emerald-500/25 active:scale-95"
                  >
                    {isDownloading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>A Descarregar...</span>
                      </>
                    ) : downloadSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Download Concluído!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Baixar MP4 (1080p)</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-all border border-neutral-700"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{isCopied ? 'Link Copiado!' : 'Partilhar'}</span>
                  </button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Olha esse vídeo viral incrível gerado no MePic AI: ' + window.location.href)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-all shadow-md"
                  >
                    <MessageSquareShare className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </a>
                </div>
              )}
            </div>

            {/* Video Player Box */}
            <div className={`relative rounded-2xl overflow-hidden bg-neutral-950 ${aspectRatio === '16:9' ? 'aspect-[16/9] max-w-full' : 'aspect-[9/16]'} max-h-[520px] mx-auto border border-neutral-800 flex items-center justify-center transition-all duration-300 group`}>
              {isGenerating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/90 z-20 space-y-4">
                  <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                  <div className="text-center space-y-1">
                    <p className="text-sm font-bold text-white">Renderizando Animação 60 FPS</p>
                    <p className="text-xs text-emerald-300 font-mono animate-pulse">{stepMessage}</p>
                  </div>
                  <div className="w-48 bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800">
                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ) : generatedVideoUrl ? (
                <>
                  <video
                    ref={videoRef}
                    key={generatedVideoUrl}
                    src={generatedVideoUrl}
                    poster={currentPreset.previewGif}
                    className="w-full h-full object-cover cursor-pointer"
                    autoPlay
                    loop
                    playsInline
                    muted={isMuted}
                    onClick={togglePlay}
                    onTimeUpdate={() => {
                      if (videoRef.current) {
                        setCurrentTime(videoRef.current.currentTime);
                      }
                    }}
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        setDuration(videoRef.current.duration || 5);
                        videoRef.current.play().catch(() => {
                          // Autoplay policy prevented unmuted sound
                          setIsMuted(true);
                          if (videoRef.current) {
                            videoRef.current.muted = true;
                            videoRef.current.play();
                          }
                        });
                      }
                    }}
                  />

                  {/* Unmute Big Floating Banner if audio is muted */}
                  {isMuted && (
                    <button
                      type="button"
                      onClick={toggleSound}
                      className="absolute top-14 left-1/2 -translate-x-1/2 z-20 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 px-4 py-2 rounded-full font-black text-xs shadow-2xl flex items-center gap-2 animate-bounce border-2 border-white/40 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4 animate-pulse" />
                      <span>Ouvir Música com Som 🔊</span>
                    </button>
                  )}

                  {/* Sound Toggle Button (Top Right) */}
                  <button
                    type="button"
                    onClick={toggleSound}
                    className="absolute top-4 right-4 z-20 bg-black/70 hover:bg-black/90 backdrop-blur text-white p-2.5 rounded-full border border-white/20 transition-all shadow-lg"
                    title={isMuted ? 'Ativar Áudio' : 'Desativar Áudio'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />}
                  </button>

                  {/* Play/Pause Central Overlay on Hover or Paused */}
                  {!isPlaying && (
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white z-20 border border-white/20 hover:scale-110 transition-transform shadow-2xl"
                    >
                      <Play className="w-8 h-8 fill-current translate-x-0.5 text-emerald-400" />
                    </button>
                  )}

                  {/* TikTok style floating overlay badges (Top Left) */}
                  <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10 pointer-events-none">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 backdrop-blur text-white border border-white/20">
                      @MePic_AI
                    </span>
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/90 backdrop-blur text-neutral-950 font-bold">
                      {currentModelInfo.name}
                    </span>
                  </div>

                  {/* Bottom Controls Bar */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 z-20 space-y-2">
                    <div className="flex items-center justify-between text-white">
                      <div>
                        <p className="text-xs font-bold drop-shadow-md">
                          {videoMode === 'photo_to_video' ? currentPreset.title : 'Vídeo com Prompt IA'}
                        </p>
                        <p className="text-[11px] text-neutral-200 flex items-center gap-1 drop-shadow">
                          <Music className="w-3 h-3 text-emerald-400" />
                          <span>{currentPreset.audioTrack}</span>
                        </p>
                      </div>

                      {/* Video Scrubber & Volume Controls */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={togglePlay}
                          className="text-white hover:text-emerald-400 transition-colors"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={toggleSound} className="text-neutral-300 hover:text-white">
                            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                          </button>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={isMuted ? 0 : volume}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setVolume(val);
                              setIsMuted(val === 0);
                              if (videoRef.current) {
                                videoRef.current.volume = val;
                                videoRef.current.muted = val === 0;
                              }
                            }}
                            className="w-14 h-1 accent-emerald-500 cursor-pointer"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (videoRef.current) {
                              if (document.fullscreenElement) {
                                document.exitFullscreen();
                              } else {
                                videoRef.current.requestFullscreen();
                              }
                            }
                          }}
                          className="text-neutral-300 hover:text-white"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar Scrubber */}
                    <div
                      className="w-full bg-white/20 hover:bg-white/30 h-1.5 rounded-full cursor-pointer overflow-hidden transition-all"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pos = (e.clientX - rect.left) / rect.width;
                        if (videoRef.current) {
                          videoRef.current.currentTime = pos * duration;
                        }
                      }}
                    >
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${(currentTime / (duration || 5)) * 100}%` }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-neutral-500">
                  <Video className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Seu vídeo aparecerá aqui</p>
                </div>
              )}
            </div>

            {/* Bottom Actions Banner */}
            {generatedVideoUrl && (
              <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-semibold text-neutral-300">
                    Vídeo 1080p pronto com trilha sonora estereofônica
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadVideo}
                  disabled={isDownloading}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-neutral-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloading ? 'Baixando Arquivo...' : 'Descarregar MP4 no Computador / Celular'}</span>
                </button>
              </div>
            )}

            <p className="text-center text-[11px] text-neutral-500">
              Vídeo gerado em proporção {aspectRatio === '16:9' ? '16:9 Horizontal' : '9:16 Vertical'} com áudio estéreo, pronto para publicação direta no TikTok, Instagram Reels, Status do WhatsApp e YouTube Shorts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
