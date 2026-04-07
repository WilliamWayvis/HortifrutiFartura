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

const playAudioSequence = async (files: string[]) => {
  for (const file of files) {
    await new Promise<void>((resolve) => {
      const a = new Audio(file);
      a.onended = () => resolve();
      a.onerror = () => resolve();
      a.play().catch(() => resolve());
    });
  }
};

const DisplayFrangos = () => {
  const { current, calledHistory, getAverageWaitTime, marqueeMessage, marqueeSpeed, marqueeBgColor, marqueeFontColor, marqueeFont, marqueeFontSize } = useQueue();
  const lastAnnouncedId = useRef<string | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const marqueeText = (marqueeMessage || "").trim();
  const hasMarquee = marqueeText.length > 0;
  const marqueeDuration = 18 / Math.max(1, Math.min(4, marqueeSpeed || 1));

  const unlockAudio = () => {
    // Toca um áudio silencioso para desbloquear o HTML5 Audio no Samsung
    const a = new Audio('/audio/frases/senha.mp3');
    a.volume = 0;
    a.play().then(() => { a.pause(); setAudioUnlocked(true); }).catch(() => setAudioUnlocked(true));
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

  const frangosHistory = calledHistory.filter(i => i.type === 'frangos');

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden" onClick={!audioUnlocked ? unlockAudio : undefined}>
      {/* Botão invisível para fullscreen — canto superior direito */}
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
      `}</style>
      <div className="flex-1 min-h-0 p-[2vw] flex gap-[2vw] overflow-hidden">
        <div className="w-[42%] min-w-0 bg-gray-50 rounded-2xl p-[2%] border-2 border-gray-300 flex flex-col">
          <h3 className="text-[2.5vw] font-bold text-gray-700 mb-[1.5vh] text-center">Ultimas Chamadas</h3>
          <div className="space-y-[1vh] h-full overflow-hidden">
            {frangosHistory.length === 0 ? (
              <p className="text-gray-400 text-center py-[2vh]">Nenhuma senha chamada</p>
            ) : (
              frangosHistory.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  className={`p-[1.5%] rounded-lg text-center border-2 ${
                    item.priority
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-orange-50 border-orange-300'
                  }`}
                >
                  <div
                    className={`text-[2.5vw] font-black ${
                      item.priority ? 'text-blue-700' : 'text-orange-700'
                    }`}
                  >
                    {item.code}
                  </div>
                  <div className="text-[1vw] text-gray-500 mt-1">
                    Chamada as {item.calledAt ? new Date(item.calledAt).toLocaleTimeString() : "--:--:--"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="w-[58%] min-w-0 flex flex-col gap-[2vh]">
          <div className="text-center">
            <h1 className="text-[5vw] font-black text-gray-800 leading-none">FRANGOS</h1>
          </div>

          <div
            className={`rounded-2xl px-[3%] py-[4vh] text-center flex-1 flex flex-col justify-center ${
              current && current.type === 'frangos' && current.priority
                ? 'bg-blue-600'
                : 'bg-orange-500'
            }`}
          >
            <h2 className="text-[2.5vw] font-bold text-white mb-[2vh]">Senha</h2>
            {current && current.type === 'frangos' ? (
              <div className="text-[15vw] leading-none font-black text-white animate-pulse">
                {current.code}
              </div>
            ) : (
              <div className="text-[5vw] font-black text-white/60">
                Aguardando...
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-yellow-400 px-[3%] py-[2vh] text-center border-4 border-yellow-500 shadow-lg">
            <p className="text-[1.5vw] font-bold text-yellow-900 uppercase tracking-wider">⏱ Tempo médio de espera</p>
            <p className="text-[4.5vw] font-black text-yellow-900 mt-[0.5vh]">
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