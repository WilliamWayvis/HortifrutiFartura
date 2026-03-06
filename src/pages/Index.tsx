import { useState } from "react";
import logo from "@/assets/logo-hortifruti.png";
import { generateTicketPDF } from "@/lib/ticket-pdf";

type TicketType = "frangos" | "carnes";

const Index = () => {
  const [lastTicket, setLastTicket] = useState<string | null>(null);

  const generateTicket = (type: TicketType, priority: boolean) => {
    const number = Math.floor(Math.random() * 900) + 100;
    const prefix = type === "frangos" ? "F" : "C";
    const code = `${priority ? "P" : ""}${prefix}${number}`;
    const label = type === "frangos" ? "Frangos" : "Carnes";

    generateTicketPDF({ code, label, priority });
    setLastTicket(code);

    setTimeout(() => setLastTicket(null), 3000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-background p-8">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 pt-4">
        <img src={logo} alt="Hortifrúti Fartura" className="h-28 w-28 object-contain" />
        <h1 className="text-3xl font-black tracking-tight text-primary">
          Hortifrúti Fartura
        </h1>
        <p className="text-lg font-semibold text-muted-foreground">
          Retire sua senha
        </p>
      </div>

      {/* Main Buttons */}
      <div className="flex w-full max-w-3xl flex-1 items-center gap-8 py-10">
        {/* Frangos */}
        <div className="flex flex-1 flex-col gap-4">
          <button
            onClick={() => generateTicket("frangos", false)}
            className="flex h-48 flex-col items-center justify-center rounded-2xl bg-secondary shadow-lg transition-transform active:scale-95"
          >
            <span className="text-4xl font-black text-secondary-foreground tracking-wide">
              FRANGOS
            </span>
          </button>
          <button
            onClick={() => generateTicket("frangos", true)}
            className="flex h-16 items-center justify-center gap-3 rounded-xl bg-kiosk-priority-light border-2 border-kiosk-priority transition-transform active:scale-95"
          >
            <span className="text-base font-bold text-kiosk-priority">
              FILA PRIORITÁRIA
            </span>
          </button>
        </div>

        {/* Carnes */}
        <div className="flex flex-1 flex-col gap-4">
          <button
            onClick={() => generateTicket("carnes", false)}
            className="flex h-48 flex-col items-center justify-center rounded-2xl bg-primary shadow-lg transition-transform active:scale-95"
          >
            <span className="text-4xl font-black text-primary-foreground tracking-wide">
              CARNES
            </span>
          </button>
          <button
            onClick={() => generateTicket("carnes", true)}
            className="flex h-16 items-center justify-center gap-3 rounded-xl bg-kiosk-priority-light border-2 border-kiosk-priority transition-transform active:scale-95"
          >
            <span className="text-base font-bold text-kiosk-priority">
              FILA PRIORITÁRIA
            </span>
          </button>
        </div>
      </div>

      {/* Feedback */}
      {lastTicket ? (
        <p className="pb-4 text-lg font-bold text-primary animate-in fade-in">
          Senha {lastTicket} gerada! Retire seu comprovante.
        </p>
      ) : (
        <p className="pb-4 text-sm text-muted-foreground">
          Toque na opção desejada para retirar sua senha
        </p>
      )}
    </div>
  );
};

export default Index;
