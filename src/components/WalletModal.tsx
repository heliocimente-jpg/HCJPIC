import React, { useState } from 'react';
import { Coins, X, Check, Sparkles, ShieldCheck, Crown, Zap, Flame } from 'lucide-react';
import { Language, UserProfile } from '../types';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onAddTokens: (amount: number, description: string) => void;
  currentLanguage: Language;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  user,
  onAddTokens,
  currentLanguage,
}) => {
  const [modalTab, setModalTab] = useState<'vip' | 'packs'>('vip');
  const [enableFreeTrial, setEnableFreeTrial] = useState(true);
  const [selectedVipPlan, setSelectedVipPlan] = useState<'annual' | 'weekly'>('annual');

  if (!isOpen) return null;

  const packages = [
    {
      id: 'pack_starter',
      tokens: 50,
      bonus: 0,
      price: 'R$ 9,90',
      popular: false,
    },
    {
      id: 'pack_popular',
      tokens: 150,
      bonus: 30,
      price: 'R$ 24,90',
      popular: true,
    },
    {
      id: 'pack_creator',
      tokens: 500,
      bonus: 150,
      price: 'R$ 69,90',
      popular: false,
    },
  ];

  const handlePurchase = (pkg: typeof packages[0]) => {
    const total = pkg.tokens + pkg.bonus;
    onAddTokens(total, `Recarga de Moedas (${pkg.tokens} + ${pkg.bonus} bônus) via Google Play Billing`);
    onClose();
  };

  const handleSubscribeVip = () => {
    if (selectedVipPlan === 'annual') {
      onAddTokens(500, 'Assinatura MePic VIP Anual (+500 Moedas de Boas-Vindas) via Google Play');
    } else {
      onAddTokens(60, 'Assinatura MePic VIP Semanal (+60 Moedas) via Google Play');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>MePic VIP &amp; Carteira</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Google Play 6.0
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                Saldo Atual: <span className="text-amber-300 font-bold font-mono">{user.tokenBalance} Moedas</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector: VIP vs Moedas */}
        <div className="flex p-2 bg-neutral-950 border-b border-neutral-800 gap-2">
          <button
            onClick={() => setModalTab('vip')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              modalTab === 'vip'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Assinatura VIP Ilimitada</span>
          </button>
          <button
            onClick={() => setModalTab('packs')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              modalTab === 'packs'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Pacotes Avulsos</span>
          </button>
        </div>

        {/* Free Unlimited Mode Notice */}
        <div className="bg-emerald-950/40 border-b border-emerald-500/30 px-5 py-3 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-300 block">
              Modo Livre Ativado (Sem Limite de Créditos)
            </span>
            <p className="text-[11px] text-emerald-200/80 leading-tight">
              A componente comercial está em espera. Todas as gerações de fotos, casais, famílias e vídeos estão 100% liberadas sem restrição de saldo!
            </p>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {modalTab === 'vip' ? (
            <div className="space-y-4">
              {/* VIP Benefits Bento */}
              <div className="bg-gradient-to-br from-rose-950/30 via-neutral-950 to-neutral-950 p-4 rounded-2xl border border-rose-500/20 space-y-2.5">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">Vantagens Exclusivas VIP:</span>
                <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Prioridade Máxima na GPU</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Vídeos em 60 FPS 1080p</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Sem Marcas d'água</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Todos os Filtros Liberados</span>
                  </div>
                </div>
              </div>

              {/* Free Trial Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Ativar 3 Dias de Teste Grátis</span>
                    <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-bold">VIP</span>
                  </div>
                  <div className="text-[11px] text-neutral-400">Você não será cobrado se cancelar antes do 3º dia.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableFreeTrial(!enableFreeTrial)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    enableFreeTrial ? 'bg-rose-500' : 'bg-neutral-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      enableFreeTrial ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Plans Options */}
              <div className="space-y-3">
                {/* Plan Annual */}
                <div
                  onClick={() => setSelectedVipPlan('annual')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedVipPlan === 'annual'
                      ? 'border-rose-500 bg-rose-500/10 ring-1 ring-rose-500/30'
                      : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-white">Plano Anual VIP + 500 Moedas</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500 text-white">
                        ECONOMIZE 65%
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      R$ 12,41 / mês (Cobrado R$ 149,00 anualmente)
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-rose-300">R$ 149,00</span>
                    <span className="text-[10px] text-neutral-500 block">/ ano</span>
                  </div>
                </div>

                {/* Plan Weekly */}
                <div
                  onClick={() => setSelectedVipPlan('weekly')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedVipPlan === 'weekly'
                      ? 'border-rose-500 bg-rose-500/10 ring-1 ring-rose-500/30'
                      : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <span className="text-sm font-extrabold text-white">Plano Semanal VIP</span>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      60 Moedas renovadas toda semana
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-white">R$ 19,90</span>
                    <span className="text-[10px] text-neutral-500 block">/ semana</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleSubscribeVip}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-sm shadow-lg shadow-rose-500/25 hover:from-rose-600 hover:to-pink-700 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{enableFreeTrial ? 'Iniciar Teste Grátis de 3 Dias' : 'Desbloquear VIP Agora'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-neutral-300">
                Escolha um pacote de moedas para continuar gerando fotos e vídeos de dança:
              </p>

              <div className="space-y-3">
                {packages.map(pkg => (
                  <div
                    key={pkg.id}
                    onClick={() => handlePurchase(pkg)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      pkg.popular
                        ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30'
                        : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-amber-400 font-bold text-sm">
                        🪙
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-sm">
                            {pkg.tokens} Moedas
                          </span>
                          {pkg.bonus > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-neutral-950">
                              +{pkg.bonus} BÔNUS
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-neutral-400">
                          Rendimento: ~{Math.floor((pkg.tokens + pkg.bonus) / 10)} gerações completas
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-white block">
                        {pkg.price}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        Entrega Imediata
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Banner */}
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center gap-2 text-[11px] text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Faturamento seguro processado pelo Google Play Billing. Livro-razão com proteção contra falhas e estorno automático garantido.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
