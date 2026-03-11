import logo from "@/assets/fartura-logo.png";
import { useQueue } from "@/contexts/QueueContext";

const Display = () => {
  const { current, marqueeMessage, marqueeSpeed } = useQueue();
  const marqueeText = (marqueeMessage || "").trim();
  const hasMarquee = marqueeText.length > 0;
  const marqueeDuration = 18 / Math.max(1, Math.min(4, marqueeSpeed || 1));

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8 relative overflow-hidden">
      <style>{`
        @keyframes tv-marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(calc(-100% - 2rem)); }
        }
      `}</style>
      <div className="flex flex-col items-center gap-6 pb-14">
        <img src={logo} alt="Hortifrúti Fartura" className="h-32 w-32 object-contain" />
        <h1 className="text-4xl font-black tracking-tight text-primary">
          Hortifrúti Fartura
        </h1>
        <div className="mt-8 text-center">
          <p className="text-2xl font-semibold text-muted-foreground mb-4">
            Senha Chamada
          </p>
          {current ? (
            <div className="space-y-4">
              <div className="text-8xl font-black text-primary animate-pulse">
                {current.code}
              </div>
              <div className="text-3xl font-bold text-foreground">
                {current.type === "frangos" ? "Frangos" : "Carnes"}
                {current.priority && " - Prioritário"}
              </div>
            </div>
          ) : (
            <div className="text-6xl font-black text-muted-foreground">
              Aguardando...
            </div>
          )}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-14 overflow-hidden bg-black border-t-2 border-yellow-400 relative z-50">
        {hasMarquee ? (
          <div
            className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-white text-2xl font-bold"
            style={{ animation: `tv-marquee ${marqueeDuration}s linear infinite`, willChange: 'transform' }}
          >
            {marqueeText}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center px-4 text-sm font-semibold text-white/70">
            Sem mensagem configurada
          </div>
        )}
      </div>
    </div>
  );
};

export default Display;