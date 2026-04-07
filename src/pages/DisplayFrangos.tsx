import { useEffect, useRef, useState } from "react";

interface QueueItem {
  id: string;
  code: string;
  type: 'frangos' | 'carnes';
  priority: boolean;
  timestamp: number;
  calledAt?: number;
}

import { useQueue } from "@/contexts/QueueContext";

// AudioContext compartilhado — criado uma vez após interação do usuário
let sharedAudioCtx: AudioContext | null = null;
// Cache de AudioBuffers decodificados — evita re-decode a cada chamada
const decodedCache = new Map<string, AudioBuffer>();

const ALL_AUDIO_SRCS = [
  '/audio/frases/senha.mp3',
  '/audio/frases/senha-preferencial.mp3',
  '/audio/frases/frango.mp3',
  '/audio/frases/acougue.mp3',
  ...Array.from({ length: 10 }, (_, i) => `/audio/chars/${i}.mp3`),
];

const getAudioCtx = (): AudioContext => {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioCtx = new AC();
  }
  return sharedAudioCtx;
};

const fetchAndDecode = async (src: string): Promise<AudioBuffer | null> => {
  if (decodedCache.has(src)) return decodedCache.get(src)!;
  try {
    const ctx = getAudioCtx();
    const res = await fetch(src);
    const arrayBuf = await res.arrayBuffer();
    const decoded = await ctx.decodeAudioData(arrayBuf);
    decodedCache.set(src, decoded);
    return decoded;
  } catch {
    return null;
  }
};

const preloadAudio = () => {
  ALL_AUDIO_SRCS.forEach(src => fetchAndDecode(src));
};

