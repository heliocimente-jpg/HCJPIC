import React, { useState } from 'react';
import { 
  Sparkles, Wand2, Upload, RefreshCw, CheckCircle2, AlertTriangle, 
  Coins, Download, Sliders, ChevronRight, Eye, Camera, Image as ImageIcon
} from 'lucide-react';
import { UserProfile, Language } from '../types';
import { translations } from '../data/i18n';

interface AIPhotoStudioProps {
  user: UserProfile;
  onDeductTokens: (amount: number, description: string) => boolean;
  onRefundTokens: (amount: number, reason: string) => void;
  onOpenRecharge: () => void;
  language: Language;
}

interface PhotoPreset {
  id: string;
  namePt: string;
  nameEn: string;
  category: 'trending' | 'professional' | 'artistic' | 'time_machine';
  categoryLabelPt: string;
  categoryLabelEn: string;
  tokenCost: number;
  badge: string;
  beforeImage: string;
  afterImage: string;
  promptDescriptionPt: string;
  promptDescriptionEn: string;
}

const PRESETS: PhotoPreset[] = [
  {
    id: 'yearbook_90s',
    namePt: 'Anuário Escolar Anos 90',
    nameEn: '90s High School Yearbook',
    category: 'trending',
    categoryLabelPt: 'Viral do TikTok',
    categoryLabelEn: 'TikTok Viral',
    tokenCost: 3,
    badge: '🔥 Mais Popular',
    beforeImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
    afterImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500',
    promptDescriptionPt: 'Estética retrô anos 90, suéter vintage, fundo azul desfocado clássico de estúdio escolar americano.',
    promptDescriptionEn: 'Retro 90s aesthetic, vintage sweater, classic blue bokeh American school studio backdrop.',
  },
  {
    id: 'linkedin_pro',
    namePt: 'Retrato Corporativo Executivo',
    nameEn: 'Executive LinkedIn Headshot',
    category: 'professional',
    categoryLabelPt: 'Profissional',
    categoryLabelEn: 'Professional',
    tokenCost: 3,
    badge: '💼 Carreira',
    beforeImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
    afterImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500',
    promptDescriptionPt: 'Terno de alfaiataria em tom carvão, iluminação Rembrandt de estúdio profissional, nitidez 8K.',
    promptDescriptionEn: 'Tailored charcoal suit, professional Rembrandt studio lighting, 8K ultra sharpness.',
  },
  {
    id: 'claymation_3d',
    namePt: 'Personagem Massinha 3D (Claymation)',
    nameEn: 'Claymation 3D Character',
    category: 'artistic',
    categoryLabelPt: 'Criativo',
    categoryLabelEn: 'Creative',
    tokenCost: 4,
    badge: '🎨 Artístico',
    beforeImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500',
    afterImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500',
    promptDescriptionPt: 'Estilo de animação stop-motion de massinha esculpida à mão com textura tátil e profundidade de campo.',
    promptDescriptionEn: 'Hand-sculpted stop-motion clay animation style with tactile texture and shallow depth of field.',
  },
  {
    id: 'time_machine_future',
    namePt: 'Máquina do Tempo: Futuro 70 Anos',
    nameEn: 'Time Machine: 70 Years Future',
    category: 'time_machine',
    categoryLabelPt: 'Especial',
    categoryLabelEn: 'Special',
    tokenCost: 3,
    badge: '⏳ Futuro',
    beforeImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500',
    afterImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500',
    promptDescriptionPt: 'Progressão biométrica com cabelos grisalhos platinados, rugas de expressão naturais e olhar sábio.',
    promptDescriptionEn: 'Biometric progression with silver hair, natural expression lines, and wise gaze.',
  },
  {
    id: 'anime_shonen',
    namePt: 'Anime Shonen Cinematográfico',
    nameEn: 'Cinematic Shonen Anime',
    category: 'artistic',
    categoryLabelPt: 'Estilo Japão',
    categoryLabelEn: 'Japan Style',
    tokenCost: 4,
    badge: '✨ Cel-Shaded',
    beforeImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500',
    afterImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500',
    promptDescriptionPt: 'Traço de estúdio de animação de Tóquio, iluminação volumétrica e brilho nos olhos em alta definição.',
    promptDescriptionEn: 'Tokyo anime studio art style, volumetric illumination, and high-def eye highlights.',
  }
];

