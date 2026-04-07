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

let sharedAudioCtx: AudioContext | null = null;
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
      ctx.resume().then(() => { setAudioUnlocked(true); preloadAudio(); });
    } catch { setAudioUnlocked(true); }
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

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden" onClick={!audioUnlocked ? unlockAudio : undefined}>
      <div
        onClick={e => { e.stopPropagation(); toggleFullscreen(); }}
        style={{ position: 'absolute', top: 0, right: 0, width: '60px', height: '60px', zIndex: 9999, cursor: 'default', opacity: 0 }}
      />
      {!audioUnlocked && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 cursor-pointer">
          <div className="bg-white rounded-2xl px-[5vw] py-[4vh] text-center shadow-2xl">
            <p className="text-[2.5vw] font-black text-gray-800 mb-[1vh]">Toque para ativar o audio</p>
            <p className="text-[1.5vw] text-gray-500">Clique em qualquer lugar para habilitar som e voz</p>
          </div>
        </div>
      )}
      <style>{`
        @keyframes tv-marquee {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
      `}</style>

      <div className="flex-1 min-h-0 p-[2vw] flex gap-[2vw] overflow-hidden">

        {/* COLUNA ESQUERDA */}
        <div className="w-[42%] min-w-0 flex flex-col gap-[1.5vh]">

          {/* BLOCO SUPERIOR: Proximas Senhas */}
          <div className="flex-1 min-h-0 bg-gray-50 rounded-2xl p-[2%] border-2 border-gray-300 flex flex-col overflow-hidden">
            <h3 style={{ fontSize: 'clamp(16px,2.5vw,34px)' }} className="font-bold text-gray-700 mb-[1.5%] text-center flex-shrink-0">Próximas Senhas</h3>
            <div className="flex-1 min-h-0 flex flex-col gap-[1%]">
              {frangosQueue.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-400 text-center" style={{ fontSize: 'clamp(10px,1.5vw,18px)' }}>Nenhuma senha na fila</p>
                </div>
              ) : (
                frangosQueue.slice(0, 5).map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex-1 min-h-0 flex items-center gap-[2%] rounded-lg border-2 px-[3%] overflow-hidden ${
                      item.priority ? 'bg-blue-50 border-blue-300' : 'bg-orange-50 border-orange-300'
                    }`}
                  >
                    <span
                      style={{ fontSize: 'clamp(8px,0.9vw,13px)', flexShrink: 0 }}
                      className={`font-bold ${idx === 0 ? 'text-green-600' : 'text-gray-400'}`}
                    >
                      {idx === 0 ? 'Próxima' : `${idx + 1}º`}
                    </span>
                    <span
                      style={{ fontSize: 'clamp(14px,2.2vw,28px)' }}
                      className={`font-black ${item.priority ? 'text-blue-700' : 'text-orange-700'}`}
                    >
                      {item.code}
                    </span>
                    {item.priority && (
                      <span style={{ fontSize: 'clamp(8px,0.9vw,12px)' }} className="text-blue-500 ml-auto flex-shrink-0">Pref.</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* BLOCO INFERIOR: Ultimas Chamadas */}
          <div className="flex-1 min-h-0 bg-gray-50 rounded-2xl p-[2%] border-2 border-gray-300 flex flex-col overflow-hidden">
            <h3 style={{ fontSize: 'clamp(16px,2.5vw,34px)' }} className="font-bold text-gray-700 mb-[1.5%] text-center flex-shrink-0">Últimas Chamadas</h3>
            <div className="flex-1 min-h-0 flex flex-col gap-[1%]">
              {frangosHistory.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-400 text-center" style={{ fontSize: 'clamp(10px,1.5vw,18px)' }}>Nenhuma senha chamada</p>
                </div>
              ) : (
                frangosHistory.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className={`flex-1 min-h-0 flex flex-col items-center justify-center rounded-lg border-2 overflow-hidden ${
                      item.priority ? 'bg-blue-50 border-blue-300' : 'bg-orange-50 border-orange-300'
                    }`}
                  >
                    <div
                      style={{ fontSize: 'clamp(14px,2.2vw,28px)', lineHeight: 1.1 }}
                      className={`font-black ${item.priority ? 'text-blue-700' : 'text-orange-700'}`}
                    >
                      {item.code}
                    </div>
                    <div style={{ fontSize: 'clamp(8px,0.85vw,11px)' }} className="text-gray-500">
                      {item.calledAt ? new Date(item.calledAt).toLocaleTimeString() : '--:--:--'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA */}
        <div className="w-[58%] min-w-0 flex flex-col gap-[2vh]">
          <div className="text-center flex-shrink-0">
            <h1 style={{ fontSize: 'clamp(1.5rem,5vw,5rem)' }} className="font-black text-gray-800 leading-none">FRANGOS</h1>
          </div>
          <div
            className={`rounded-2xl px-[3%] text-center flex-1 min-h-0 flex flex-col justify-center overflow-hidden ${
              displayCurrent?.priority ? 'bg-blue-600' : 'bg-orange-500'
            }`}
          >
            <h2 style={{ fontSize: 'clamp(12px,2.5vw,28px)' }} className="font-bold text-white mb-[1%]">Senha</h2>
            {displayCurrent ? (
              <div style={{ fontSize: 'clamp(2rem,12vw,10rem)', lineHeight: 1 }} className="font-black text-white animate-pulse">
                {displayCurrent.code}
              </div>
            ) : (
              <div style={{ fontSize: 'clamp(1.5rem,5vw,4rem)' }} className="font-black text-white/60">Aguardando...</div>
            )}
          </div>
          <div className="flex-shrink-0 rounded-2xl bg-yellow-400 px-[3%] py-[2vh] text-center border-4 border-yellow-500 shadow-lg">
            <p style={{ fontSize: 'clamp(10px,1.5vw,18px)' }} className="font-bold text-yellow-900 uppercase tracking-wider">Tempo médio de espera</p>
            <p style={{ fontSize: 'clamp(1.5rem,4.5vw,4rem)' }} className="font-black text-yellow-900 mt-[0.5vh]">
              {getAverageWaitTime('frangos') ?? '0 min'}
            </p>
          </div>
        </div>
      </div>

      {hasMarquee && (
        <div
          className="h-[6vh] flex-shrink-0 overflow-hidden border-t-2 border-yellow-400 flex items-center"
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