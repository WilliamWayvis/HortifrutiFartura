import { useState } from "react";
import logo from "@/assets/fartura-logo.png";
import { useQueue } from "@/contexts/QueueContext";
import { ArrowLeft } from "lucide-react";

type TicketType = "frangos" | "carnes";
type Step = "select" | "priority";

const Index = () => {
  const [step, setStep] = useState<Step>("select");
  const [selectedType, setSelectedType] = useState<TicketType | null>(null);
  const [lastTicket, setLastTicket] = useState<string | null>(null);
  const { addToQueue, getNextNumber } = useQueue();

  const handleSelectType = (type: TicketType) => {
    setSelectedType(type);
    setStep("priority");
  };

  const handleBack = () => {
    setSelectedType(null);
    setStep("select");
  };

  const generateTicket = async (priority: boolean) => {
    if (!selectedType) return;

    const number = await getNextNumber(selectedType);
    const prefix = selectedType === "frangos" ? "F" : "C";
    const code = `${prefix}${priority ? "P" : ""}${number}`;
    // Add to queue
    await addToQueue({
      code,
      type: selectedType,
      priority,
    });

    setLastTicket(code);
    setStep("select");
    setSelectedType(null);

    setTimeout(() => setLastTicket(null), 3000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-background px-4 py-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 pt-2 md:pt-4 text-center">
        <img src={logo} alt="Hortifruti Fartura" className="h-32 w-32 md:h-40 md:w-40 object-contain" />
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-primary">
          Hortifruti Fartura
        </h1>
        <p className="text-xl md:text-2xl font-semibold text-muted-foreground">
          {step === "select" ? "Retire sua senha" : `Escolha o tipo de atendimento`}
        </p>
      </div>

      {/* Main Content */}
      <div className="flex w-full max-w-4xl flex-1 items-center justify-center py-6 md:py-10">
        {step === "select" ? (
          <div className="flex w-full flex-col md:flex-row gap-4 md:gap-8">
            <button
              onClick={() => handleSelectType("frangos")}
              className="flex flex-1 h-40 md:h-56 flex-col items-center justify-center rounded-2xl bg-secondary shadow-lg transition-transform active:scale-95"
            >
              <span className="text-5xl md:text-6xl font-black text-secondary-foreground tracking-wide">
                FRANGOS
              </span>
            </button>
            <button
              onClick={() => handleSelectType("carnes")}
              className="flex flex-1 h-40 md:h-56 flex-col items-center justify-center rounded-2xl bg-primary shadow-lg transition-transform active:scale-95"
            >
              <span className="text-5xl md:text-6xl font-black text-primary-foreground tracking-wide">
                AÇOUGUE
              </span>
            </button>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center gap-6">
            <p className="text-3xl md:text-4xl font-extrabold uppercase tracking-wide text-foreground">
              {selectedType === "frangos" ? "Frangos" : "Açougue"}
            </p>
            <div className="flex w-full flex-col md:flex-row gap-4 md:gap-8">
              <button
                onClick={() => generateTicket(false)}
                className="flex flex-1 h-36 md:h-48 flex-col items-center justify-center rounded-2xl bg-accent shadow-lg transition-transform active:scale-95"
              >
                <span className="text-4xl md:text-5xl font-black text-accent-foreground tracking-wide">
                  GERAL
                </span>
                <span className="mt-2 text-lg md:text-xl text-muted-foreground font-semibold">
                  Atendimento comum
                </span>
              </button>
              <button
                onClick={() => generateTicket(true)}
                className="flex flex-1 h-36 md:h-48 flex-col items-center justify-center rounded-2xl border-2 border-blue-600 bg-blue-50 shadow-lg transition-transform active:scale-95"
              >
                <span className="text-4xl md:text-5xl font-black text-blue-600 tracking-wide">
                  PRIORITÁRIO
                </span>
                <span className="mt-2 text-base md:text-lg text-muted-foreground font-semibold text-center leading-snug">
                  Idosos, gestantes, PCDs,<br />lactantes e autistas
                </span>
              </button>
            </div>
            <button
              onClick={handleBack}
              className="mt-2 md:mt-4 flex items-center gap-2 rounded-xl px-6 py-3 text-xl font-bold text-muted-foreground transition-colors hover:text-foreground active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
              Voltar
            </button>
          </div>
        )}
      </div>

      {/* Feedback */}
      {lastTicket ? (
        <p className="pb-2 md:pb-4 text-xl md:text-2xl font-bold text-primary animate-in fade-in text-center">
          Senha {lastTicket} gerada!
        </p>
      ) : (
        <div className="pb-2 md:pb-4 text-center space-y-1">
          <p className="text-base md:text-lg text-muted-foreground">
            {step === "select"
              ? "Toque na opção desejada para retirar sua senha"
              : "Escolha o tipo de atendimento"}
          </p>
          <p className="text-sm md:text-base font-semibold text-muted-foreground">
            Regra de chamada: a cada 3 senhas gerais, 1 prioritária.
          </p>
        </div>
      )}
    </div>
  );
};

export default Index;
