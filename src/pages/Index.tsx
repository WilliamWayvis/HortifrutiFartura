import { useState } from "react";
import logo from "@/assets/logo-hortifruti.png";
import TicketModal from "@/components/TicketModal";

type TicketType = "frangos" | "carnes";

const Index = () => {
  const [ticket, setTicket] = useState<{ type: TicketType; priority: boolean; number: number } | null>(null);

  const generateTicket = (type: TicketType, priority: boolean) => {
    const number = Math.floor(Math.random() * 900) + 100;
    setTicket({ type, priority, number });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-background p-8 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col items-center gap-4 pt-4">
        <img src={logo} alt="Hortifrúti Fartura" className="h-32 w-32 object-contain" />
        <h1 className="text-4xl font-black tracking-tight text-primary">
          Hortifrúti Fartura
        </h1>
        <p className="text-xl font-semibold text-muted-foreground">
          Retire sua senha
        </p>
      </div>

      {/* Main Buttons */}
      <div className="flex w-full max-w-4xl flex-1 items-center gap-8 py-12">
        {/* Frangos */}
        <div className="flex flex-1 flex-col gap-4">
          <button
            onClick={() => generateTicket("frangos", false)}
            className="flex h-56 flex-col items-center justify-center rounded-2xl bg-kiosk-orange shadow-lg transition-transform active:scale-95"
          >
            <span className="text-7xl mb-2">🍗</span>
            <span className="text-3xl font-black text-secondary-foreground tracking-wide">
              FRANGOS
            </span>
          </button>
          <button
            onClick={() => generateTicket("frangos", true)}
            className="flex h-20 items-center justify-center gap-3 rounded-xl bg-kiosk-priority-light border-2 border-kiosk-priority shadow-sm transition-transform active:scale-95"
          >
            <span className="text-2xl">♿</span>
            <span className="text-lg font-bold text-kiosk-priority">
              FILA PRIORITÁRIA
            </span>
          </button>
        </div>

        {/* Carnes */}
        <div className="flex flex-1 flex-col gap-4">
          <button
            onClick={() => generateTicket("carnes", false)}
            className="flex h-56 flex-col items-center justify-center rounded-2xl bg-primary shadow-lg transition-transform active:scale-95"
          >
            <span className="text-7xl mb-2">🥩</span>
            <span className="text-3xl font-black text-primary-foreground tracking-wide">
              CARNES
            </span>
          </button>
          <button
            onClick={() => generateTicket("carnes", true)}
            className="flex h-20 items-center justify-center gap-3 rounded-xl bg-kiosk-priority-light border-2 border-kiosk-priority shadow-sm transition-transform active:scale-95"
          >
            <span className="text-2xl">♿</span>
            <span className="text-lg font-bold text-kiosk-priority">
              FILA PRIORITÁRIA
            </span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="pb-4 text-sm text-muted-foreground">
        Toque na opção desejada para retirar sua senha
      </p>

      {/* Ticket Modal */}
      {ticket && (
        <TicketModal
          type={ticket.type}
          priority={ticket.priority}
          number={ticket.number}
          onClose={() => setTicket(null)}
        />
      )}
    </div>
  );
};

export default Index;
