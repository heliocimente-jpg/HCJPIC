import React, { useState } from 'react';
import { 
  Network, Database, Terminal, Smartphone, HardDrive, 
  Copy, Check, FileCode, Layers, ShieldCheck, Cpu, Coins
} from 'lucide-react';
import { ARCHITECTURE_DATA, ArchitectureSection } from '../data/architectureDocs';
import { Language } from '../types';

interface ArchitectureViewProps {
  currentLanguage: Language;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({ currentLanguage }) => {
  const [activeSectionId, setActiveSectionId] = useState<string>(ARCHITECTURE_DATA[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeSection = ARCHITECTURE_DATA.find(s => s.id === activeSectionId) || ARCHITECTURE_DATA[0];

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Network': return <Network className="w-4 h-4" />;
      case 'Database': return <Database className="w-4 h-4" />;
      case 'Terminal': return <Terminal className="w-4 h-4" />;
      case 'Smartphone': return <Smartphone className="w-4 h-4" />;
      case 'HardDrive': return <HardDrive className="w-4 h-4" />;
      case 'Cpu': return <Cpu className="w-4 h-4" />;
      case 'Coins': return <Coins className="w-4 h-4" />;
      case 'ShieldCheck': return <ShieldCheck className="w-4 h-4" />;
      case 'Layers': return <Layers className="w-4 h-4" />;
      default: return <FileCode className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Blueprint Header */}
      <div className="bg-gradient-to-r from-blue-950/40 via-neutral-900 to-neutral-900 p-6 rounded-2xl border border-blue-500/20 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl md:text-2xl font-extrabold text-white font-['Syne']">
                Arquitetura de Produção: MePic AI Clone
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Lead Architect Specification
              </span>
            </div>
            <p className="text-sm text-neutral-400 max-w-3xl">
              Documentação técnica detalhada, esquemas SQL DDL, serviços em FastAPI/Python com estorno transacional, tela nativa em Flutter/Dart com i18n em Português, workers Celery/Redis, servidor WebSocket, faturamento Google Play/StoreKit, moderação biométrica NSFW, Dockerfile CUDA/NVENC, KEDA Kubernetes autoscaling, pipeline local SDXL InstantID e Onboarding/Paywall dinâmico.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-800/60 font-bold">
              14 Módulos de Engenharia
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-neutral-800 pb-3">
        {ARCHITECTURE_DATA.map(sec => {
          const isActive = activeSectionId === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSectionId(sec.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
              }`}
            >
              {getIcon(sec.icon)}
              <span>{currentLanguage === 'pt' ? sec.titlePt : sec.titleEn}</span>
            </button>
          );
        })}
      </div>

      {/* Active Section Content */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Section Header */}
        <div className="p-6 border-b border-neutral-800 bg-neutral-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {getIcon(activeSection.icon)}
              {currentLanguage === 'pt' ? activeSection.titlePt : activeSection.titleEn}
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-3xl">
              {currentLanguage === 'pt' ? activeSection.summaryPt : activeSection.summaryEn}
            </p>
          </div>

          <button
            onClick={() => handleCopyCode(activeSection.codeSnippet, activeSection.id)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-all shrink-0 self-start md:self-auto"
          >
            {copiedId === activeSection.id ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Código Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-neutral-400" />
                <span>Copiar Código</span>
              </>
            )}
          </button>
        </div>

        {/* Code Snippet Box */}
        <div className="p-6">
          <div className="relative rounded-xl overflow-hidden bg-black/90 border border-neutral-800 font-mono text-xs">
            <div className="flex items-center justify-between px-4 py-2 bg-neutral-900/90 border-b border-neutral-800 text-[11px] text-neutral-400">
              <span className="font-semibold text-neutral-300">
                {activeSection.language.toUpperCase()} • Production-Grade
              </span>
              <span>UTF-8 • Strict Linted</span>
            </div>

            <pre className="p-4 overflow-x-auto text-neutral-200 leading-relaxed font-mono max-h-[500px]">
              <code>{activeSection.codeSnippet}</code>
            </pre>
          </div>
        </div>

        {/* Deep Dive Engineering Breakdown */}
        <div className="p-6 pt-0 border-t border-neutral-800/80 mt-2">
          <div className="bg-neutral-950/60 rounded-xl p-5 border border-neutral-800 text-xs text-neutral-300 space-y-3 leading-relaxed">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Análise Arquitetural &amp; Justificativas Técnicas
            </h4>
            
            <div className="prose prose-invert max-w-none text-xs text-neutral-300 whitespace-pre-line">
              {activeSection.deepDiveMarkdownPt}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
