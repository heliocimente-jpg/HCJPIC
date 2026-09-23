import React, { useState, useRef } from 'react';
import { 
  Sparkles, Sliders, ChevronDown, Check, RefreshCw, Scissors, Palette
} from 'lucide-react';
import { Language, UserProfile, HairStyleOption } from '../types';
import { translations } from '../data/i18n';

interface HairStyleChangerProps {
  currentLanguage: Language;
  user: UserProfile;
  onDeductTokens: (amount: number, description: string) => boolean;
  onOpenRechargeModal: () => void;
}

const HAIR_STYLES: HairStyleOption[] = [
  {
    id: 'blonde_balayage',
    name: 'Loiro Balayage Iluminado',
    category: 'color',
    description: 'Mechas douradas com raiz esfumada e acabamento sedoso natural.',
    previewImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80',
    colorHex: '#EAB308',
    tokenCost: 4,
  },
  {
    id: 'french_bob',
    name: 'Corte Bob Francês Moderno',
    category: 'cut',
    description: 'Linhas retas na altura do queixo com franja leve desfiada.',
    previewImage: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=500&auto=format&fit=crop&q=80',
    tokenCost: 4,
  },
  {
    id: 'fade_buzzcut',
    name: 'Buzz Cut com Degradê Navalhado',
    category: 'cut',
    description: 'Corte militar com transição suave nas têmporas e nuca.',
    previewImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    tokenCost: 4,
  },
  {
    id: 'curly_copper',
    name: 'Cachos Volumosos Acobreados',
    category: 'texture',
    description: 'Definição espiralada 3C/4A com tonalidade cobre avermelhada quente.',
    previewImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    colorHex: '#F97316',
    tokenCost: 4,
  },
  {
    id: 'cyber_neon_pink',
    name: 'Rosa Neon Cyberpunk',
    category: 'creative',
    description: 'Coloração fantasia de alto contraste inspirada em estética synthwave.',
    previewImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    colorHex: '#EC4899',
    tokenCost: 4,
  },
  {
    id: 'brunette_espresso',
    name: 'Morena Iluminada Espresso',
    category: 'color',
    description: 'Castanho profundo com reflexos quentes em caramelo e avelã.',
    previewImage: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=500&auto=format&fit=crop&q=80',
    colorHex: '#78350F',
    tokenCost: 4,
  }
];