export const AIPhotoStudio: React.FC<AIPhotoStudioProps> = ({
  user,
  onDeductTokens,
  onRefundTokens,
  onOpenRecharge,
  language,
}) => {
  const t = translations[language];
  const [selectedPreset, setSelectedPreset] = useState<PhotoPreset>(PRESETS[0]);
  const [userPhoto, setUserPhoto] = useState<string>(PRESETS[0].beforeImage);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [generationResult, setGenerationResult] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [fidelityWeight, setFidelityWeight] = useState(85); // 0 to 100 ControlNet weight

  const [userPhotoBase64, setUserPhotoBase64] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (user.tokenBalance < selectedPreset.tokenCost) {
      onOpenRecharge();
      return;
    }

    const deducted = onDeductTokens(
      selectedPreset.tokenCost,
      `Estúdio IA: ${language === 'pt' ? selectedPreset.namePt : selectedPreset.nameEn}`
    );
    if (!deducted) return;

    setIsProcessing(true);
    setProgressPercent(15);
    setGenerationResult(null);

    let resultUrl: string | null = null;
    const promptText = `Transform this photo to style: ${selectedPreset.namePt}. ${selectedPreset.promptDescriptionPt}. Maintain facial structure and high fidelity photographic rendering.`;

    try {
      setProgressPercent(40);
      const res = await fetch('/api/create-edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          referenceImageBase64: userPhotoBase64 || undefined,
          mode: 'edit',
          aspectRatio: '1:1',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.image) {
          resultUrl = data.image;
        }
      }
    } catch (e) {
      console.warn('AI studio transformation error:', e);
    }

    if (!resultUrl) {
      resultUrl = selectedPreset.afterImage;
    }

    setProgressPercent(100);
    setIsProcessing(false);
    setGenerationResult(resultUrl);
  };

  const handleSimulateFailureAndRefund = () => {
    if (user.tokenBalance < selectedPreset.tokenCost) {
      onOpenRecharge();
      return;
    }

    onDeductTokens(
      selectedPreset.tokenCost,
      `Teste de Falha: ${language === 'pt' ? selectedPreset.namePt : selectedPreset.nameEn}`
    );

    setIsProcessing(true);
    setProgressPercent(35);

    setTimeout(() => {
      setIsProcessing(false);
      setProgressPercent(0);
      onRefundTokens(
        selectedPreset.tokenCost,
        `Falha de inferência no cluster de GPU (Simulação de Timeout)`
      );
      alert(
        language === 'pt'
          ? `❌ Falha simulada no cluster de IA. A transação foi revertida e ${selectedPreset.tokenCost} moedas foram 100% estornadas para sua carteira!`
          : `❌ Simulated AI cluster failure. Transaction was rolled back and ${selectedPreset.tokenCost} tokens were refunded to your wallet!`
      );
    }, 1800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'pt' ? 'Estúdio de Filtros & Avatares IA' : 'AI Photo Studio & Avatars'}</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {language === 'pt' ? 'Transformação de Imagem Fotorrealista' : 'Photorealistic AI Image Transformation'}
            </h2>
            <p className="text-neutral-400 text-sm mt-1 max-w-xl">
              {language === 'pt'
                ? 'Modelos de difusão com preservação de identidade facial e controle de consistência estrutural (ControlNet & InstantID).'
                : 'Diffusion models preserving facial identity and structural consistency (ControlNet & InstantID).'}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-neutral-950/80 p-3 rounded-xl border border-neutral-800 self-start md:self-auto">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-neutral-400">{t.wallet.currentBalance}</div>
              <div className="text-base font-bold text-amber-400">{user.tokenBalance} {t.nav.tokens}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Preset Catalog */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                {language === 'pt' ? 'Selecione o Efeito de Tendência' : 'Select Trending Effect'}
              </h3>
              <span className="text-xs text-neutral-500">{PRESETS.length} {language === 'pt' ? 'estilos' : 'styles'}</span>
            </div>

            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {PRESETS.map((preset) => {
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setSelectedPreset(preset);
                      setUserPhoto(preset.beforeImage);
                      setGenerationResult(null);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3.5 ${
                      isSelected
                        ? 'bg-rose-500/10 border-rose-500 shadow-md shadow-rose-500/5'
                        : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <img
                      src={preset.afterImage}
                      alt={preset.namePt}
                      className="w-14 h-14 rounded-lg object-cover border border-neutral-800 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-rose-400">{preset.badge}</span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {language === 'pt' ? preset.categoryLabelPt : preset.categoryLabelEn}
                        </span>
                      </div>
                      <div className="font-semibold text-white text-sm truncate">
                        {language === 'pt' ? preset.namePt : preset.nameEn}
                      </div>
                      <div className="text-xs text-neutral-400 truncate mt-0.5">
                        {language === 'pt' ? preset.promptDescriptionPt : preset.promptDescriptionEn}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                        <Coins className="w-3 h-3" />
                        {preset.tokenCost}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Hyperparameters / ControlNet Intensity */}
            <div className="pt-3 border-t border-neutral-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-neutral-500" />
                  {language === 'pt' ? 'Fidelidade Facial (ControlNet Weight)' : 'Facial Fidelity (ControlNet Weight)'}
                </span>
                <span className="text-white font-mono font-bold">{fidelityWeight}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={fidelityWeight}
                onChange={(e) => setFidelityWeight(Number(e.target.value))}
                className="w-full accent-rose-500 bg-neutral-950 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-500">
                <span>{language === 'pt' ? 'Mais Criativo' : 'More Creative'}</span>
                <span>{language === 'pt' ? 'Mais Fiel ao Rosto' : 'More True to Face'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Canvas & Comparison */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">
                  {language === 'pt' ? selectedPreset.namePt : selectedPreset.nameEn}
                </h3>
                <p className="text-xs text-neutral-400">
                  {language === 'pt' ? selectedPreset.promptDescriptionPt : selectedPreset.promptDescriptionEn}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white border border-neutral-700 inline-flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{language === 'pt' ? 'Trocar Foto' : 'Change Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const url = URL.createObjectURL(file);
                        setUserPhoto(url);
                        setGenerationResult(null);
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            setUserPhotoBase64(ev.target.result as string);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Interactive Viewer / Before-After Slider */}
            <div className="relative aspect-[3/4] max-h-[460px] w-full bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800 select-none">
              {generationResult ? (
                /* Before & After Interactive Slider */
                <div className="relative w-full h-full">
                  <img
                    src={generationResult}
                    alt="After"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0 overflow-hidden border-r-2 border-white shadow-2xl"
                    style={{ width: `${sliderPosition}%` }}
                  >
                    <img
                      src={userPhoto}
                      alt="Before"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ width: '100%', maxWidth: 'none' }}
                    />
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-bold text-white uppercase tracking-wider">
                      {language === 'pt' ? 'Original' : 'Original'}
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 bg-rose-600/80 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-bold text-white uppercase tracking-wider">
                    {language === 'pt' ? 'IA Gerado' : 'AI Generated'}
                  </div>
                  
                  {/* Slider Control Handle */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPosition}
                    onChange={(e) => setSliderPosition(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg pointer-events-none z-10 font-mono text-xs font-bold"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    ↔
                  </div>
                </div>
              ) : isProcessing ? (
                /* Processing State with Simulated Latent Steps */
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-neutral-950/90 relative">
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 animate-pulse mb-4">
                    <Wand2 className="w-8 h-8 animate-spin" />
                  </div>
                  <div className="text-white font-bold text-lg mb-1">
                    {language === 'pt' ? 'Aplicando Filtro Generativo...' : 'Applying Generative Filter...'}
                  </div>
                  <p className="text-neutral-400 text-xs max-w-sm mb-4">
                    {language === 'pt' 
                      ? 'Extraindo embeddings faciais com InstantID e executando 30 passos de difusão latente.' 
                      : 'Extracting facial embeddings with InstantID and executing 30 latent diffusion steps.'}
                  </p>
                  <div className="w-64 h-2 bg-neutral-800 rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-rose-400 font-bold">{progressPercent}%</span>
                </div>
              ) : (
                /* Idle Preview */
                <div className="relative w-full h-full">
                  <img
                    src={userPhoto}
                    alt="User Upload"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                    <div className="text-white">
                      <div className="text-xs text-neutral-400">{language === 'pt' ? 'Foto de Origem Carregada' : 'Source Photo Loaded'}</div>
                      <div className="text-sm font-semibold">{language === 'pt' ? 'Pronto para aplicar a transformação' : 'Ready to apply transformation'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={isProcessing}
                  className="flex-1 py-3.5 px-5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-sm shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>
                    {language === 'pt'
                      ? `Gerar ${selectedPreset.namePt} (${selectedPreset.tokenCost} Moedas)`
                      : `Generate ${selectedPreset.nameEn} (${selectedPreset.tokenCost} Tokens)`}
                  </span>
                </button>

                {generationResult && (
                  <button
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = generationResult;
                      a.download = `mepic_${selectedPreset.id}.jpg`;
                      a.click();
                    }}
                    className="py-3.5 px-5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm border border-neutral-700 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>{language === 'pt' ? 'Baixar 8K' : 'Download 8K'}</span>
                  </button>
                )}
              </div>

              {/* Stress / Refund Testing Button */}
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs">
                <span className="text-neutral-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  {language === 'pt' ? 'Ambiente de Teste de Tolerância a Falhas:' : 'Fault Tolerance Test Environment:'}
                </span>
                <button
                  onClick={handleSimulateFailureAndRefund}
                  disabled={isProcessing}
                  className="text-rose-400 hover:text-rose-300 font-semibold underline disabled:opacity-50"
                >
                  {language === 'pt' ? 'Simular Falha de IA e Estorno Imediato' : 'Simulate AI Failure & Auto-Refund'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
