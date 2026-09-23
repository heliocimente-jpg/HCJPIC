import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ViralDanceVideo } from './components/ViralDanceVideo';
import { HairStyleChanger } from './components/HairStyleChanger';
import { AIPhotoStudio } from './components/AIPhotoStudio';
import { CoupleFamilyStudio } from './components/CoupleFamilyStudio';
import { TextToImageGenerator } from './components/TextToImageGenerator';
import { PhotoEditorStudio } from './components/PhotoEditorStudio';
import { VideoAnimationStudio } from './components/VideoAnimationStudio';
import { GeminiChatStudio } from './components/GeminiChatStudio';
import { MusicStudio } from './components/MusicStudio';
import { GalleryImportExport } from './components/GalleryImportExport';
import { ArchitectureView } from './components/ArchitectureView';
import { LedgerView } from './components/LedgerView';
import { WalletModal } from './components/WalletModal';
import { Language, UserProfile, TokenTransaction, CreationItem } from './types';
import { translations } from './data/i18n';
import { loadUserCreationsFromFirestore, auth, onAuthStateChanged } from './firebase';
import { Film, Scissors, ShieldCheck, Code2, Sparkles, Smartphone, Wand2, Heart, Palette, Sliders, Video, CheckCircle2, MessageSquare, Music, FolderDown } from 'lucide-react';

const INITIAL_CREATIONS: CreationItem[] = [
  {
    id: 'demo_vid_01',
    type: 'video',
    feature: 'video_animation',
    title: 'Dança Viral: Trend TikTok & Funk',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-dancing-in-a-studio-41130-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=600&auto=format&fit=crop&q=80',
    modelUsed: 'Google Veo 3 (veo-3.1-fast-generate-preview)',
    createdAt: 'Hoje às 11:20',
    promptOrStyle: '9:16 • Dança urbana sincronizada 60 FPS',
  },
  {
    id: 'demo_img_01',
    type: 'image',
    feature: 'text_to_image',
    title: 'Astronauta no Deserto de Marte 8K',
    mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    modelUsed: 'Google Gemini Flash Image',
    createdAt: 'Hoje às 10:45',
    promptOrStyle: 'Astronauta explorador caminhando sobre a areia vermelha de Marte, 8K ultra nítido',
  },
  {
    id: 'demo_audio_01',
    type: 'audio',
    feature: 'music',
    title: 'Bossa Nova Sunset Lounge',
    mediaUrl: 'https://cdn.freesound.org/previews/612/612095_5674468-lq.mp3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    modelUsed: 'Lyria Music Engine',
    createdAt: 'Hoje às 09:30',
    promptOrStyle: 'Bossa nova relaxante com violão de nylon acústico e percussão suave',
  },
];