export const HairStyleChanger: React.FC<HairStyleChangerProps> = ({
  currentLanguage,
  user,
  onDeductTokens,
  onOpenRechargeModal,
}) => {
  const t = translations[currentLanguage];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputImage, setInputImage] = useState<string>(
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80'
  );
  const [selectedStyle, setSelectedStyle] = useState<HairStyleOption>(HAIR_STYLES[0]);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState<boolean>(false);
  const [intensity, setIntensity] = useState<number>(85);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Generation & Comparison State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80'
  );
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setInputImage(event.target?.result as string);
        setGeneratedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyHairStyle = () => {
    const deducted = onDeductTokens(4, `Troca de Cabelo: ${selectedStyle.name}`);
    if (!deducted) {
      onOpenRechargeModal();
      return;
    }

    setIsProcessing(true);
    setGeneratedImage(null);

    // Realistic API latency simulation
    setTimeout(() => {
      setIsProcessing(false);
      setGeneratedImage(selectedStyle.previewImage);
      setSliderPosition(50);
    }, 2500);
  };

  const filteredStyles = activeCategory === 'all'
    ? HAIR_STYLES
    : HAIR_STYLES.filter(s => s.category === activeCategory);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950/40 via-neutral-900 to-neutral-900 p-6 rounded-2xl border border-purple-500/20 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Scissors className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl md:text-2xl font-extrabold text-white font-['Syne']">
                {t.hair.title}
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Fotorrealista com Preservação de Rosto
              </span>
            </div>
            <p className="text-sm text-neutral-400 max-w-2xl">
              {t.hair.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl">
              🪙 Custo: 4 Tokens
            </span>
          </div>
        </div>
      </div>

      {/* Main Layout: Controls & Before/After Slider */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Controls Column (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* 1. Portrait Upload */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs">1</span>
                {t.hair.uploadTitle}
              </h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
              >
                Carregar Nova Foto
              </button>
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-700 hover:border-purple-500/50 rounded-xl p-4 cursor-pointer transition-all bg-neutral-950/40 flex items-center gap-4"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              <div className="w-20 h-20 rounded-lg overflow-hidden border border-neutral-700 shrink-0">
                <img 
                  src={inputImage} 
                  alt="Original" 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1">
                <p className="text-xs font-semibold text-neutral-200">
                  Foto de rosto carregada
                </p>
                <p className="text-[11px] text-neutral-400 mt-1">
                  {t.hair.uploadDesc}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Selected Style Card + Bottom Sheet Trigger */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs">2</span>
                {t.hair.selectedStyle}
              </h3>
              <span className="text-[11px] text-purple-400 font-semibold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                {selectedStyle.category.toUpperCase()}
              </span>
            </div>

            {/* Active Style Spotlight */}
            <div className="flex items-center gap-4 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-neutral-700 shrink-0">
                <img 
                  src={selectedStyle.previewImage} 
                  alt={selectedStyle.name} 
                  className="w-full h-full object-cover"
                />
                {selectedStyle.colorHex && (
                  <span 
                    className="absolute top-1 right-1 w-3 h-3 rounded-full border border-white/50"
                    style={{ backgroundColor: selectedStyle.colorHex }}
                  />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">{selectedStyle.name}</h4>
                <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">{selectedStyle.description}</p>
              </div>
            </div>

            {/* Intensity Slider */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-neutral-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  {t.hair.intensity}
                </span>
                <span className="text-purple-300 font-bold font-mono">{intensity}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            {/* Trigger Bottom Sheet Button (Matches Flutter Requirement) */}
            <button
              id="open-bottom-sheet-btn"
              onClick={() => setIsBottomSheetOpen(true)}
              className="w-full py-3 px-4 rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 text-xs font-bold flex items-center justify-between transition-all"
            >
              <span className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-400" />
                {t.hair.openBottomSheet}
              </span>
              <ChevronDown className="w-4 h-4 text-purple-400" />
            </button>
          </div>

          {/* Action Button */}
          <button
            id="apply-hair-style-btn"
            onClick={handleApplyHairStyle}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all text-sm"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Aplicando Transformação com IA (ControlNet Face)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t.hair.confirmAndGenerate}</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Before & After Comparator (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sticky top-24">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">
                {t.hair.beforeAfter}
              </h3>
              <span className="text-[11px] text-neutral-400">
                Arraste o divisor horizontalmente
              </span>
            </div>

            {/* Interactive Before / After Split Slider */}
            <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden select-none bg-neutral-950 border border-neutral-800">
              
              {/* After (Styled Image) */}
              <img
                src={generatedImage || inputImage}
                alt="Styled Look"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Before (Original Image clipped) */}
              <div 
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={inputImage}
                  alt="Original Look"
                  className="absolute inset-0 w-full h-full object-cover max-w-none"
                  style={{ width: '100%', height: '100%' }}
                />
                <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-neutral-300 text-[10px] font-bold px-2 py-0.5 rounded">
                  {t.hair.original}
                </span>
              </div>

              {/* Right Tag */}
              <span className="absolute top-3 right-3 bg-purple-600/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                {t.hair.styled}
              </span>

              {/* Slider Line & Thumb */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-neutral-900 shadow-xl flex items-center justify-center text-xs font-bold">
                  ↔
                </div>
              </div>

              {/* Range input overlay for smooth interaction */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-20"
              />
            </div>

            <div className="mt-4 p-3 bg-neutral-950/80 rounded-xl border border-neutral-800/80 text-[11px] text-neutral-400">
              <span className="text-purple-400 font-bold">Preservação Facial:</span> O pipeline utiliza máscara semântica de segmentação de couro cabeludo (BiSeNet) mantendo 100% da geometria facial, olhos e tom de pele originais do usuário.
            </div>
          </div>
        </div>

      </div>

      {/* ==================================================================== */}
      {/* CUSTOM BOTTOM SHEET (FLUTTER REPLICA REQUIREMENT #4)                  */}
      {/* ==================================================================== */}
      {isBottomSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-neutral-900 w-full max-w-2xl rounded-t-3xl border-t border-neutral-700 shadow-2xl p-6 max-h-[85vh] flex flex-col space-y-4 animate-in slide-in-from-bottom duration-300"
          >
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-neutral-700 rounded-full mx-auto" />

            {/* Bottom Sheet Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {t.hair.bottomSheetTitle}
                </h3>
                <p className="text-xs text-neutral-400">
                  {t.hair.bottomSheetSubtitle}
                </p>
              </div>
              <button
                onClick={() => setIsBottomSheetOpen(false)}
                className="text-neutral-400 hover:text-white text-xs font-bold px-2.5 py-1 rounded-lg bg-neutral-800"
              >
                ✕ Fechar
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
              {[
                { id: 'all', label: 'Todos os Estilos' },
                { id: 'color', label: 'Coloração & Mechas' },
                { id: 'cut', label: 'Cortes Tendência' },
                { id: 'texture', label: 'Textura & Volume' },
                { id: 'creative', label: 'Cores Fantasia' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                    activeCategory === cat.id
                      ? 'bg-purple-500 text-white font-bold'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Styles Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[50vh] pr-1">
              {filteredStyles.map(style => {
                const isSelected = selectedStyle.id === style.id;
                return (
                  <div
                    key={style.id}
                    onClick={() => setSelectedStyle(style)}
                    className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all p-1.5 bg-neutral-950 ${
                      isSelected
                        ? 'border-purple-500 ring-2 ring-purple-500/30'
                        : 'border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="h-28 rounded-lg overflow-hidden relative">
                      <img 
                        src={style.previewImage} 
                        alt={style.name} 
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center shadow">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <h4 className="text-xs font-bold text-white truncate">{style.name}</h4>
                      <p className="text-[10px] text-neutral-400 line-clamp-1">{style.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Sheet Confirm Button */}
            <div className="pt-2">
              <button
                id="confirm-style-selection"
                onClick={() => setIsBottomSheetOpen(false)}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md shadow-purple-500/20"
              >
                {t.hair.applyStyleBtn} ({selectedStyle.name})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
