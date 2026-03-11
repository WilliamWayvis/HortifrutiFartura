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

const DisplayFrangos = () => {
  const { current, calledHistory, getAverageWaitTime, marqueeMessage, marqueeSpeed, marqueeBgColor, marqueeFontColor, marqueeFont, marqueeFontSize } = useQueue();
  const lastAnnouncedId = useRef<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const marqueeText = (marqueeMessage || "").trim();
  const hasMarquee = marqueeText.length > 0;
  const marqueeDuration = 18 / Math.max(1, Math.min(4, marqueeSpeed || 1));

  const unlockAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      audioCtxRef.current.resume().then(() => {
        // unlock speech synthesis with a silent utterance
        if ("speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance("");
          u.volume = 0;
          window.speechSynthesis.speak(u);
        }
        setAudioUnlocked(true);
      });
    } catch (e) {
      setAudioUnlocked(true);
    }
  };

  const playBeep = () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state === "suspended") return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(880, ctx.currentTime);
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.8, ctx.currentTime);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      o.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.log('Audio not available');
    }
  };

  const speakPassword = (code: string) => {
    try {
      if (!("speechSynthesis" in window)) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const match = code.match(/^([FC])(P?)(\d+)$/);
      const parts: string[] = [];
      if (match) {
        const isPriority = match[2] === 'P';
        const num = parseInt(match[3], 10);
        if (match[1] === 'F') {
          parts.push(isPriority ? 'Senha Preferencial' : 'Senha');
          parts.push('Frango');
          parts.push(String(num));
        } else {
          parts.push(isPriority ? 'Senha Preferencial Carnes' : 'Senha Carnes');
          parts.push(String(num));
        }
      } else {
        parts.push(`Senha ${code}`);
      }
      const u = new SpeechSynthesisUtterance(parts.join(' '));
      u.lang = 'pt-BR';
      u.rate = 0.95;
      u.pitch = 1;
      u.volume = 1;
      synth.speak(u);
    } catch (e) {
      console.log("Voice synthesis not available");
    }
  };

  useEffect(() => {
    if (!current || current.type !== "frangos") return;
    if (lastAnnouncedId.current === current.id) return;
    lastAnnouncedId.current = current.id;
    playBeep();
    setTimeout(() => speakPassword(current.code), 700);
  }, [current?.id]);

  const frangosHistory = calledHistory.filter(i => i.type === 'frangos');

  return (
    <div className="h-screen flex flex-col bg-white" onClick={!audioUnlocked ? unlockAudio : undefined}>
      {!audioUnlocked && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 cursor-pointer">
          <div className="bg-white rounded-2xl px-10 py-8 text-center shadow-2xl">
            <p className="text-2xl font-black text-gray-800 mb-2">Toque para ativar o áudio</p>
            <p className="text-base text-gray-500">Clique em qualquer lugar para habilitar som e voz</p>
          </div>
        </div>
      )}
      <style>{`
        @keyframes tv-marquee {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
      <div className="flex-1 min-h-0 p-6 flex gap-6 overflow-hidden">
        <div className="w-[42%] min-w-0 bg-gray-50 rounded-2xl p-4 border-2 border-gray-300 flex flex-col">
          <h3 className="text-4xl font-bold text-gray-700 mb-4 text-center">Ultimas Chamadas</h3>
          <div className="space-y-3 h-full overflow-hidden">
            {frangosHistory.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Nenhuma senha chamada</p>
            ) : (
              frangosHistory.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg text-center border-2 ${
                    item.priority
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-orange-50 border-orange-300'
                  }`}
                >
                  <div
                    className={`text-4xl font-black ${
                      item.priority ? 'text-blue-700' : 'text-orange-700'
                    }`}
                  >
                    {item.code}
                  </div>
                  <div className="text-base text-gray-500 mt-1">
                    Chamada as {item.calledAt ? new Date(item.calledAt).toLocaleTimeString() : "--:--:--"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="w-[58%] min-w-0 flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-7xl font-black text-gray-800 leading-none">FRANGOS</h1>
          </div>

          <div
            className={`rounded-2xl px-6 py-12 text-center flex-1 flex flex-col justify-center ${
              current && current.type === 'frangos' && current.priority
                ? 'bg-blue-600'
                : 'bg-orange-500'
            }`}
          >
            <h2 className="text-3xl font-bold text-white mb-6">Senha</h2>
            {current && current.type === 'frangos' ? (
              <div className="text-[12rem] leading-none font-black text-white animate-pulse">
                {current.code}
              </div>
            ) : (
              <div className="text-7xl font-black text-white/60">
                Aguardando...
              </div>
            )}
          </div>

          <div className="text-center py-2">
            <p className="text-lg font-semibold text-gray-600">Tempo medio de espera</p>
            <p className="text-3xl font-black text-gray-800">{getAverageWaitTime('frangos')} min</p>
          </div>
        </div>
      </div>
      <div
        className="h-14 flex-shrink-0 overflow-hidden border-t-2 border-yellow-400 flex items-center"
        style={{ backgroundColor: marqueeBgColor || '#000000' }}
      >
        {hasMarquee ? (
          <span
            className="whitespace-nowrap text-2xl font-bold"
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
        ) : (
          <span className="px-4 text-sm font-semibold" style={{ color: marqueeFontColor || '#ffffff' }}>Sem mensagem configurada</span>
        )}
      </div>
    </div>
  );
};

export default DisplayFrangos;