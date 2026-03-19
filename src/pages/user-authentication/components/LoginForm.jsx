import React, { useState } from "react";
import Icon from "components/AppIcon";
import Button from "components/ui/Button";
import Input from "components/ui/Input";

const MOCK_USERS = [
  { email: "admin@mineops.fr", password: "Admin@2026", role: "admin", name: "Jean Dupont", site: "Site Kamoto" },
  { email: "directeur@mineops.fr", password: "Dir@2026", role: "directeur", name: "Marie Leclerc", site: "Site Kamoto" },
  { email: "chef@mineops.fr", password: "Chef@2026", role: "chef_de_site", name: "Paul Martin", site: "Site Kolwezi" },
  { email: "comptable@mineops.fr", password: "Cpt@2026", role: "comptable", name: "Sophie Bernard", site: "Site Kamoto" },
  { email: "supervisor@mineops.fr", password: "Sup@2026", role: "supervisor", name: "Alain Mbuji", site: "Site Kamoto" },
];

const ROLE_LABELS = {
  admin: "Administrateur",
  directeur: "Directeur",
  chef_de_site: "Chef de Site",
  comptable: "Comptable",
  supervisor: "Superviseur",
};

const ROLE_COLORS = {
  admin: { bg: "rgba(44,85,48,0.12)", color: "var(--color-primary)", icon: "ShieldCheck" },
  directeur: { bg: "rgba(214,158,46,0.12)", color: "var(--color-accent)", icon: "TrendingUp" },
  chef_de_site: { bg: "rgba(49,130,206,0.12)", color: "#3182CE", icon: "HardHat" },
  comptable: { bg: "rgba(128,90,213,0.12)", color: "#805AD5", icon: "Calculator" },
  supervisor: { bg: "rgba(234,179,8,0.12)", color: "#EAB308", icon: "UserCheck" },
};

export default function LoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e?.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const user = MOCK_USERS?.find(
        (u) => u?.email === email && u?.password === password
      );
      if (user) {
        onLoginSuccess(user);
      } else {
        setError(
          `Identifiants incorrects. Utilisez l'un des comptes de démonstration :\n• admin@mineops.fr / Admin@2026\n• directeur@mineops.fr / Dir@2026\n• chef@mineops.fr / Chef@2026\n• comptable@mineops.fr / Cpt@2026`
        );
      }
      setLoading(false);
    }, 900);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <Input
          label="Adresse e-mail"
          type="email"
          placeholder="votre@email.fr"
          value={email}
          onChange={(e) => setEmail(e?.target?.value)}
          required
          id="login-email"
          name="email"
        />
      </div>
      <div className="relative">
        <Input
          label="Mot de passe"
          type={showPassword ? "text" : "password"}
          placeholder="Votre mot de passe"
          value={password}
          onChange={(e) => setPassword(e?.target?.value)}
          required
          id="login-password"
          name="password"
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-3 top-[38px] flex items-center justify-center w-8 h-8 rounded transition-colors hover:bg-muted focus-visible:outline-none"
          aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          tabIndex={-1}
        >
          <Icon name={showPassword ? "EyeOff" : "Eye"} size={16} color="var(--color-muted-foreground)" />
        </button>
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e?.target?.checked)}
            className="w-4 h-4 rounded accent-primary"
          />
          <span className="text-sm" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
            Se souvenir de moi
          </span>
        </label>
        <button
          type="button"
          className="text-sm hover:underline focus-visible:outline-none"
          style={{ color: "var(--color-primary)", fontFamily: "var(--font-caption)" }}
        >
          Mot de passe oublié ?
        </button>
      </div>
      {error && (
        <div
          className="rounded-lg p-3 border"
          style={{ background: "rgba(229,62,62,0.06)", borderColor: "var(--color-error)" }}
        >
          {error?.split("\n")?.map((line, i) => (
            <p key={i} className="text-xs" style={{ color: "var(--color-error)", fontFamily: "var(--font-caption)" }}>
              {line}
            </p>
          ))}
        </div>
      )}
      <Button
        variant="default"
        size="lg"
        fullWidth
        loading={loading}
        iconName="LogIn"
        iconPosition="left"
        type="submit"
      >
        Se connecter
      </Button>
      {/* Demo credentials hint */}
      <div
        className="rounded-lg p-3 border"
        style={{ background: "rgba(44,85,48,0.05)", borderColor: "rgba(44,85,48,0.2)" }}
      >
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-primary)", fontFamily: "var(--font-caption)" }}>
          Comptes de démonstration :
        </p>
        <div className="space-y-1">
          {MOCK_USERS?.map((u) => {
            const rc = ROLE_COLORS?.[u?.role];
            return (
              <div key={u?.email} className="flex items-center gap-2">
                <span
                  className="text-xs px-1.5 py-0.5 rounded font-medium"
                  style={{ background: rc?.bg, color: rc?.color, fontFamily: "var(--font-caption)" }}
                >
                  {ROLE_LABELS?.[u?.role]}
                </span>
                <span className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-data)" }}>
                  {u?.email} / {u?.password}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </form>
  );
}