export default function App() {
  // Baseline Language: Portuguese
  const [currentLanguage, setCurrentLanguage] = useState<Language>('pt');
  
  // Navigation Tabs
  const [currentTab, setCurrentTab] = useState<'app' | 'chat' | 'music' | 'gallery' | 'architecture' | 'wallet'>('app');
  
  // App Clone Sub-Tabs: 'couple_family' | 'video_animation' | 'text_to_image' | 'photo_editor' | 'dance' | 'hair' | 'studio'
  const [activeAppFeature, setActiveAppFeature] = useState<
    'couple_family' | 'video_animation' | 'text_to_image' | 'photo_editor' | 'dance' | 'hair' | 'studio'
  >('video_animation');

  // Recharge Modal
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [savedNotification, setSavedNotification] = useState<string | null>(null);

  // Creations Gallery State
  const [creations, setCreations] = useState<CreationItem[]>(() => {
    try {
      const stored = localStorage.getItem('mepic_creations');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
    return INITIAL_CREATIONS;
  });

  // User State - 100% Free Unlimited Mode
  const [user, setUser] = useState<UserProfile>({
    id: 'usr_89234fd9_b12e',
    name: 'Helio Cimente',
    email: 'heliocimente@gmail.com',
    language: 'pt',
    tokenBalance: 9999,
    subscriptionTier: 'creator_annual',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    isUnlimitedFreeMode: true,
  });

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser((prev) => ({
          ...prev,
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Utilizador MePic',
          email: firebaseUser.email || prev.email,
          avatarUrl: firebaseUser.photoURL || prev.avatarUrl,
        }));
        // Load cloud creations for this user
        try {
          const cloudItems = await loadUserCreationsFromFirestore(firebaseUser.uid);
          if (cloudItems.length > 0) {
            setCreations((prev) => {
              const combined = [...cloudItems, ...prev];
              return Array.from(new Map(combined.map((item) => [item.id, item])).values());
            });
          }
        } catch (e) {
          console.warn('Firestore load on auth change:', e);
        }
      }
    });
    return () => unsub();
  }, []);

  const handleCreationSaved = (item: CreationItem) => {
    setCreations((prev) => [item, ...prev]);
    setSavedNotification(`Salvo na sua galeria: "${item.title}"`);
    setTimeout(() => setSavedNotification(null), 3500);
  };

  // Token Transaction Ledger
  const [transactions, setTransactions] = useState<TokenTransaction[]>([
    {
      id: 'tx_init_grant_01',
      userId: 'usr_89234fd9_b12e',
      amount: 9999,
      balanceAfter: 9999,
      type: 'subscription_grant',
      description: 'Modo Livre Ativado: Acesso Ilimitado Grátis a Veo 3, Lyria, Gemini Chat e Foto',
      createdAt: 'Hoje às 10:00',
    }
  ]);

  const t = translations[currentLanguage];

  // Token Deduction Handler: In Free Mode, it always succeeds without blocking
  const handleDeductTokens = (amount: number, description: string): boolean => {
    const newTx: TokenTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user.id,
      amount: 0,
      balanceAfter: user.tokenBalance,
      type: 'bonus',
      description: `${description} [100% Grátis - Modo Livre Ilimitado]`,
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setTransactions(prev => [newTx, ...prev]);
    return true;
  };

  const handleRefundTokens = (amount: number, reason: string) => {
    const refundTx: TokenTransaction = {
      id: `refund_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user.id,
      amount: 0,
      balanceAfter: user.tokenBalance,
      type: 'refund',
      description: `${reason} [Modo Livre - Estorno Simulado]`,
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setTransactions(oldTx => [refundTx, ...oldTx]);
  };

  const handleAddTokens = (amount: number, description: string) => {
    const newBalance = user.tokenBalance + amount;
    setUser(prev => ({ ...prev, tokenBalance: newBalance }));

    const newTx: TokenTransaction = {
      id: `tx_buy_${Date.now()}`,
      userId: user.id,
      amount,
      balanceAfter: newBalance,
      type: 'purchase',
      description,
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setTransactions(prev => [newTx, ...prev]);
  };

  const handleRunStressTest = async (): Promise<{ successCount: number; rejectedCount: number; logs: string[] }> => {
    const requestsCount = 5;
    const requestCost = 10;
    const logs: string[] = [];

    let currentSimulatedBalance = user.tokenBalance;
    let successes = 0;
    let rejected = 0;

    const tasks = Array.from({ length: requestsCount }).map((_, index) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          if (currentSimulatedBalance >= requestCost) {
            currentSimulatedBalance -= requestCost;
            successes++;
            logs.push(`Thread #${index + 1}: [SUCESSO] Lock adquirido. 10 tokens deduzidos. Saldo restante: ${currentSimulatedBalance}`);
          } else {
            rejected++;
            logs.push(`Thread #${index + 1}: [REJEITADO 402] Falha de validação: Saldo insuficiente. Rollback efetuado.`);
          }
          resolve();
        }, Math.random() * 200);
      });
    });

    await Promise.all(tasks);
    setUser(prev => ({ ...prev, tokenBalance: currentSimulatedBalance }));
    return { successCount: successes, rejectedCount: rejected, logs };
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        user={user}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenRechargeModal={() => setIsWalletModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* VIEW: CREATIVE STUDIO (Photo & Video) */}
        {currentTab === 'app' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Quick Feature Switcher Bar */}
            <div className="bg-neutral-950/80 p-2 rounded-2xl border border-neutral-800/80 shadow-inner">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {/* 1. Vídeo & Animação Veo 3 */}
                <button
                  id="tab-video-animation"
                  onClick={() => setActiveAppFeature('video_animation')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    activeAppFeature === 'video_animation'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  <Video className="w-4 h-4 text-emerald-300" />
                  <span>Vídeo Veo 3 (16:9 &amp; 9:16)</span>
                </button>

                {/* 2. Gerador de Imagem IA (Criar & Editar) */}
                <button
                  id="tab-text-to-image"
                  onClick={() => setActiveAppFeature('text_to_image')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    activeAppFeature === 'text_to_image'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  <Palette className="w-4 h-4 text-amber-300" />
                  <span>Criar &amp; Editar Imagens</span>
                </button>

                {/* 3. Casal, Bebé & Família IA */}
                <button
                  id="tab-couple-family"
                  onClick={() => setActiveAppFeature('couple_family')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    activeAppFeature === 'couple_family'
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/20'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  <Heart className="w-4 h-4 text-rose-300" />
                  <span>Casal, Bebé &amp; Família</span>
                </button>

                {/* 4. Editor de Fotos & Retoque */}
                <button
                  id="tab-photo-editor"
                  onClick={() => setActiveAppFeature('photo_editor')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    activeAppFeature === 'photo_editor'
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  <Sliders className="w-4 h-4 text-purple-300" />
                  <span>Editor &amp; Filtros</span>
                </button>

                {/* 5. Dança Viral Original */}
                <button
                  id="tab-viral-dance"
                  onClick={() => setActiveAppFeature('dance')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    activeAppFeature === 'dance'
                      ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/20'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  <Film className="w-4 h-4" />
                  <span>Dança Viral</span>
                </button>

                {/* 6. Cabelo & Estilo */}
                <button
                  id="tab-hair-style"
                  onClick={() => setActiveAppFeature('hair')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    activeAppFeature === 'hair'
                      ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  <Scissors className="w-4 h-4" />
                  <span>Cabelo &amp; Barba</span>
                </button>

                {/* 7. Estúdio de Avatares */}
                <button
                  id="tab-ai-studio"
                  onClick={() => setActiveAppFeature('studio')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    activeAppFeature === 'studio'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  <Wand2 className="w-4 h-4" />
                  <span>Avatares Retrô</span>
                </button>
              </div>
            </div>

            {/* Render Selected Feature */}
            {activeAppFeature === 'video_animation' ? (
              <VideoAnimationStudio
                user={user}
                language={currentLanguage}
                onCreationSaved={handleCreationSaved}
              />
            ) : activeAppFeature === 'text_to_image' ? (
              <TextToImageGenerator
                user={user}
                language={currentLanguage}
                onCreationSaved={handleCreationSaved}
              />
            ) : activeAppFeature === 'couple_family' ? (
              <CoupleFamilyStudio
                user={user}
                language={currentLanguage}
              />
            ) : activeAppFeature === 'photo_editor' ? (
              <PhotoEditorStudio
                user={user}
                language={currentLanguage}
                onCreationSaved={handleCreationSaved}
              />
            ) : activeAppFeature === 'dance' ? (
              <ViralDanceVideo
                currentLanguage={currentLanguage}
                user={user}
                onDeductTokens={handleDeductTokens}
                onRefundTokens={handleRefundTokens}
                onOpenRechargeModal={() => setIsWalletModalOpen(true)}
              />
            ) : activeAppFeature === 'hair' ? (
              <HairStyleChanger
                currentLanguage={currentLanguage}
                user={user}
                onDeductTokens={handleDeductTokens}
                onOpenRechargeModal={() => setIsWalletModalOpen(true)}
              />
            ) : (
              <AIPhotoStudio
                user={user}
                onDeductTokens={handleDeductTokens}
                onRefundTokens={handleRefundTokens}
                onOpenRecharge={() => setIsWalletModalOpen(true)}
                language={currentLanguage}
              />
            )}

            {/* Saved Notification Toast */}
            {savedNotification && (
              <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-emerald-500/50 shadow-2xl shadow-emerald-500/20 text-white px-4 py-3 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-300">Sucesso na Criação IA</p>
                  <p className="text-[11px] text-neutral-300">{savedNotification}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW: GEMINI MULTIMODAL CHAT & LIVE VOICE */}
        {currentTab === 'chat' && (
          <GeminiChatStudio user={user} language={currentLanguage} />
        )}

        {/* VIEW: LYRIA MUSIC STUDIO */}
        {currentTab === 'music' && (
          <MusicStudio
            user={user}
            language={currentLanguage}
            onCreationSaved={handleCreationSaved}
          />
        )}

        {/* VIEW: IMPORT & EXPORT GALLERY */}
        {currentTab === 'gallery' && (
          <GalleryImportExport
            user={user}
            language={currentLanguage}
            creations={creations}
            onCreationsUpdate={setCreations}
          />
        )}

        {/* VIEW: ARCHITECTURE & SYSTEM BLUEPRINT */}
        {currentTab === 'architecture' && (
          <ArchitectureView currentLanguage={currentLanguage} />
        )}

        {/* VIEW: WALLET & ANTI-RACE LEDGER */}
        {currentTab === 'wallet' && (
          <LedgerView
            currentLanguage={currentLanguage}
            user={user}
            transactions={transactions}
            onAddTokens={handleAddTokens}
            onRunStressTest={handleRunStressTest}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-8 px-4 text-center text-xs text-neutral-500 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-neutral-400">
          <button onClick={() => setCurrentTab('app')} className="hover:text-white">Estúdio IA</button>
          <span>•</span>
          <button onClick={() => setCurrentTab('chat')} className="hover:text-blue-400">Chat Gemini 2.5</button>
          <span>•</span>
          <button onClick={() => setCurrentTab('music')} className="hover:text-emerald-400">Música Lyria</button>
          <span>•</span>
          <button onClick={() => setCurrentTab('gallery')} className="hover:text-purple-400">Importar &amp; Exportar</button>
          <span>•</span>
          <button onClick={() => setCurrentTab('architecture')} className="hover:text-amber-400">Arquitetura Lead</button>
        </div>
        <p className="max-w-2xl mx-auto text-[11px] text-neutral-600 pt-1">
          MePic AI • Motores integrados: Google Veo 3, Gemini 2.5 Flash, Imagen 3 / Flash Image, Lyria Music e Live API.
        </p>
      </footer>

      {/* Wallet Top-Up Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        user={user}
        onAddTokens={handleAddTokens}
        currentLanguage={currentLanguage}
      />
    </div>
  );
}
