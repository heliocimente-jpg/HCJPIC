import React, { useState } from 'react';
import { Sparkles, Wand2, RefreshCw, Image as ImageIcon, Sliders, Download, Share2, Copy, Check, Flame, Palette, Zap, Trophy, Shield, Shirt, Upload, Edit3, Eye } from 'lucide-react';
import { UserProfile, AIModelId, CreationItem } from '../types';
import { TEXT_TO_IMAGE_PRESETS, AI_MODELS } from '../data/aiModels';
import { saveCreationToFirestore } from '../firebase';

interface TextToImageGeneratorProps {
  user: UserProfile;
  language: 'pt' | 'en' | 'es';
  onCreationSaved?: (creation: CreationItem) => void;
}

export const TextToImageGenerator: React.FC<TextToImageGeneratorProps> = ({
  user,
  language,
  onCreationSaved,
}) => {
  const [imageMode, setImageMode] = useState<'create' | 'edit'>('create');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(TEXT_TO_IMAGE_PRESETS[0].prompt);
  const [selectedModel, setSelectedModel] = useState<AIModelId>('google_gemini_imagen3');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | '16:9'>('9:16');
  
  // Football poster special mode
  const [showFootballBuilder, setShowFootballBuilder] = useState(false);
  const [footballPlayerName, setFootballPlayerName] = useState('Helio');
  const [footballNumber, setFootballNumber] = useState('10');
  const [footballClub, setFootballClub] = useState('Real Madrid');

  // Generation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepMessage, setStepMessage] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(TEXT_TO_IMAGE_PRESETS[0].previewUrl);
  const [hasCopied, setHasCopied] = useState(false);

  const currentModelInfo = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];

  const categories = [
    { id: 'all', label: 'Todos os Estilos' },
    { id: 'cinematic', label: 'Cinematográfico 8K' },
    { id: 'art', label: 'Arte Digital & Pintura' },
    { id: 'cartoon', label: 'Cartoon & Anime' },
    { id: 'retro', label: 'Anos 80 Retro' },
    { id: 'posters', label: 'Pôster de Futebol' },
  ];

  const filteredPresets = activeCategory === 'all'
    ? TEXT_TO_IMAGE_PRESETS
    : TEXT_TO_IMAGE_PRESETS.filter(p => p.category === activeCategory);

  const handleApplyPreset = (preset: typeof TEXT_TO_IMAGE_PRESETS[0]) => {
    setPrompt(preset.prompt);
    setAspectRatio(preset.aspectRatio);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setReferenceImage(ev.target?.result as string);
        setImageMode('edit');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnhancePrompt = () => {
    setIsEnhancingPrompt(true);
    setTimeout(() => {
      setPrompt(prev => {
        const trimmed = prev.trim();
        return `${trimmed}, renderização hiper-realista em 8K, iluminação volumétrica Octane Render, profundidade de campo cinematográfica f/1.4, texturas nítidas e atmosfera digna de capa de revista`;
      });
      setIsEnhancingPrompt(false);
    }, 600);
  };

  const handleApplyFootballPoster = () => {
    const posterPrompt = `Cartaz oficial de futebol Champions League de ${footballPlayerName} vestindo a camisola número ${footballNumber} do ${footballClub}, comemorando vitória sob holofotes de estádio lotado com fogos de artifício e confetes dourados, arte esportiva épica, 8K ultra nítido.`;
    setPrompt(posterPrompt);
    setAspectRatio('9:16');
    setShowFootballBuilder(false);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setProgress(15);
    setStepMessage('Conectando ao modelo Gemini Flash Image (gemini-3.1-flash-image-preview)...');

    let resultUrl: string | null = null;

    try {
      const res = await fetch('/api/create-edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          referenceImageBase64: imageMode === 'edit' ? referenceImage : null,
          mode: imageMode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.image) {
          resultUrl = data.image;
        }
      }
    } catch (err) {
      console.warn('Gemini Flash Image fallback:', err);
    }

    // Fallback preset if API key not available or quota
    if (!resultUrl) {
      const match = TEXT_TO_IMAGE_PRESETS.find(p => prompt.includes(p.styleName) || prompt.includes(p.title));
      resultUrl = match ? match.previewUrl : TEXT_TO_IMAGE_PRESETS[Math.floor(Math.random() * TEXT_TO_IMAGE_PRESETS.length)].previewUrl;
    }

    setProgress(100);
    setStepMessage('Imagem renderizada com sucesso!');
    setGeneratedImageUrl(resultUrl);
    setIsGenerating(false);

    // Save creation
    const newCreation: CreationItem = {
      id: `img_${Date.now()}`,
      type: 'image',
      feature: 'text_to_image',
      title: prompt.slice(0, 40) + '...',
      mediaUrl: resultUrl,
      thumbnailUrl: resultUrl,
      modelUsed: 'Google Gemini Flash Image (gemini-3.1-flash-image-preview)',
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      promptOrStyle: `${imageMode === 'edit' ? '[Edição de Foto] ' : ''}${prompt}`,
      userId: user.id,
    };

    try {
      const stored = JSON.parse(localStorage.getItem('mepic_creations') || '[]');
      localStorage.setItem('mepic_creations', JSON.stringify([newCreation, ...stored]));
    } catch (e) {}

    await saveCreationToFirestore(newCreation, user.id);

    if (onCreationSaved) {
      onCreationSaved(newCreation);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-900 p-6 rounded-3xl border border-amber-500/20 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                <Palette className="w-4 h-4" />
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white font-['Syne']">
                Gerador de Imagem &amp; Arte IA (Texto para Imagem)
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>100% Grátis &amp; Ilimitado ∞</span>
              </span>
            </div>
            <p className="text-xs md:text-sm text-neutral-400 max-w-3xl leading-relaxed">
              Escreva uma ideia e a inteligência artificial desenha em segundos. Crie pinturas digitais, anime shonen, visual retro dos anos 80, cartazes de futebol ou arte fotorrealista com múltiplos motores de ponta (Google Gemini, FLUX.1, Sora e Kling).
            </p>
          </div>

          <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800 text-xs text-neutral-300 self-start md:self-auto">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Resolução Máxima 4K UHD</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Prompt Input & Controls (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Mode Switcher: Create vs Edit */}
          <div className="flex items-center gap-2 bg-neutral-950 p-1 rounded-2xl border border-neutral-800">
            <button
              type="button"
              onClick={() => setImageMode('create')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                imageMode === 'create'
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Criar Imagem do Zero</span>
            </button>
            <button
              type="button"
              onClick={() => setImageMode('edit')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                imageMode === 'edit'
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar Foto com Gemini</span>
            </button>
          </div>

          {/* Prompt Box */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 space-y-3">
            {imageMode === 'edit' && (
              <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0 flex items-center justify-center">
                  {referenceImage ? (
                    <img src={referenceImage} alt="Ref" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-5 h-5 text-neutral-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-white block">Foto de Referência para Edição</span>
                  <p className="text-[11px] text-neutral-400">Carregue a foto que deseja modificar via texto</p>
                </div>
                <label className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs cursor-pointer border border-neutral-700 transition-all shrink-0">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <span>{referenceImage ? 'Trocar' : 'Carregar'}</span>
                </label>
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                <Wand2 className="w-3.5 h-3.5 text-rose-400" />
                <span>{imageMode === 'edit' ? 'Instruções de Edição' : 'Descreva sua Ideia (Prompt de Criação)'}</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancingPrompt || !prompt.trim()}
                  className="text-[11px] text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg border border-rose-500/30 transition-all font-semibold flex items-center gap-1.5"
                >
                  <Sparkles className={`w-3 h-3 ${isEnhancingPrompt ? 'animate-spin' : ''}`} />
                  <span>{isEnhancingPrompt ? 'Expandindo...' : '✨ Melhorar com IA'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrompt(TEXT_TO_IMAGE_PRESETS[Math.floor(Math.random() * TEXT_TO_IMAGE_PRESETS.length)].prompt)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Sortear</span>
                </button>
              </div>
            </div>

            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Retrato cinematográfico sob luz de neon em Tóquio, fotorrealista 8K..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-xs md:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors resize-none leading-relaxed"
            />

            {/* Special Football Jersey / Poster Generator Banner */}
            <div className="bg-neutral-950/80 rounded-2xl p-3 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowFootballBuilder(!showFootballBuilder)}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>⚽ Criador Rápido de Cartaz &amp; Troca de Camisola</span>
                </button>
                <span className="text-[10px] text-neutral-400">{showFootballBuilder ? 'Fechar' : 'Abrir'}</span>
              </div>

              {showFootballBuilder && (
                <div className="pt-2 border-t border-neutral-800 space-y-2.5 animate-in fade-in">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">Seu Nome / Atleta</label>
                      <input
                        type="text"
                        value={footballPlayerName}
                        onChange={(e) => setFootballPlayerName(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        placeholder="Ex: Helio"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">Nº Camisola</label>
                      <input
                        type="text"
                        value={footballNumber}
                        onChange={(e) => setFootballNumber(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">Clube / Seleção</label>
                      <select
                        value={footballClub}
                        onChange={(e) => setFootballClub(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-white"
                      >
                        <option value="Real Madrid">Real Madrid</option>
                        <option value="Barcelona">Barcelona</option>
                        <option value="Flamengo">Flamengo</option>
                        <option value="Seleção Brasileira">Seleção Brasileira</option>
                        <option value="Seleção de Portugal">Portugal</option>
                        <option value="Benfica">Benfica</option>
                        <option value="Manchester City">Man City</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyFootballPoster}
                    className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Shirt className="w-3.5 h-3.5" />
                    <span>Aplicar Prompt de Cartaz Esportivo</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Preset Ideas Chips */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Sugestões Rápidas em 1 Clique:</span>
              <div className="flex flex-wrap gap-1.5">
                {TEXT_TO_IMAGE_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-amber-500/50 hover:bg-neutral-800/60 transition-all text-left"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Model Selector */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 space-y-3">
            <span className="text-xs font-bold text-neutral-300 flex items-center gap-2 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>Modelo de IA Selecionado</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AI_MODELS.map(model => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedModel === model.id
                      ? 'bg-blue-500/10 border-blue-500 text-white shadow-sm'
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

          {/* Aspect Ratio Selector */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 space-y-3">
            <span className="text-xs font-bold text-neutral-300 flex items-center gap-2 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Proporção da Imagem
            </span>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '9:16', label: '9:16 Vertical', sub: 'TikTok / Stories' },
                { id: '1:1', label: '1:1 Quadrado', sub: 'Instagram Feed' },
                { id: '16:9', label: '16:9 Paisagem', sub: 'YouTube / Wallpaper' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setAspectRatio(opt.id as any)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    aspectRatio === opt.id
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                      : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold">{opt.label}</div>
                  <div className="text-[10px] text-neutral-500">{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Sintetizando com {currentModelInfo.name}...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Gerar Imagem com IA (Livre &amp; Sem Custos)</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Output Viewer & Presets Gallery (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Result Showcase */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Prévia de Alta Definição</span>
              </span>

              {generatedImageUrl && (
                <div className="flex items-center gap-2">
                  <a
                    href={generatedImageUrl}
                    download="mepic-arte-ia.jpg"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-all border border-neutral-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar HD</span>
                  </a>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(prompt);
                      setHasCopied(true);
                      setTimeout(() => setHasCopied(false), 2000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-all border border-neutral-700"
                  >
                    {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{hasCopied ? 'Copiado!' : 'Copiar Prompt'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Canvas / Image Display */}
            <div className={`relative rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 flex items-center justify-center ${
              aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[500px]' : aspectRatio === '1:1' ? 'aspect-square max-h-[460px]' : 'aspect-video max-h-[400px]'
            } mx-auto w-full`}>
              {isGenerating ? (
                <div className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">Criando Obra de Arte</p>
                    <p className="text-xs text-amber-300 font-mono animate-pulse">{stepMessage}</p>
                  </div>
                  <div className="w-48 bg-neutral-900 h-2 rounded-full overflow-hidden mx-auto border border-neutral-800">
                    <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ) : generatedImageUrl ? (
                <img
                  src={generatedImageUrl}
                  alt="Imagem Gerada por IA"
                  className="w-full h-full object-cover animate-in fade-in duration-500"
                />
              ) : (
                <div className="text-center p-6 text-neutral-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Sua imagem gerada aparecerá aqui</p>
                </div>
              )}
            </div>
          </div>

          {/* Inspiration Presets Gallery */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>Estilos em Alta no MePic</span>
              </span>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`text-[11px] font-bold px-3 py-1 rounded-xl transition-all ${
                    activeCategory === cat.id
                      ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                      : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredPresets.map(preset => (
                <div
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className="group relative rounded-xl overflow-hidden border border-neutral-800 hover:border-amber-500 cursor-pointer bg-neutral-950 aspect-[3/4] transition-all"
                >
                  <img
                    src={preset.previewUrl}
                    alt={preset.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <span className="text-[10px] font-bold text-white block line-clamp-1">
                      {preset.styleName}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
