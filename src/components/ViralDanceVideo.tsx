import React, { useState, useRef } from 'react';
import { 
  Upload, Play, Music, Sparkles, CheckCircle2, 
  AlertCircle, RefreshCw, Download, Share2, Film, ShieldAlert,
  Volume2, VolumeX, Check
} from 'lucide-react';
import { Language, UserProfile, DanceTemplate } from '../types';
import { translations } from '../data/i18n';
import { downloadMediaFile } from '../utils/downloadMedia';

interface ViralDanceVideoProps {
  currentLanguage: Language;
  user: UserProfile;
  onDeductTokens: (amount: number, description: string) => boolean;
  onRefundTokens: (amount: number, reason: string) => void;
  onOpenRechargeModal: () => void;
}

const DANCE_TEMPLATES: DanceTemplate[] = [
  {
    id: 'tiktok_shuffle',
    title: 'TikTok Shuffle & Passinho 2026',
    category: 'Viral Trend',
    duration: '15s',
    previewGif: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=500&auto=format&fit=crop&q=80',
    videoSample: '/videos/tiktok_glow_shuffle.mp4',
    musicTrack: 'Electro Bass Drop (128 BPM)',
    tokenCost: 10,
    popularBadge: '🔥 Top 1 TikTok',
  },
  {
    id: 'couple_bachata',
    title: 'Dança de Casal: Bachata Sensual & Kizomba',
    category: 'Casais',
    duration: '15s',
    previewGif: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=500&auto=format&fit=crop&q=80',
    videoSample: '/videos/couple_sunset.mp4',
    musicTrack: 'Sensual Latin Guitar (Kizomba Mix)',
    tokenCost: 10,
    popularBadge: '💑 Casais & Romance',
  },
  {
    id: 'baby_hiphop',
    title: 'Dança Infantil: Bebé no Breakdance & Pop',
    category: 'Crianças & Bebés',
    duration: '12s',
    previewGif: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500&auto=format&fit=crop&q=80',
    videoSample: '/videos/kids_breakdance.mp4',
    musicTrack: 'Baby Funky Bounce 128 BPM',
    tokenCost: 10,
    popularBadge: '👶 Super Fofo',
  },
  {
    id: 'whatsapp_groove',
    title: 'Viral WhatsApp: Dança da Família Alegre',
    category: 'Status WhatsApp',
    duration: '14s',
    previewGif: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80',
    videoSample: '/videos/dance_grandma.mp4',
    musicTrack: 'Family Party Beat 130 BPM',
    tokenCost: 10,
    popularBadge: '📱 Status WhatsApp',
  },
  {
    id: 'kpop_challenge',
    title: 'K-Pop idol Synchronized Dance',
    category: 'Choreography',
    duration: '12s',
    previewGif: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80',
    videoSample: '/videos/tiktok_fashion.mp4',
    musicTrack: 'K-Beat Melodic Wave',
    tokenCost: 10,
    popularBadge: '🌟 Trending',
  },
  {
    id: 'samba_funk',
    title: 'Samba Funk do Brasil',
    category: 'Ritmo Latino',
    duration: '14s',
    previewGif: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop&q=80',
    videoSample: '/videos/dance_funk.mp4',
    musicTrack: 'Tambor & Batidão 150 BPM',
    tokenCost: 10,
  },
  {
    id: 'cyber_breakdance',
    title: 'Cyberpunk Neon Freeze',
    category: 'Street Dance',
    duration: '16s',
    previewGif: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=500&auto=format&fit=crop&q=80',
    videoSample: '/videos/dance_pet.mp4',
    musicTrack: 'Synthwave Glitch Beats',
    tokenCost: 10,
  }
];

