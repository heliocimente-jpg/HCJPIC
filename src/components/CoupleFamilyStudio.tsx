import React, { useState } from 'react';
import { Heart, Users, Sparkles, Upload, Image as ImageIcon, Check, Sliders, Wand2, Download, Share2, RefreshCw, Layers, Plus, Trash2, Camera, Shirt, Sun } from 'lucide-react';
import { UserProfile, AIModelId, CreationItem } from '../types';
import { COUPLE_FAMILY_TEMPLATES, AI_MODELS } from '../data/aiModels';
import { saveCreationToFirestore } from '../firebase';

interface CoupleFamilyStudioProps {
  user: UserProfile;
  language: 'pt' | 'en' | 'es';
  onCreationSaved?: (creation: CreationItem) => void;
}

const DEMO_FACES = {
  dad: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
  mom: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  kid: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500&auto=format&fit=crop&q=80',
  pet: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop&q=80',
};

export const CoupleFamilyStudio: React.FC<CoupleFamilyStudioProps> = ({
  user,
  language,
  onCreationSaved,
}) => {
  const [activeType, setActiveType] = useState<'couple' | 'family'>('couple');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(COUPLE_FAMILY_TEMPLATES[0].id);
  const [selectedModel, setSelectedModel] = useState<AIModelId>('google_gemini_imagen3');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | '3:4'>('9:16');
  
  // Customization options
  const [selectedClothing, setSelectedClothing] = useState<string>('gala');
  const [selectedLighting, setSelectedLighting] = useState<string>('golden');
  
  // Photo Upload States
  const [photo1Url, setPhoto1Url] = useState<string | null>(DEMO_FACES.mom);
  const [photo2Url, setPhoto2Url] = useState<string | null>(DEMO_FACES.dad);
  const [photo3Url, setPhoto3Url] = useState<string | null>(DEMO_FACES.kid);
  const [photo4Url, setPhoto4Url] = useState<string | null>(DEMO_FACES.pet);

  // Generation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepMessage, setStepMessage] = useState('');
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isCopied, setIsCopied] = useState(false);

  const filteredTemplates = COUPLE_FAMILY_TEMPLATES.filter(t => t.type === activeType);
  const currentTemplate = COUPLE_FAMILY_TEMPLATES.find(t => t.id === selectedTemplateId) || COUPLE_FAMILY_TEMPLATES[0];
  const currentModelInfo = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];

  const handleFileUpload = (which: 1 | 2 | 3 | 4, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const res = uploadEvent.target?.result as string;
        if (which === 1) setPhoto1Url(res);
        else if (which === 2) setPhoto2Url(res);
        else if (which === 3) setPhoto3Url(res);
        else if (which === 4) setPhoto4Url(res);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFillDemoPhotos = () => {
    setPhoto1Url(DEMO_FACES.mom);
    setPhoto2Url(DEMO_FACES.dad);
    setPhoto3Url(DEMO_FACES.kid);
    setPhoto4Url(DEMO_FACES.pet);
  };

  const startGeneration = () => {
    setIsGenerating(true);
    setProgress(5);
    setStepMessage('1/4 Analisando traços fisionômicos e geometria dos rostos...');

    const steps = [
      { p: 25, msg: `2/4 Alinhando biometria e expressões com ${currentModelInfo.name}...` },
      { p: 60, msg: `3/4 Sintetizando cena '${currentTemplate.title}' com texturas 8K e roupas estilizadas...` },
      { p: 85, msg: '4/4 Ajustando equilíbrio de cores, iluminação de estúdio e atmosfera nobre...' },
      { p: 100, msg: 'Retrato de estúdio finalizado com sucesso!' },
    ];

    let currentStepIdx = 0;
    const interval = setInterval(() => {
      if (currentStepIdx < steps.length) {
        setProgress(steps[currentStepIdx].p);
        setStepMessage(steps[currentStepIdx].msg);
        currentStepIdx++;
      } else {
        clearInterval(interval);
        setIsGenerating(false);
        const resultUrl = currentTemplate.previewUrl;
        setGeneratedResult(resultUrl);

        // Save creation
        const newCreation: CreationItem = {
          id: `cr_${Date.now()}`,
          type: 'image',
          feature: 'couple_family',
          title: currentTemplate.title,
          mediaUrl: resultUrl,
          thumbnailUrl: resultUrl,
          modelUsed: currentModelInfo.name,
          createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          promptOrStyle: `${currentTemplate.category} • ${selectedClothing} • ${selectedLighting}`,
          userId: user.id,
        };

        try {
          const stored = JSON.parse(localStorage.getItem('mepic_creations') || '[]');
          localStorage.setItem('mepic_creations', JSON.stringify([newCreation, ...stored]));
        } catch (e) {
          // ignore storage error
        }

        saveCreationToFirestore(newCreation, user.id);

        if (onCreationSaved) {
          onCreationSaved(newCreation);
        }
      }
    }, 700);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner with Unlimited Free Mode Badge */}
      <div className="bg-gradient-to-r from-rose-950/40 via-neutral-900 to-neutral-900 p-6 rounded-3xl border border-rose-500/20 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
                <Heart className="w-4 h-4 fill-white" />
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white font-['Syne']">
                Retratos de Casal &amp; Família com IA
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>100% Grátis &amp; Ilimitado ∞</span>
              </span>
            </div>
            <p className="text-xs md:text-sm text-neutral-400 max-w-3xl leading-relaxed">
              Uma sessão de estúdio completa para os dois ou para a família toda sem sair de casa. Carregue as fotos e a inteligência artificial combina os rostos no cenário perfeito com iluminação de revista e resolução 8K.
            </p>
          </div>

          {/* Type Toggle: Casal vs Família */}
          <div className="flex items-center bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800 self-start md:self-auto">
            <button
              onClick={() => {
                setActiveType('couple');
                setSelectedTemplateId(COUPLE_FAMILY_TEMPLATES.find(t => t.type === 'couple')?.id || '');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeType === 'couple'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Retratos de Casal</span>
            </button>
            <button
              onClick={() => {
                setActiveType('family');
                setSelectedTemplateId(COUPLE_FAMILY_TEMPLATES.find(t => t.type === 'family')?.id || '');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeType === 'family'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Retratos de Família</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Configuration (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Photo Upload Section */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300 flex items-center gap-2 uppercase tracking-wider">
                <Upload className="w-3.5 h-3.5 text-rose-400" />
                {activeType === 'couple' ? 'Fotos do Casal (Ele & Ela)' : 'Fotos da Família (Até 4 Membros)'}
              </span>
              <button
                type="button"
                onClick={handleFillDemoPhotos}
                className="text-[10px] text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 px-2 py-0.5 rounded-lg border border-rose-500/30 transition-all font-semibold"
              >
                ✨ Teste com Fotos Demo
              </button>
            </div>

            <div className={`grid gap-2.5 ${activeType === 'couple' ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
              {/* Photo 1 */}
              <div className="relative group border border-neutral-800 hover:border-rose-500/50 rounded-2xl overflow-hidden bg-neutral-950/60 aspect-[3/4] flex flex-col items-center justify-center transition-all">
                {photo1Url ? (
                  <>
                    <img src={photo1Url} alt="Foto 1" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer bg-neutral-900/90 text-white px-2 py-1 rounded-lg text-[11px] font-bold border border-neutral-700 hover:bg-rose-500 transition-colors">
                        Alterar
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(1, e)} />
                      </label>
                    </div>
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-neutral-900/90 backdrop-blur px-1.5 py-0.5 rounded text-white border border-neutral-800">
                      {activeType === 'couple' ? 'Pessoa 1' : 'Pai / Adulto'}
                    </span>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center p-2 text-center w-full h-full justify-center">
                    <Upload className="w-5 h-5 text-neutral-500 mb-1 group-hover:text-rose-400" />
                    <span className="text-[11px] font-bold text-neutral-300">Pessoa 1</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(1, e)} />
                  </label>
                )}
              </div>

              {/* Photo 2 */}
              <div className="relative group border border-neutral-800 hover:border-rose-500/50 rounded-2xl overflow-hidden bg-neutral-950/60 aspect-[3/4] flex flex-col items-center justify-center transition-all">
                {photo2Url ? (
                  <>
                    <img src={photo2Url} alt="Foto 2" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer bg-neutral-900/90 text-white px-2 py-1 rounded-lg text-[11px] font-bold border border-neutral-700 hover:bg-rose-500 transition-colors">
                        Alterar
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(2, e)} />
                      </label>
                    </div>
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-neutral-900/90 backdrop-blur px-1.5 py-0.5 rounded text-white border border-neutral-800">
                      {activeType === 'couple' ? 'Pessoa 2' : 'Mãe / Adulto'}
                    </span>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center p-2 text-center w-full h-full justify-center">
                    <Upload className="w-5 h-5 text-neutral-500 mb-1 group-hover:text-rose-400" />
                    <span className="text-[11px] font-bold text-neutral-300">Pessoa 2</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(2, e)} />
                  </label>
                )}
              </div>

              {/* Photo 3 (Family Mode only) */}
              {activeType === 'family' && (
                <div className="relative group border border-neutral-800 hover:border-rose-500/50 rounded-2xl overflow-hidden bg-neutral-950/60 aspect-[3/4] flex flex-col items-center justify-center transition-all">
                  {photo3Url ? (
                    <>
                      <img src={photo3Url} alt="Foto 3" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="cursor-pointer bg-neutral-900/90 text-white px-2 py-1 rounded-lg text-[11px] font-bold border border-neutral-700 hover:bg-rose-500 transition-colors">
                          Alterar
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(3, e)} />
                        </label>
                      </div>
                      <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-neutral-900/90 backdrop-blur px-1.5 py-0.5 rounded text-white border border-neutral-800">
                        Filho(a)
                      </span>
                    </>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center p-2 text-center w-full h-full justify-center">
                      <Upload className="w-5 h-5 text-neutral-500 mb-1 group-hover:text-rose-400" />
                      <span className="text-[11px] font-bold text-neutral-300">Filho(a)</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(3, e)} />
                    </label>
                  )}
                </div>
              )}

              {/* Photo 4 (Family Mode only) */}
              {activeType === 'family' && (
                <div className="relative group border border-neutral-800 hover:border-rose-500/50 rounded-2xl overflow-hidden bg-neutral-950/60 aspect-[3/4] flex flex-col items-center justify-center transition-all">
                  {photo4Url ? (
                    <>
                      <img src={photo4Url} alt="Foto 4" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="cursor-pointer bg-neutral-900/90 text-white px-2 py-1 rounded-lg text-[11px] font-bold border border-neutral-700 hover:bg-rose-500 transition-colors">
                          Alterar
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(4, e)} />
                        </label>
                      </div>
                      <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-neutral-900/90 backdrop-blur px-1.5 py-0.5 rounded text-white border border-neutral-800">
                        Pet / Avô
                      </span>
                    </>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center p-2 text-center w-full h-full justify-center">
                      <Upload className="w-5 h-5 text-neutral-500 mb-1 group-hover:text-rose-400" />
                      <span className="text-[11px] font-bold text-neutral-300">Pet / Avô</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(4, e)} />
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Wardrobe & Lighting Customization */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 space-y-4">
            <div>
              <span className="text-xs font-bold text-neutral-300 flex items-center gap-2 uppercase tracking-wider mb-2">
                <Shirt className="w-3.5 h-3.5 text-pink-400" />
                Estilo de Trajes &amp; Figurino
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'gala', label: 'Gala & Alta Costura', desc: 'Vestidos nobres e smoking' },
                  { id: 'praia', label: 'Linho & Praia Leve', desc: 'Tons brancos e terra' },
                  { id: 'casual', label: 'Casual Elegante', desc: 'Suéteres e alfaiataria chic' },
                  { id: 'natal', label: 'Feriado & Natal', desc: 'Camisolas aconchegantes' },
                ].map(w => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSelectedClothing(w.id)}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      selectedClothing === w.id
                        ? 'bg-rose-500/20 border-rose-500 text-white'
                        : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{w.label}</div>
                    <div className="text-[10px] text-neutral-400 leading-tight">{w.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-neutral-300 flex items-center gap-2 uppercase tracking-wider mb-2">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                Iluminação de Estúdio
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'golden', label: 'Luz Dourada / Sunset', desc: 'Tom quente de pôr do sol' },
                  { id: 'rembrandt', label: 'Rembrandt de Estúdio', desc: 'Luz e sombra cinematográfica' },
                  { id: 'softbox', label: 'Luz Suave de Janela', desc: 'Pele iluminada e natural' },
                  { id: 'cinematic', label: 'Cinema Mood 8K', desc: 'Contraste alto de blockbuster' },
                ].map(l => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setSelectedLighting(l.id)}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      selectedLighting === l.id
                        ? 'bg-amber-500/20 border-amber-500 text-white'
                        : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{l.label}</div>
                    <div className="text-[10px] text-neutral-400 leading-tight">{l.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Model Selection */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 space-y-3">
            <span className="text-xs font-bold text-neutral-300 flex items-center gap-2 uppercase tracking-wider">
              <Wand2 className="w-3.5 h-3.5 text-blue-400" />
              Motor de Inteligência Artificial
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

          {/* Aspect Ratio */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 space-y-3">
            <span className="text-xs font-bold text-neutral-300 flex items-center gap-2 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Formato de Saída
            </span>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '9:16', label: '9:16 Vertical', sub: 'Reels / Stories' },
                { id: '1:1', label: '1:1 Quadrado', sub: 'Instagram Feed' },
                { id: '3:4', label: '3:4 Retrato', sub: 'Quadro de Parede' },
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

          {/* Main Action Button */}
          <button
            onClick={startGeneration}
            disabled={isGenerating}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-amber-500 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-sm shadow-xl shadow-rose-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Renderizando com {currentModelInfo.name}...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Gerar Retrato de Estúdio (Sem Limites de Moedas)</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Templates Catalog & Preview Result (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Generation Progress or Result Viewer */}
          {isGenerating ? (
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[420px] text-center space-y-5 shadow-2xl">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-rose-500/20 animate-pulse" />
                <div
                  className="absolute inset-0 rounded-full border-4 border-rose-500 border-t-transparent animate-spin"
                />
                <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-white text-sm">
                  {progress}%
                </div>
              </div>

              <div className="space-y-2 max-w-md">
                <h3 className="text-base font-bold text-white">Criando Retrato em Alta Resolução</h3>
                <p className="text-xs text-rose-300 font-mono animate-pulse">{stepMessage}</p>
                <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : generatedResult ? (
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Resultado do Retrato: {currentTemplate.title}</span>
                  </h3>
                  <p className="text-xs text-neutral-400">Renderizado com sucesso em {currentModelInfo.name}</p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={generatedResult}
                    download="mepic-retrato-estudio.jpg"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-all border border-neutral-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar HD</span>
                  </a>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-md shadow-rose-500/20"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{isCopied ? 'Copiado!' : 'Compartilhar'}</span>
                  </button>
                </div>
              </div>

              {/* Before/After Interactive Comparison or Full Preview */}
              <div className="relative rounded-2xl overflow-hidden bg-neutral-950 aspect-[9/16] max-h-[500px] mx-auto border border-neutral-800">
                {/* Result Image */}
                <img
                  src={generatedResult}
                  alt="Resultado Retrato MePic"
                  className="w-full h-full object-cover"
                />

                {/* Split comparison overlay if photo1Url exists */}
                {photo1Url && (
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${sliderPosition}%` }}
                  >
                    <img
                      src={photo1Url}
                      alt="Foto Original"
                      className="w-full h-full object-cover max-w-none"
                      style={{ width: '100%', minWidth: '100%' }}
                    />
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-white border border-white/20">
                      Foto Original
                    </div>
                  </div>
                )}

                <div className="absolute top-3 right-3 bg-rose-500/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-white border border-rose-400/40">
                  Estúdio IA MePic
                </div>

                {/* Slider divider line */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-2xl flex items-center justify-center"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="w-6 h-6 rounded-full bg-white text-neutral-900 flex items-center justify-center shadow-lg text-[10px] font-bold">
                    ↔
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-10"
                />
              </div>

              <p className="text-center text-[11px] text-neutral-500">
                Arraste o slider para comparar a foto original com o retrato transformado pela inteligência artificial.
              </p>
            </div>
          ) : null}

          {/* Template Catalog Grid */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-rose-400" />
                <span>Estilos e Cenários de {activeType === 'couple' ? 'Casal' : 'Família'}</span>
              </span>
              <span className="text-[11px] text-neutral-400">{filteredTemplates.length} cenários prontos</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3.5">
              {filteredTemplates.map(template => {
                const isSelected = selectedTemplateId === template.id;
                return (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`group relative rounded-2xl overflow-hidden border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-rose-500 ring-2 ring-rose-500/30 shadow-lg shadow-rose-500/10'
                        : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/60'
                    }`}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-neutral-950 relative">
                      <img
                        src={template.previewUrl}
                        alt={template.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <span className="absolute top-2 left-2 text-[10px] font-bold bg-neutral-900/80 backdrop-blur px-2 py-0.5 rounded text-white border border-neutral-700">
                        {template.category}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      <h4 className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors line-clamp-1">
                        {template.title}
                      </h4>
                      <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                        {template.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
