import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/fartura-logo.png";

const ADMIN_PASSWORD = "fartura2026";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin_auth", "1");
      navigate("/admin");
    } else {
      setError(true);
      setPassword("");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="Hortifrúti Fartura" className="h-20 w-20 object-contain" />
          <h1 className="text-2xl font-black text-primary">Painel Administrativo</h1>
          <p className="text-sm text-muted-foreground">Hortifrúti Fartura</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false); }}
              className="w-full rounded-xl border-2 border-input bg-background px-4 py-3 text-base outline-none focus:border-primary transition-colors"
              placeholder="Digite a senha"
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-500 font-semibold">Senha incorreta. Tente novamente.</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-primary py-3 text-base font-black text-primary-foreground transition-opacity hover:opacity-90 active:scale-95"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