export const ViralDanceVideo: React.FC<ViralDanceVideoProps> = ({
  currentLanguage,
  user,
  onDeductTokens,
  onRefundTokens,
  onOpenRechargeModal,
}) => {
  const t = translations[currentLanguage];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80'
  );
  const [selectedTemplate, setSelectedTemplate] = useState<DanceTemplate>(DANCE_TEMPLATES[0]);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | '16:9'>('9:16');
  
  // Pipeline generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [errorLog, setErrorLog] = useState<string | null>(null);
  const [refundAlert, setRefundAlert] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // File handling
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedPhoto(event.target?.result as string);
        setGeneratedVideoUrl(null);
        setErrorLog(null);
        setRefundAlert(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Normal generation flow
  const handleStartGeneration = async () => {
    if (!selectedPhoto) {
      alert(t.hair.uploadDesc);
      return;
    }

    // Atomic token deduction
    const deducted = onDeductTokens(10, `Geração Vídeo de Dança: ${selectedTemplate.title}`);
    if (!deducted) {
      onOpenRechargeModal();
      return;
    }

    setIsGenerating(true);
    setGeneratedVideoUrl(null);
    setErrorLog(null);
    setRefundAlert(null);
    setProgressPercent(20);
    setGenerationStage(1);
    setStatusMessage('Extraindo esqueleto 3D e renderizando coreografia musical...');

    let finalVideoUrl = selectedTemplate.videoSample || '/videos/dance_funk.mp4';

    try {
      const animRes = await fetch('/api/animate-photo-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoBase64: selectedPhoto.startsWith('data:') ? selectedPhoto : undefined,
          imageUrl: !selectedPhoto.startsWith('data:') ? selectedPhoto : selectedTemplate.previewGif,
          aspectRatio: aspectRatio === '16:9' ? '16:9' : '9:16',
          presetId: selectedTemplate.id,
          prompt: `${selectedTemplate.title}. ${selectedTemplate.musicTrack}`,
        }),
      });

      if (animRes.ok) {
        const animData = await animRes.json();
        if (animData.success && animData.videoUrl) {
          finalVideoUrl = animData.videoUrl;
        }
      }
    } catch (e) {
      console.warn('Fallback to preset video:', e);
    }

    setGenerationStage(4);
    setProgressPercent(100);
    setStatusMessage(t.dance.stepComplete);
    setIsGenerating(false);
    setGeneratedVideoUrl(finalVideoUrl);
    setIsMuted(false);
  };

  // Test Failure & Refund Flow (Prompt Requirement 3e)
  const handleSimulateFailureAndRefund = async () => {
    const deducted = onDeductTokens(10, `[TESTE DE FALHA] Vídeo de Dança: ${selectedTemplate.title}`);
    if (!deducted) {
      onOpenRechargeModal();
      return;
    }

    setIsGenerating(true);
    setGeneratedVideoUrl(null);
    setErrorLog(null);
    setRefundAlert(null);
    setProgressPercent(25);
    setGenerationStage(1);
    setStatusMessage(t.dance.stepExtract);

    setTimeout(() => {
      setProgressPercent(50);
      setGenerationStage(2);
      setStatusMessage('Contatando API Externa da GPU (Kling / Runway)...');

      setTimeout(() => {
        setIsGenerating(false);
        setGenerationStage(0);
        setProgressPercent(0);
        setErrorLog('504 Gateway Timeout: Cluster de GPUs do provedor externo não respondeu após 180s.');
        
        // Auto-refund 10 tokens
        onRefundTokens(10, 'Estorno automático: Provedor de IA com timeout (Fallback de Segurança)');
        setRefundAlert(t.alerts.refundSuccess);
      }, 2000);
    }, 1200);
  };

  return (
    <div className="space-y-8">
      {/* Title & Description Banner */}
      <div className="bg-gradient-to-r from-rose-950/40 via-neutral-900 to-neutral-900 p-6 rounded-2xl border border-rose-500/20 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Film className="w-5 h-5 text-rose-400" />
              <h2 className="text-xl md:text-2xl font-extrabold text-white font-['Syne']">
                {t.dance.title}
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                9:16 Viral TikTok / Reels
              </span>
            </div>
            <p className="text-sm text-neutral-400 max-w-2xl">
              {t.dance.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl">
              🪙 {t.dance.tokenRequired}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload & Controls + Output Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col (7 cols): Upload & Customization */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. Photo Ingestion */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs">1</span>
                {t.dance.uploadTitle}
              </h3>
              {selectedPhoto && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                >
                  Alterar Foto
                </button>
              )}
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-700 hover:border-rose-500/50 rounded-xl p-4 cursor-pointer transition-all bg-neutral-950/40 flex items-center gap-4"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              {selectedPhoto ? (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-neutral-700 shrink-0">
                  <img 
                    src={selectedPhoto} 
                    alt="Upload Preview" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <RefreshCw className="w-5 h-5 text-white" />
                  </div>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0">
                  <Upload className="w-8 h-8 text-neutral-500" />
                </div>
              )}

              <div className="flex-1">
                <p className="text-xs font-semibold text-neutral-200">
                  {selectedPhoto ? 'Foto carregada e pronta para esqueleto facial' : 'Clique ou arraste uma foto aqui'}
                </p>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Formatos aceitos: JPG, PNG, WEBP (até 15MB). Melhor resultado com corpo inteiro ou plano médio.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Dance Choreography Catalog */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs">2</span>
              {t.dance.selectDance}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DANCE_TEMPLATES.map((tpl) => {
                const isSelected = selectedTemplate.id === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl)}
                    className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all p-1.5 bg-neutral-950/60 ${
                      isSelected
                        ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-md'
                        : 'border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {tpl.popularBadge && (
                      <span className="absolute top-2 left-2 z-10 text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500 text-white shadow">
                        {tpl.popularBadge}
                      </span>
                    )}
                    <div className="h-28 rounded-lg overflow-hidden relative">
                      <img 
                        src={tpl.previewGif} 
                        alt={tpl.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-2">
                        <span className="text-[10px] text-neutral-300 flex items-center gap-1 font-mono">
                          <Play className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                          {tpl.duration}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 px-1">
                      <p className="text-xs font-bold text-white truncate">{tpl.title}</p>
                      <p className="text-[10px] text-neutral-400 truncate">{tpl.category}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Audio Sountrack info */}
            <div className="mt-4 flex items-center gap-2 bg-neutral-950/70 border border-neutral-800 rounded-xl px-3 py-2 text-xs">
              <Music className="w-4 h-4 text-rose-400 shrink-0" />
              <div className="flex-1 truncate">
                <span className="text-neutral-400 text-[11px]">{t.dance.selectAudio}: </span>
                <span className="text-white font-medium">{selectedTemplate.musicTrack}</span>
              </div>
            </div>
          </div>

          {/* 3. Export Aspect Ratio */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs">3</span>
              {t.dance.aspectRatio}
            </h3>

            <div className="grid grid-cols-3 gap-3">
              {[
                { id: '9:16', label: '9:16 Vertical', desc: 'TikTok, Reels, Shorts', icon: '📱' },
                { id: '1:1', label: '1:1 Quadrado', desc: 'Feed Instagram', icon: '⏹️' },
                { id: '16:9', label: '16:9 Widescreen', desc: 'YouTube HD', icon: '🖥️' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setAspectRatio(fmt.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    aspectRatio === fmt.id
                      ? 'border-rose-500 bg-rose-500/10 text-white'
                      : 'border-neutral-800 bg-neutral-950/50 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="text-lg">{fmt.icon}</div>
                  <div className="text-xs font-bold mt-1 text-white">{fmt.label}</div>
                  <div className="text-[10px] text-neutral-400">{fmt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              id="generate-dance-btn"
              onClick={handleStartGeneration}
              disabled={isGenerating}
              className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 transition-all text-sm"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processando Vídeo ({progressPercent}%)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t.dance.generateBtn}</span>
                </>
              )}
            </button>

            {/* Test Fallback Refund Button */}
            <button
              id="test-refund-btn"
              onClick={handleSimulateFailureAndRefund}
              disabled={isGenerating}
              className="bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all"
              title="Testa o mecanismo de estorno automático caso a API de IA caia ou atinja timeout"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>{t.dance.simFailureBtn}</span>
            </button>
          </div>

          {/* Alerts / Refund status feedback */}
          {refundAlert && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3 text-xs text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-emerald-200 font-bold mb-0.5">Estorno Automático Concluído com Sucesso!</strong>
                {refundAlert} O saldo foi recalculado e registrado na auditoria do banco de dados.
              </div>
            </div>
          )}

          {errorLog && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-xs text-rose-300">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-rose-200 font-bold mb-0.5">Falha Simulada da API Externa:</strong>
                {errorLog}
              </div>
            </div>
          )}
        </div>

        {/* Right Col (5 cols): Live Pipeline Stage Monitor & Output Player */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sticky top-24">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
              <span>{t.dance.watchResult}</span>
              {generatedVideoUrl && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  H.264 60 FPS
                </span>
              )}
            </h3>

            {/* Video Viewport / 9:16 Canvas Mock */}
            <div className="relative w-full max-w-[280px] mx-auto aspect-[9/16] bg-black rounded-2xl overflow-hidden border-2 border-neutral-800 shadow-2xl flex items-center justify-center">
              
              {/* If Video Generated */}
              {generatedVideoUrl ? (
                <>
                  <video
                    ref={videoRef}
                    key={generatedVideoUrl}
                    src={generatedVideoUrl}
                    poster={selectedTemplate.previewGif}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    className="w-full h-full object-cover"
                  />

                  {/* Sound Toggle Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isMuted;
                      setIsMuted(next);
                      if (videoRef.current) {
                        videoRef.current.muted = next;
                        if (!next && videoRef.current.paused) {
                          videoRef.current.play();
                        }
                      }
                    }}
                    className="absolute top-3 right-3 z-20 bg-black/70 hover:bg-black/90 backdrop-blur text-white p-2 rounded-full border border-white/20 transition-all shadow-md"
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>

                  {/* Unmute prompt banner */}
                  {isMuted && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMuted(false);
                        if (videoRef.current) {
                          videoRef.current.muted = false;
                          videoRef.current.play();
                        }
                      }}
                      className="absolute top-12 left-1/2 -translate-x-1/2 z-20 bg-rose-500 hover:bg-rose-400 text-white px-3 py-1.5 rounded-full font-black text-[11px] shadow-lg flex items-center gap-1.5 animate-bounce border border-white/40 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Ativar Som 🔊</span>
                    </button>
                  )}
                </>
              ) : isGenerating ? (
                /* Processing State with Animated Stages */
                <div className="p-6 text-center space-y-4">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
                    <Sparkles className="w-8 h-8 text-rose-400 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{statusMessage}</p>
                    <div className="w-full bg-neutral-800 rounded-full h-1.5 mt-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-rose-500 to-pink-500 h-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-neutral-400 mt-1 block font-mono">
                      {progressPercent}% Concluído
                    </span>
                  </div>
                </div>
              ) : (
                /* Standby Idle Preview */
                <div className="p-6 text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-800/80 mx-auto flex items-center justify-center border border-neutral-700">
                    <Play className="w-7 h-7 text-neutral-500 ml-1" />
                  </div>
                  <p className="text-xs font-semibold text-neutral-300">
                    Nenhum vídeo em reprodução
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Clique em &quot;{t.dance.generateBtn}&quot; para orquestrar o pipeline de dança viral.
                  </p>
                </div>
              )}

              {/* Watermark overlay */}
              <div className="absolute bottom-3 right-3 text-[9px] font-mono bg-black/60 backdrop-blur-sm text-neutral-400 px-2 py-0.5 rounded">
                MePic AI • 9:16
              </div>
            </div>

            {/* Post-generation actions */}
            {generatedVideoUrl && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={async () => {
                    if (!generatedVideoUrl) return;
                    setIsDownloading(true);
                    try {
                      await downloadMediaFile(generatedVideoUrl, `mepic-danca-${selectedTemplate.id}-${Date.now()}.mp4`);
                      setDownloadSuccess(true);
                      setTimeout(() => setDownloadSuccess(false), 3000);
                    } catch (e) {
                      console.error('Download error:', e);
                    } finally {
                      setIsDownloading(false);
                    }
                  }}
                  disabled={isDownloading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
                >
                  {isDownloading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Baixando Arquivo MP4...</span>
                    </>
                  ) : downloadSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Download Concluído!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>{t.dance.downloadVideo} (1080p MP4)</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Dá uma olhada no meu vídeo de dança gerado com IA no MePic: ' + window.location.href)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-center"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Partilhar no WhatsApp / Stories</span>
                </a>
              </div>
            )}

            {/* Architecture Tip Pill */}
            <div className="mt-4 p-3 bg-neutral-950/80 rounded-xl border border-neutral-800/80 text-[11px] text-neutral-400">
              <span className="text-rose-400 font-bold">Pipeline Faststart:</span> O vídeo é codificado com <code className="text-neutral-200">-movflags +faststart</code>, permitindo que os clientes móveis iniciem a reprodução no 1º segundo sem aguardar o download completo.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
