import React, { useState } from "react";
import Icon from "components/AppIcon";
import Button from "components/ui/Button";
import Input from "components/ui/Input";

import { miningService } from "../../../config/supabase";



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

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);

    try {
      const { data: dbUser, error } = await miningService.getUserByEmail(email);
      if (error) {
        console.error('Erreur récupération utilisateur:', error);
        setError("Erreur serveur, réessayez plus tard.");
        return;
      }

      const userFromDb = dbUser;

      if (!userFromDb) {
        setError("Utilisateur introuvable. Créez un compte ou vérifiez l'email.");
        return;
      }

      if (userFromDb.password_hash !== password) {
        setError("Mot de passe incorrect.");
        return;
      }

      const normalizedUser = {
        role: userFromDb.role,
        name: userFromDb.full_name,
        site: userFromDb.department,
        email: userFromDb.email,
      };

      onLoginSuccess(normalizedUser);
    } catch (err) {
      console.error('Erreur lors de la connexion:', err);
      setError("Erreur imprévue, réessayez.");
    } finally {
      setLoading(false);
    }
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
      <div
        className="rounded-lg p-3 border"
        style={{ background: "rgba(44,85,48,0.05)", borderColor: "rgba(44,85,48,0.2)" }}
      >
        <p className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
          Pour utiliser cette application en mode production, créez un compte via "Créer un compte" puis connectez-vous avec vos identifiants.
        </p>
      </div>
    </form>
  );
}