// Concatena todos os buffers e toca como um único áudio — zero gap entre palavras
const playAudioSequence = async (files: string[]): Promise<void> => {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') await ctx.resume();

    const buffers = await Promise.all(files.map(fetchAndDecode));
    const valid = buffers.filter((b): b is AudioBuffer => b !== null);
    if (valid.length === 0) return;

    const numChannels = valid[0].numberOfChannels;
    const sampleRate = valid[0].sampleRate;
    const totalLength = valid.reduce((sum, b) => sum + b.length, 0);
    const combined = ctx.createBuffer(numChannels, totalLength, sampleRate);

    for (let c = 0; c < numChannels; c++) {
      const out = combined.getChannelData(c);
      let offset = 0;
      for (const buf of valid) {
        out.set(buf.getChannelData(Math.min(c, buf.numberOfChannels - 1)), offset);
        offset += buf.length;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = combined;
    source.connect(ctx.destination);
    await new Promise<void>(resolve => {
      source.onended = () => resolve();
      source.start(0);
    });
  } catch { /* silently fail */ }
};

const DisplayFrangos = () => {
  const { queue, current, calledHistory, getAverageWaitTime, marqueeMessage, marqueeSpeed, marqueeBgColor, marqueeFontColor, marqueeFont, marqueeFontSize } = useQueue();
  const lastAnnouncedId = useRef<string | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const marqueeText = (marqueeMessage || "").trim();
  const hasMarquee = marqueeText.length > 0;
  const marqueeDuration = 18 / Math.max(1, Math.min(4, marqueeSpeed || 1));

  const unlockAudio = () => {
    try {
      const ctx = getAudioCtx();
      ctx.resume().then(() => {
        setAudioUnlocked(true);
        preloadAudio();
      });
    } catch {
      setAudioUnlocked(true);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const speakPassword = (code: string) => {
    const match = code.match(/^([FC])(P?)(\d+)$/);
    const files: string[] = [];
    if (match) {
      const isPriority = match[2] === 'P';
      const num = parseInt(match[3], 10);
      files.push(isPriority ? '/audio/frases/senha-preferencial.mp3' : '/audio/frases/senha.mp3');
      files.push(match[1] === 'F' ? '/audio/frases/frango.mp3' : '/audio/frases/acougue.mp3');
      String(num).split('').forEach(d => files.push(`/audio/chars/${d}.mp3`));
    }
    if (files.length > 0) playAudioSequence(files);
  };

  useEffect(() => {
    if (!current || current.type !== "frangos") return;
    if (lastAnnouncedId.current === current.id) return;
    lastAnnouncedId.current = current.id;
    speakPassword(current.code);
  }, [current?.id]);

  const frangosQueue = queue.filter(i => i.type === 'frangos');
  const frangosHistory = calledHistory.filter(i => i.type === 'frangos');
  const displayCurrent = current?.type === 'frangos' ? current : null;
  const colCount = Math.min(Math.max(frangosQueue.length, 1), 6);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden select-none"
      style={{ background: '#111827' }}
      onClick={!audioUnlocked ? unlockAudio : undefined}
    >
      <div
        onClick={e => { e.stopPropagation(); toggleFullscreen(); }}
        style={{ position: 'absolute', top: 0, right: 0, width: '60px', height: '60px', zIndex: 9999, cursor: 'default', opacity: 0 }}
      />
      {!audioUnlocked && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 cursor-pointer">
          <div className="bg-white rounded-2xl px-[5vw] py-[4vh] text-center shadow-2xl">
            <p className="text-[2.5vw] font-black text-gray-800 mb-[1vh]">Toque para ativar o áudio</p>
            <p className="text-[1.5vw] text-gray-500">Clique em qualquer lugar para habilitar som e voz</p>
          </div>
        </div>
      )}
      <style>{`
        @keyframes tv-marquee {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        @keyframes pulse-card {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(249,115,22,0.4); }
          50% { transform: scale(1.02); box-shadow: 0 0 30px 10px rgba(249,115,22,0.3); }
        }
        @keyframes pulse-card-priority {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
          50% { transform: scale(1.02); box-shadow: 0 0 30px 10px rgba(59,130,246,0.3); }
        }
      `}</style>

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-[3vw] py-[1.2vh] bg-orange-500">
        <h1 className="text-[3vw] font-black text-white tracking-wider">🐔 FRANGOS</h1>
        <div className="text-right">
          <p className="text-[0.9vw] font-semibold text-orange-100 uppercase tracking-widest leading-none">Tempo médio de espera</p>
          <p className="text-[2.2vw] font-black text-white leading-tight">{getAverageWaitTime('frangos') ?? '0 min'}</p>
        </div>
      </div>

      {/* TOP HALF — Próximas Senhas */}
      <div className="flex-1 min-h-0 flex flex-col px-[2vw] pt-[1.5vh] pb-[1vh] border-b border-gray-700">
        <p className="text-[1.4vw] font-bold text-orange-400 uppercase tracking-widest text-center mb-[1.5vh]">
          🔜 Próximas Senhas
        </p>
        <div className="flex-1 min-h-0 overflow-hidden">
          {frangosQueue.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-[2vw] text-gray-600 italic">Nenhuma senha na fila</p>
            </div>
          ) : (
            <div
              className="grid gap-[1.2vw] h-full content-center"
              style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}
            >
              {frangosQueue.slice(0, 12).map((item, idx) => (
                <div
                  key={item.id}
                  className={`rounded-xl flex flex-col items-center justify-center py-[1.5vh] px-[0.5vw] border-2 ${
                    item.priority
                      ? 'bg-blue-900/40 border-blue-500'
                      : 'bg-orange-900/30 border-orange-600'
                  }`}
                >
                  {idx === 0 && (
                    <span className="text-[0.8vw] font-bold text-green-400 uppercase tracking-wider mb-[0.3vh]">Próxima</span>
                  )}
                  {item.priority && (
                    <span className="text-[0.8vw] text-blue-300 mb-[0.2vh]">⭐ Preferencial</span>
                  )}
                  <span className={`text-[2.8vw] font-black leading-none ${
                    item.priority ? 'text-blue-200' : 'text-orange-200'
                  }`}>
                    {item.code}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM HALF — Últimas Chamadas */}
      <div className="flex-1 min-h-0 flex flex-col px-[2vw] pt-[1vh] pb-[1.5vh]">
        <p className="text-[1.4vw] font-bold text-gray-400 uppercase tracking-widest text-center mb-[1.5vh]">
          📢 Últimas Chamadas
        </p>
        <div className="flex-1 min-h-0 flex gap-[1.5vw] overflow-hidden">
          {/* Senha atual — card grande com pulsação */}
          <div
            className={`flex-shrink-0 w-[22%] rounded-2xl flex flex-col items-center justify-center px-[1vw] py-[2vh] border-4 ${
              displayCurrent?.priority
                ? 'bg-blue-700 border-blue-400'
                : displayCurrent
                ? 'bg-orange-500 border-orange-400'
                : 'bg-gray-800 border-gray-700'
            }`}
            style={displayCurrent ? {
              animation: displayCurrent.priority
                ? 'pulse-card-priority 2s ease-in-out infinite'
                : 'pulse-card 2s ease-in-out infinite'
            } : { borderStyle: 'dashed' }}
          >
            {displayCurrent ? (
              <>
                <span className="text-[1vw] font-bold text-white/70 uppercase tracking-widest mb-[0.5vh]">Senha Atual</span>
                {displayCurrent.priority && (
                  <span className="text-[0.9vw] text-white/70 mb-[0.3vh]">⭐ Preferencial</span>
                )}
                <span className="text-[6vw] font-black text-white leading-none">{displayCurrent.code}</span>
                <span className="text-[0.8vw] text-white/50 mt-[0.5vh]">
                  {displayCurrent.calledAt ? new Date(displayCurrent.calledAt).toLocaleTimeString() : '--:--:--'}
                </span>
              </>
            ) : (
              <span className="text-[1.8vw] text-gray-600 italic">Aguardando...</span>
            )}
          </div>
          {/* Histórico — cards menores */}
          <div className="flex-1 min-w-0 flex gap-[1vw] items-stretch overflow-hidden">
            {frangosHistory.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[1.5vw] text-gray-600 italic">Nenhuma senha chamada ainda</p>
              </div>
            ) : (
              frangosHistory.slice(0, 7).map(item => (
                <div
                  key={item.id}
                  className={`flex-1 rounded-xl flex flex-col items-center justify-center py-[1vh] px-[0.5vw] border-2 ${
                    item.priority
                      ? 'bg-blue-900/30 border-blue-600'
                      : 'bg-orange-900/20 border-orange-700'
                  }`}
                >
                  {item.priority && (
                    <span className="text-[0.8vw] text-blue-400 mb-[0.2vh]">⭐</span>
                  )}
                  <span className={`text-[2.2vw] font-black leading-none ${
                    item.priority ? 'text-blue-300' : 'text-orange-300'
                  }`}>
                    {item.code}
                  </span>
                  <span className="text-[0.75vw] text-gray-600 mt-[0.3vh]">
                    {item.calledAt ? new Date(item.calledAt).toLocaleTimeString() : '--:--:--'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {hasMarquee && (
        <div
          className="h-[6vh] flex-shrink-0 overflow-hidden flex items-center"
          style={{ backgroundColor: marqueeBgColor || '#000000' }}
        >
          <span
            className="whitespace-nowrap font-bold"
            style={{
              display: 'inline-block',
              animation: `tv-marquee ${marqueeDuration}s linear infinite`,
              willChange: 'transform',
              color: marqueeFontColor || '#ffffff',
              fontFamily: marqueeFont || 'sans-serif',
              fontSize: `${marqueeFontSize || 24}px`,
            }}
          >
            {marqueeText}
          </span>
        </div>
      )}
    </div>
  );
};

export default DisplayFrangos;