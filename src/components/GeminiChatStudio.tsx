import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Mic, MicOff, Search, MapPin, Sparkles, Volume2, VolumeX, RefreshCw, Trash2, Copy, Check, Radio, Cpu, User } from 'lucide-react';
import { UserProfile } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  groundingSources?: { title?: string; uri?: string }[];
}

interface GeminiChatStudioProps {
  user: UserProfile;
  language: 'pt' | 'en' | 'es';
}

export const GeminiChatStudio: React.FC<GeminiChatStudioProps> = ({ user, language }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome_1',
      role: 'assistant',
      content: 'Olá! Sou o seu assistente inteligente MePic. Posso ajudar a criar prompts cinematográficos, dar ideias para vídeos virais, sugerir técnicas de retoque ou pesquisar referências em tempo real. Como posso ajudar hoje?',
      timestamp: 'Agora',
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Model & Roles
  const [selectedModel, setSelectedModel] = useState<'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite'>('gemini-3.5-flash');
  const [selectedRole, setSelectedRole] = useState<'creative_director' | 'photo_editor' | 'video_producer' | 'general'>('creative_director');

  // Grounding Toggles
  const [useSearchGrounding, setUseSearchGrounding] = useState(false);
  const [useMapsGrounding, setUseMapsGrounding] = useState(false);

  // Transcription State (gemini-3.5-transcribe)
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Live API Voice State (gemini-3.8-live)
  const [isLiveActive, setIsLiveActive] = useState(false);
  const liveWsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const [liveStatus, setLiveStatus] = useState<string>('Desconectado');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Clean up Live session on unmount
  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Audio Transcription with gemini-3.5-transcribe
  // ---------------------------------------------------------------------------
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        await handleTranscribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Microphone error:', err);
      alert('Não foi possível aceder ao microfone: ' + (err?.message || 'Permissão negada'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscribeAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const res = await fetch('/api/transcribe-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioBase64: base64Audio, mimeType: 'audio/webm' }),
        });
        const data = await res.json();
        if (data.transcription) {
          setInputPrompt((prev) => (prev ? `${prev} ${data.transcription}` : data.transcription));
        }
        setIsTranscribing(false);
      };
    } catch (err) {
      console.error('Transcription error:', err);
      setIsTranscribing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Live Voice Conversation with gemini-3.8-live
  // ---------------------------------------------------------------------------
  const startLiveSession = async () => {
    try {
      setLiveStatus('Conectando ao Live API...');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      liveWsRef.current = ws;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;

      ws.onopen = async () => {
        setLiveStatus('Voz Ativa (Fale no microfone)');
        setIsLiveActive(true);

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const inputData = e.inputBuffer.getChannelData(0);
          // Convert Float32Array to 16-bit PCM
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          // Convert PCM bytes to Base64
          let binary = '';
          const bytes = new Uint8Array(pcmData.buffer);
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64Audio = btoa(binary);
          ws.send(JSON.stringify({ audio: base64Audio }));
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.audio) {
            // Play received base64 PCM 24kHz audio
            playPcmAudioChunk(data.audio, outputCtx);
          }
        } catch (e) {
          console.error('Error handling live message:', e);
        }
      };

      ws.onclose = () => {
        stopLiveSession();
        setLiveStatus('Desconectado');
      };

      ws.onerror = (err) => {
        console.error('Live WS error:', err);
        stopLiveSession();
        setLiveStatus('Erro na conexão');
      };
    } catch (err: any) {
      console.error('Failed to start Live session:', err);
      alert('Erro ao iniciar voz ao vivo: ' + (err?.message || ''));
      stopLiveSession();
    }
  };

  const playPcmAudioChunk = (base64Audio: string, ctx: AudioContext) => {
    try {
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }
      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
    } catch (err) {
      console.error('Error decoding live audio:', err);
    }
  };

  const stopLiveSession = () => {
    setIsLiveActive(false);
    setLiveStatus('Desconectado');
    if (liveWsRef.current) {
      liveWsRef.current.close();
      liveWsRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }
  };

  // ---------------------------------------------------------------------------
  // Multi-Turn Chat Submit
  // ---------------------------------------------------------------------------
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputPrompt.trim(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          model: selectedModel,
          role: selectedRole,
          useSearchGrounding,
          useMapsGrounding,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao obter resposta');
      }

      // Extract grounding sources if available
      let groundingSources: { title?: string; uri?: string }[] = [];
      if (data.groundingMetadata?.groundingChunks) {
        groundingSources = data.groundingMetadata.groundingChunks
          .map((chunk: any) => ({
            title: chunk.web?.title,
            uri: chunk.web?.uri,
          }))
          .filter((s: any) => s.uri);
      }

      const assistantMessage: Message = {
        id: `msg_res_${Date.now()}`,
        role: 'assistant',
        content: data.text || 'Sem resposta do modelo.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Desculpe, ocorreu um erro: ${err?.message || 'Verifique sua conexão.'}`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-neutral-900 p-6 rounded-3xl border border-blue-500/20 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Bot className="w-4 h-4" />
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white font-['Syne']">
                Assistente Criativo &amp; Chat Gemini
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-400" />
                <span>Multi-Turn &amp; Grounding</span>
              </span>
            </div>
            <p className="text-xs md:text-sm text-neutral-400 max-w-3xl leading-relaxed">
              Converse em tempo real com os modelos mais avançados de Gemini. Use transcrição por microfone, grounded search no Google e Google Maps, ou ative a voz em direto com o Gemini Live API.
            </p>
          </div>

          {/* Live Voice Button */}
          <div className="shrink-0 flex items-center gap-2">
            {isLiveActive ? (
              <button
                onClick={stopLiveSession}
                className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-2 animate-pulse"
              >
                <Radio className="w-4 h-4 text-rose-400" />
                <span>Encerrar Voz Live ({liveStatus})</span>
              </button>
            ) : (
              <button
                onClick={startLiveSession}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25"
              >
                <Radio className="w-4 h-4" />
                <span>Voz ao Vivo (gemini-3.8-live)</span>
              </button>
            )}
          </div>
        </div>

        {/* Control Badges: Model, Role, Grounding */}
        <div className="mt-5 pt-4 border-t border-neutral-800/80 flex flex-wrap items-center gap-3">
          {/* Model Selector */}
          <div className="flex items-center gap-1.5 bg-neutral-900/80 p-1 rounded-xl border border-neutral-800 text-xs">
            <span className="text-neutral-400 text-[11px] px-2 font-medium">Modelo:</span>
            {[
              { id: 'gemini-3.5-flash', label: 'Flash 3.5 (Padrão)' },
              { id: 'gemini-3.1-pro-preview', label: 'Pro 3.1 (Complexo)' },
              { id: 'gemini-3.1-flash-lite', label: 'Flash-Lite (Rápido)' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedModel(m.id as any)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  selectedModel === m.id
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Role Selector */}
          <div className="flex items-center gap-1.5 bg-neutral-900/80 p-1 rounded-xl border border-neutral-800 text-xs">
            <span className="text-neutral-400 text-[11px] px-2 font-medium">Papel:</span>
            {[
              { id: 'creative_director', label: '🎬 Diretor Criativo' },
              { id: 'photo_editor', label: '✨ Retoque Foto' },
              { id: 'video_producer', label: '📹 Vídeo Viral' },
              { id: 'general', label: '🤖 Geral' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRole(r.id as any)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  selectedRole === r.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Google Search Grounding Toggle */}
          <button
            type="button"
            onClick={() => setUseSearchGrounding(!useSearchGrounding)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              useSearchGrounding
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-emerald-400" />
            <span>Google Search</span>
          </button>

          {/* Google Maps Grounding Toggle */}
          <button
            type="button"
            onClick={() => setUseMapsGrounding(!useMapsGrounding)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              useMapsGrounding
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Google Maps</span>
          </button>
        </div>
      </div>

      {/* Chat Messages Thread */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 flex flex-col h-[520px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isUser ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-purple-600 text-white rounded-tr-none'
                      : 'bg-neutral-950/70 text-neutral-200 border border-neutral-800 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Grounding Sources */}
                  {msg.groundingSources && msg.groundingSources.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-neutral-800/80 space-y-1">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                        Fontes do Google:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.groundingSources.map((source, idx) => (
                          <a
                            key={idx}
                            href={source.uri}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 text-blue-400 hover:text-blue-300 border border-neutral-800 flex items-center gap-1"
                          >
                            <Search className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[180px]">{source.title || source.uri}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className="block text-[10px] text-neutral-400 mt-2 text-right">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 rounded-tl-none flex items-center gap-2 text-xs text-neutral-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span>O Gemini está a raciocinar a resposta...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="mt-4 pt-3 border-t border-neutral-800 flex items-center gap-2">
          {/* Audio Transcribe Button (gemini-3.5-transcribe) */}
          {isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="p-3 rounded-2xl bg-rose-500 text-white animate-pulse"
              title="Parar gravação e transcrever áudio"
            >
              <MicOff className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={isTranscribing}
              className={`p-3 rounded-2xl border transition-all ${
                isTranscribing
                  ? 'bg-neutral-800 border-neutral-700 text-neutral-500'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
              }`}
              title="Falar para transcrever (gemini-3.5-transcribe)"
            >
              {isTranscribing ? <RefreshCw className="w-4 h-4 animate-spin text-blue-400" /> : <Mic className="w-4 h-4" />}
            </button>
          )}

          {/* Text Input */}
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder={
              isRecording
                ? 'Gravando áudio do microfone...'
                : isTranscribing
                ? 'Transcrevendo voz com gemini-3.5-transcribe...'
                : 'Escreva uma mensagem ou pergunta sobre fotos, vídeos e ideias criativas...'
            }
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs md:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs md:text-sm flex items-center gap-2 disabled:opacity-50 transition-all shadow-md shadow-blue-500/20"
          >
            <span>Enviar</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
