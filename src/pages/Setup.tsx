import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/fartura-logo.png";

const BASE = import.meta.env.VITE_API_URL ?? window.location.origin;

const DISPLAYS = [
  { key: "frangos", label: "📺 TV Frangos", color: "#f97316", route: "/display/frangos" },
  { key: "carnes", label: "🥩 TV Açougue", color: "#ef4444", route: "/display/acougue" },
];

const Setup = () => {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "waiting" | "expired">("loading");
  const navigate = useNavigate();

  // Busca um token novo ao montar a página
  useEffect(() => {
    fetch(`${BASE}/setup/token`, { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        setToken(d.token);
        setStatus("waiting");
      })
      .catch(() => setStatus("expired"));
  }, []);

  // Polling a cada 2 segundos aguardando o celular escanear
  useEffect(() => {
    if (!token || status !== "waiting") return;
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`${BASE}/setup/check/${token}`);
        const d = await r.json();
        if (d.status === "ready") {
          clearInterval(interval);
          navigate(d.route);
        } else if (d.status === "expired") {
          clearInterval(interval);
          setStatus("expired");
        }
      } catch {
        // mantém tentando
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [token, status, navigate]);

  const renewToken = () => {
    setStatus("loading");
    setToken(null);
    fetch(`${BASE}/setup/token`, { method: "POST" })
      .then((r) => r.json())
      .then((d) => { setToken(d.token); setStatus("waiting"); })
      .catch(() => setStatus("expired"));
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-8 gap-8">
      <div className="flex flex-col items-center gap-3">
        <img src={logo} alt="Hortifrúti Fartura" className="h-16 w-16 object-contain" />
        <h1 className="text-3xl font-black text-white">Configurar TV</h1>
        <p className="text-gray-400 text-center max-w-md">
          Escaneie um dos QR codes abaixo com o celular para direcionar esta TV automaticamente.
        </p>
      </div>

      {status === "loading" && (
        <p className="text-gray-400 animate-pulse text-xl">Gerando QR codes...</p>
      )}

      {status === "expired" && (
        <div className="text-center space-y-4">
          <p className="text-red-400 text-lg">QR codes expiraram (10 min).</p>
          <button
            onClick={renewToken}
            className="bg-white text-gray-900 font-bold px-6 py-3 rounded-xl hover:bg-gray-200 transition"
          >
            Gerar novos QR codes
          </button>
        </div>
      )}

      {status === "waiting" && token && (
        <>
          <div className="grid grid-cols-2 gap-6">
            {DISPLAYS.map((d) => {
              const url = `${BASE}/setup/assign?token=${token}&display=${d.key}`;
              return (
                <div
                  key={d.key}
                  className="flex flex-col items-center gap-3 bg-gray-900 rounded-2xl p-6 border-2"
                  style={{ borderColor: d.color }}
                >
                  <p className="text-white font-black text-xl">{d.label}</p>
                  <div className="bg-white p-3 rounded-xl">
                    <QRCodeSVG value={url} size={160} />
                  </div>
                  <p className="text-gray-500 text-xs text-center break-all">{url}</p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse inline-block" />
              <p className="text-gray-400 text-sm">Aguardando leitura do QR code...</p>
            </div>
            <p className="text-gray-600 text-xs">Token: <span className="font-mono text-gray-400">{token}</span> · expira em 10 min</p>
          </div>
        </>
      )}
    </div>
  );
};

export default Setup;
