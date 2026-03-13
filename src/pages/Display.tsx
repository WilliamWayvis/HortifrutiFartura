import logo from "@/assets/fartura-logo.png";
import { useQueue } from "@/contexts/QueueContext";

const Display = () => {
  const { current, marqueeMessage, marqueeSpeed } = useQueue();
  const marqueeText = (marqueeMessage || "").trim();
  const hasMarquee = marqueeText.length > 0;
  const marqueeDuration = 18 / Math.max(1, Math.min(4, marqueeSpeed || 1));

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background overflow-hidden p-[4vw] relative">
      <style>{`
        @keyframes tv-marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(calc(-100% - 2rem)); }
        }
      `}</style>
      <div className="flex flex-col items-center gap-[3vh] pb-[6vh]">
        <img src={logo} alt="Hortifrúti Fartura" className="h-[10vw] w-[10vw] max-h-40 max-w-40 object-contain" />
        <h1 className="text-[3.5vw] font-black tracking-tight text-primary">
          Hortifrúti Fartura
        </h1>
        <div className="mt-[4vh] text-center">
          <p className="text-[2.5vw] font-semibold text-muted-foreground mb-[2vh]">
            Senha Chamada
          </p>
          {current ? (
            <div className="space-y-[2vh]">
              <div className="text-[12vw] font-black text-primary animate-pulse">
                {current.code}
              </div>
              <div className="text-[3vw] font-bold text-foreground">
                {current.type === "frangos" ? "Frangos" : "Açougue"}
                {current.priority && " - Prioritário"}
              </div>
            </div>
          ) : (
            <div className="text-[7vw] font-black text-muted-foreground">
              Aguardando...
            </div>
          )}
        </div>
      </div>
      {hasMarquee && (
        <div className="absolute bottom-0 left-0 right-0 h-[6vh] overflow-hidden bg-black border-t-2 border-yellow-400 z-50">
          <div
            className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-white font-bold"
            style={{ animation: `tv-marquee ${marqueeDuration}s linear infinite`, willChange: 'transform', fontSize: '2.5vw' }}
          >
            {marqueeText}
          </div>
        </div>
      )}
    </div>
  );
};

export default Display;