import React, { useState } from 'react';
import { 
  ShieldCheck, Coins, ArrowDownLeft, ArrowUpRight, 
  RotateCcw, Zap, AlertTriangle, CheckCircle2, Lock, Server
} from 'lucide-react';
import { Language, UserProfile, TokenTransaction } from '../types';
import { translations } from '../data/i18n';

interface LedgerViewProps {
  currentLanguage: Language;
  user: UserProfile;
  transactions: TokenTransaction[];
  onAddTokens: (amount: number, description: string) => void;
  onRunStressTest: () => Promise<{ successCount: number; rejectedCount: number; logs: string[] }>;
}

export const LedgerView: React.FC<LedgerViewProps> = ({
  currentLanguage,
  user,
  transactions,
  onAddTokens,
  onRunStressTest,
}) => {
  const t = translations[currentLanguage];
  const [isTesting, setIsTesting] = useState(false);
  const [stressLogs, setStressLogs] = useState<string[] | null>(null);

  const handleTriggerStressTest = async () => {
    setIsTesting(true);
    setStressLogs(null);
    const result = await onRunStressTest();
    setIsTesting(false);
    setStressLogs(result.logs);
  };

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-900 p-6 rounded-2xl border border-amber-500/20 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl md:text-2xl font-extrabold text-white font-['Syne']">
                {t.wallet.title}
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PostgreSQL ACID Strict
              </span>
            </div>
            <p className="text-sm text-neutral-400 max-w-2xl">
              Livro-razão financeiro de tokens imutável com bloqueio de linha pessimista e garantia absoluta contra gastos duplos.
            </p>
          </div>

          {/* Quick Balance */}
          <div className="bg-neutral-950/80 border border-amber-500/40 px-5 py-3 rounded-2xl flex items-center gap-3">
            <Coins className="w-6 h-6 text-amber-400 animate-bounce" />
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                {t.wallet.currentBalance}
              </span>
              <span className="text-2xl font-extrabold text-white font-mono">
                {user.tokenBalance} <span className="text-xs font-normal text-amber-300">Tokens</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Anti-Race Condition Architecture Explanation & Live Stress Test */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-white mb-1">
              {t.wallet.antiRaceTitle}
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed mb-4">
              {t.wallet.antiRaceDesc}
            </p>

            <div className="bg-black/60 rounded-xl p-3 border border-neutral-800 font-mono text-[11px] text-amber-200/90 space-y-1">
              <p><span className="text-neutral-500">-- Transação Atômica Segura:</span></p>
              <p className="text-emerald-400">BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;</p>
              <p>SELECT token_balance FROM users WHERE id = :user_id <span className="text-amber-400 font-bold">FOR UPDATE</span>;</p>
              <p><span className="text-neutral-500">-- Se token_balance &lt; cost -&gt; ROLLBACK &amp; Retorna HTTP 402</span></p>
              <p>UPDATE users SET token_balance = token_balance - :cost WHERE id = :user_id;</p>
              <p>INSERT INTO token_transactions (...) VALUES (...);</p>
              <p className="text-emerald-400">COMMIT;</p>
            </div>

            {/* Stress Test Action */}
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                id="stress-test-btn"
                onClick={handleTriggerStressTest}
                disabled={isTesting}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-neutral-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all"
              >
                <Zap className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Executando Concorrência Paralela...' : t.wallet.stressTestBtn}</span>
              </button>

              <button
                onClick={() => onAddTokens(20, 'Recarga de Teste (+20 Moedas)')}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-semibold px-3 py-2 rounded-xl text-xs border border-neutral-700 transition-all"
              >
                + Adicionar 20 Tokens de Teste
              </button>
            </div>

            {/* Live Concurrency Stress Output */}
            {stressLogs && (
              <div className="mt-4 bg-neutral-950 border border-amber-500/30 rounded-xl p-4 text-xs font-mono">
                <div className="flex items-center gap-2 text-amber-400 font-bold mb-2">
                  <Server className="w-4 h-4" />
                  <span>{t.wallet.concurrencyResult} (5 Threads Simultâneas):</span>
                </div>
                <div className="space-y-1 text-neutral-300">
                  {stressLogs.map((log, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-neutral-500">[{idx + 1}]</span>
                      <span className={log.includes('SUCESSO') ? 'text-emerald-400' : 'text-rose-400'}>
                        {log}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-4 flex items-center justify-between">
          <span>{t.wallet.historyTitle}</span>
          <span className="text-xs text-neutral-400 font-mono">
            Total de Registros: {transactions.length}
          </span>
        </h3>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 text-xs">
            {t.wallet.historyEmpty}
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/80 overflow-hidden">
            {transactions.map((tx) => {
              const isDeduction = tx.type === 'deduction';
              const isRefund = tx.type === 'refund';

              return (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isDeduction
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : isRefund
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {isDeduction ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : isRefund ? (
                        <RotateCcw className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {tx.description}
                      </p>
                      <p className="text-[10px] text-neutral-500 font-mono">
                        {tx.createdAt} • ID: {tx.id.substring(0, 8)}...
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs font-bold font-mono ${
                      isDeduction ? 'text-rose-400' : isRefund ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Tokens
                    </span>
                    <span className="block text-[10px] text-neutral-400 font-mono">
                      Saldo: {tx.balanceAfter}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Subscription Plans */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-4">
          {t.wallet.plansTitle}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              id: 'pro_weekly',
              title: 'Plano Pro Semanal',
              price: t.wallet.perWeek,
              tokens: '60 Moedas / semana',
              features: ['Gerações HD 1080p', 'Fila Prioritária de GPU', 'Sem marca d\'água'],
              popular: false,
            },
            {
              id: 'vip_monthly',
              title: 'VIP Mensal Recomendado',
              price: t.wallet.perMonth,
              tokens: '300 Moedas / mês',
              features: ['Acesso Ilimitado a Estilos', 'Exportação 60 FPS H.264', 'Suporte Prioritário VIP', 'Geração Turbo (15s)'],
              popular: true,
            },
            {
              id: 'creator_annual',
              title: 'Criador Anual',
              price: t.wallet.perYear,
              tokens: '4.500 Moedas / ano',
              features: ['Economia de 55%', 'Suporte a API Externa', 'Sem expiração de assets (365 dias)'],
              popular: false,
            }
          ].map(plan => (
            <div
              key={plan.id}
              className={`rounded-xl p-5 border relative flex flex-col justify-between ${
                plan.popular
                  ? 'border-rose-500 bg-rose-950/20 ring-1 ring-rose-500/30'
                  : 'border-neutral-800 bg-neutral-950/50'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 right-4 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white shadow">
                  Mais Popular
                </span>
              )}

              <div>
                <h4 className="text-sm font-bold text-white">{plan.title}</h4>
                <div className="text-lg font-extrabold text-white mt-1">{plan.price}</div>
                <div className="text-xs text-amber-300 font-semibold mt-0.5">{plan.tokens}</div>

                <ul className="mt-4 space-y-2 text-xs text-neutral-400">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => onAddTokens(100, `Assinatura ${plan.title} (+100 Tokens)`)}
                className={`mt-5 w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                  plan.popular
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700'
                }`}
              >
                Assinar Agora
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
