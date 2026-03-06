import { useState } from "react";
import logo from "@/assets/logo-hortifruti.png";
import { generateTicketPDF } from "@/lib/ticket-pdf";
import { ArrowLeft } from "lucide-react";

type TicketType = "frangos" | "carnes";
type Step = "select" | "priority";

const Index = () => {
  const [step, setStep] = useState<Step>("select");
  const [selectedType, setSelectedType] = useState<TicketType | null>(null);
  const [lastTicket, setLastTicket] = useState<string | null>(null);

  const handleSelectType = (type: TicketType) => {
    setSelectedType(type);
    setStep("priority");
  };

  const handleBack = () => {
    setSelectedType(null);
    setStep("select");
  };

  const generateTicket = (priority: boolean) => {
    if (!selectedType) return;
    const number = Math.floor(Math.random() * 900) + 100;
    const prefix = selectedType === "frangos" ? "F" : "C";
    const code = `${priority ? "P" : ""}${prefix}${number}`;
    const label = selectedType === "frangos" ? "Frangos" : "Carnes";

    generateTicketPDF({ code, label, priority });
    setLastTicket(code);
    setStep("select");
    setSelectedType(null);

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
          {step === "select" ? "Retire sua senha" : `Escolha o tipo de atendimento`}
        </p>
      </div>

      {/* Main Content */}
      <div className="flex w-full max-w-3xl flex-1 items-center justify-center py-10">
        {step === "select" ? (
          <div className="flex w-full gap-8">
            <button
              onClick={() => handleSelectType("frangos")}
              className="flex flex-1 h-56 flex-col items-center justify-center rounded-2xl bg-secondary shadow-lg transition-transform active:scale-95"
            >
              <span className="text-4xl font-black text-secondary-foreground tracking-wide">
                FRANGOS
              </span>
            </button>
            <button
              onClick={() => handleSelectType("carnes")}
              className="flex flex-1 h-56 flex-col items-center justify-center rounded-2xl bg-primary shadow-lg transition-transform active:scale-95"
            >
              <span className="text-4xl font-black text-primary-foreground tracking-wide">
                CARNES
              </span>
            </button>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center gap-6">
            <p className="text-2xl font-extrabold uppercase tracking-wide text-foreground">
              {selectedType === "frangos" ? "Frangos" : "Carnes"}
            </p>
            <div className="flex w-full gap-8">
              <button
                onClick={() => generateTicket(false)}
                className="flex flex-1 h-48 flex-col items-center justify-center rounded-2xl bg-accent shadow-lg transition-transform active:scale-95"
              >
                <span className="text-3xl font-black text-accent-foreground tracking-wide">
                  NORMAL
                </span>
                <span className="mt-2 text-base text-muted-foreground font-semibold">
                  Atendimento comum
                </span>
              </button>
              <button
                onClick={() => generateTicket(true)}
                className="flex flex-1 h-48 flex-col items-center justify-center rounded-2xl border-2 border-kiosk-priority bg-kiosk-priority-light shadow-lg transition-transform active:scale-95"
              >
                <span className="text-3xl font-black text-kiosk-priority tracking-wide">
                  PRIORITÁRIO
                </span>
                <span className="mt-2 text-base text-muted-foreground font-semibold">
                  Idosos, gestantes, PCDs
                </span>
              </button>
            </div>
            <button
              onClick={handleBack}
              className="mt-4 flex items-center gap-2 rounded-xl px-6 py-3 text-lg font-bold text-muted-foreground transition-colors hover:text-foreground active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
              Voltar
            </button>
          </div>
        )}
      </div>

      {/* Feedback */}
      {lastTicket ? (
        <p className="pb-4 text-lg font-bold text-primary animate-in fade-in">
          Senha {lastTicket} gerada! Retire seu comprovante.
        </p>
      ) : (
        <p className="pb-4 text-sm text-muted-foreground">
          {step === "select"
            ? "Toque na opção desejada para retirar sua senha"
            : "Escolha o tipo de atendimento"}
        </p>
      )}
    </div>
  );
};

export default Index;
