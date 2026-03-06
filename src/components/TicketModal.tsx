import { useEffect } from "react";

interface TicketModalProps {
  type: "frangos" | "carnes";
  priority: boolean;
  number: number;
  onClose: () => void;
}

const TicketModal = ({ type, priority, number, onClose }: TicketModalProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isChicken = type === "frangos";
  const prefix = isChicken ? "F" : "C";
  const priorityPrefix = priority ? "P" : "";
  const label = isChicken ? "FRANGOS" : "CARNES";
  const emoji = isChicken ? "🍗" : "🥩";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-4 flex w-full max-w-md flex-col items-center gap-6 rounded-3xl bg-card p-10 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-6xl">{emoji}</span>

        <div className="text-center">
          <p className="text-lg font-bold text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          {priority && (
            <span className="inline-block mt-1 rounded-full bg-kiosk-priority-light px-4 py-1 text-sm font-bold text-kiosk-priority">
              PRIORITÁRIA
            </span>
          )}
        </div>

        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-semibold text-muted-foreground">Sua senha</p>
          <p
            className={`text-7xl font-black tracking-wider ${
              isChicken ? "text-secondary" : "text-primary"
            }`}
          >
            {priorityPrefix}{prefix}{number}
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          Aguarde ser chamado • Fecha em 5s
        </p>

        <button
          onClick={onClose}
          className={`w-full rounded-xl py-4 text-lg font-bold transition-transform active:scale-95 ${
            isChicken
              ? "bg-secondary text-secondary-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default TicketModal;
