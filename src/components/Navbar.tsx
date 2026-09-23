import React, { useState, useEffect } from 'react';
import { Sparkles, Globe, Code2, Smartphone, ShieldCheck, Crown, MessageSquare, Music, FolderDown, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { Language, UserProfile } from '../types';
import { translations } from '../data/i18n';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, User } from '../firebase';

interface NavbarProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  user: UserProfile;
  currentTab: 'app' | 'chat' | 'music' | 'gallery' | 'architecture' | 'wallet';
  onTabChange: (tab: 'app' | 'chat' | 'music' | 'gallery' | 'architecture' | 'wallet') => void;
  onOpenRechargeModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLanguage,
  onLanguageChange,
  user,
  currentTab,
  onTabChange,
  onOpenRechargeModal,
}) => {
  const t = translations[currentLanguage];
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      alert('Erro ao iniciar sessão com o Google: ' + (err?.message || 'Tente novamente'));
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Tagline */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('app')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-neutral-200 to-rose-400 bg-clip-text text-transparent font-['Syne']">
                MePic AI
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wider">
                VEO 3 &amp; LYRIA
              </span>
            </div>
            <p className="text-xs text-neutral-400 hidden sm:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Center Mode Navigation */}
        <nav className="hidden lg:flex items-center gap-1 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800">
          <button
            id="nav-tab-app"
            onClick={() => onTabChange('app')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'app'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Estúdio Foto &amp; Vídeo</span>
          </button>

          <button
            id="nav-tab-chat"
            onClick={() => onTabChange('chat')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'chat'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span>Chat Gemini &amp; Voz</span>
          </button>

          <button
            id="nav-tab-music"
            onClick={() => onTabChange('music')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'music'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Music className="w-4 h-4 text-emerald-400" />
            <span>Música Lyria</span>
          </button>

          <button
            id="nav-tab-gallery"
            onClick={() => onTabChange('gallery')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'gallery'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <FolderDown className="w-4 h-4 text-purple-400" />
            <span>Importar &amp; Exportar</span>
          </button>

          <button
            id="nav-tab-arch"
            onClick={() => onTabChange('architecture')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'architecture'
                ? 'bg-neutral-700 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Arquitetura</span>
          </button>
        </nav>

        {/* Right Actions: Auth, i18n & Unlimited Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Selector */}
          <div className="relative hidden sm:flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1 text-xs">
            <Globe className="w-3.5 h-3.5 text-neutral-400 ml-1 mr-1" />
            <select
              id="language-select"
              value={currentLanguage}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="bg-transparent text-neutral-200 text-xs font-medium focus:outline-none pr-1 cursor-pointer"
            >
              <option value="pt" className="bg-neutral-900 text-white">Português (Padrão)</option>
              <option value="en" className="bg-neutral-900 text-white">English (US)</option>
              <option value="es" className="bg-neutral-900 text-white">Español (ES)</option>
            </select>
          </div>

          {/* Firebase Google Auth */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 p-1 pr-2.5 rounded-xl">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Utilizador'}
                  className="w-7 h-7 rounded-lg object-cover border border-neutral-700"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
              <div className="hidden md:block text-left">
                <span className="text-xs font-bold text-white block leading-tight truncate max-w-[100px]">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono block">Conectado</span>
              </div>
              <button
                onClick={handleSignOut}
                title="Terminar Sessão"
                className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-rose-400 transition-colors ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700/80 hover:border-neutral-600 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-400" />
              <span>Entrar</span>
            </button>
          )}

          {/* Unlimited Free Mode Badge */}
          <button
            id="token-wallet-badge"
            onClick={onOpenRechargeModal}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/50 text-emerald-300 px-2.5 py-1.5 rounded-xl transition-all shadow-sm"
            title="Modo Livre Ativado: Sem limites de créditos"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-black font-mono tracking-tight text-white">
              ∞ Livre
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Submenu Tabs */}
      <div className="lg:hidden flex items-center justify-around border-t border-neutral-800/80 py-2 bg-neutral-900/80 px-2 text-xs overflow-x-auto">
        <button
          onClick={() => onTabChange('app')}
          className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${
            currentTab === 'app' ? 'text-rose-400 bg-rose-500/10' : 'text-neutral-400'
          }`}
        >
          📱 Estúdio
        </button>
        <button
          onClick={() => onTabChange('chat')}
          className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${
            currentTab === 'chat' ? 'text-blue-400 bg-blue-500/10' : 'text-neutral-400'
          }`}
        >
          🤖 Chat Gemini
        </button>
        <button
          onClick={() => onTabChange('music')}
          className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${
            currentTab === 'music' ? 'text-emerald-400 bg-emerald-500/10' : 'text-neutral-400'
          }`}
        >
          🎵 Música
        </button>
        <button
          onClick={() => onTabChange('gallery')}
          className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${
            currentTab === 'gallery' ? 'text-purple-400 bg-purple-500/10' : 'text-neutral-400'
          }`}
        >
          📦 Import / Export
        </button>
        <button
          onClick={() => onTabChange('architecture')}
          className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${
            currentTab === 'architecture' ? 'text-amber-400 bg-amber-500/10' : 'text-neutral-400'
          }`}
        >
          🏗️ Sistema
        </button>
      </div>
    </header>
  );
};
