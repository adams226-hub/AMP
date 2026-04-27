import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "components/AppIcon";
import LoginForm from "./components/LoginForm";
import CreateAccountForm from "./components/CreateAccountForm";
import ActivityLog from "./components/ActivityLog";
import RoleBadge from "./components/RoleBadge";
import { miningService, supabase } from "../../config/supabase";

const TABS = [
  { id: "login", label: "Connexion", icon: "LogIn" },
  { id: "create", label: "Créer un compte", icon: "UserPlus" },
];

export default function UserAuthentication() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login");
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [realStats, setRealStats] = useState({ total_users: '—', active_users: '—', sites: '—' });

  useEffect(() => {
    Promise.all([
      miningService.getUserStats(),
      supabase.from('sites').select('id', { count: 'exact', head: true }),
    ]).then(([userRes, sitesRes]) => {
      setRealStats({
        total_users:  userRes.data?.total_users  ?? '—',
        active_users: userRes.data?.active_users ?? '—',
        sites:        sitesRes.count             ?? '—',
      });
    });
  }, []);

  const handleLoginSuccess = (user) => {
    setLoggedInUser(user);
  };

  const handleProceed = () => {
    if (!loggedInUser) return;
    if (loggedInUser?.role === "admin" || loggedInUser?.role === "directeur") {
      navigate("/executive-dashboard");
    } else {
      navigate("/production-management");
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setActiveTab("login");
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-background)" }}
    >
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-4 md:px-8 py-4 border-b"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-lg"
            style={{ background: "rgba(214,158,46,0.2)" }}
          >
            <Icon name="Mountain" size={20} color="var(--color-accent)" strokeWidth={2} />
          </div>
          <div>
            <span className="text-base font-bold" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-heading)" }}>
              MineOps
            </span>
            <p className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
              Gestion Minière
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border"
            style={{ color: "var(--color-success)", borderColor: "rgba(56,161,105,0.3)", background: "rgba(56,161,105,0.08)", fontFamily: "var(--font-caption)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Système opérationnel
          </span>
          <button
            onClick={() => setShowActivityLog((v) => !v)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-muted focus-visible:outline-none"
            style={{ color: "var(--color-muted-foreground)", borderColor: "var(--color-border)", fontFamily: "var(--font-caption)" }}
          >
            <Icon name="Activity" size={14} color="var(--color-muted-foreground)" />
            <span className="hidden sm:inline">Journal</span>
          </button>
        </div>
      </header>
      {/* Main content */}
      <main className="flex-1 flex items-start justify-center px-4 md:px-8 py-8 lg:py-12">
        <div className="w-full max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">

            {/* Left: Auth panel */}
            <div
              className="rounded-2xl border shadow-lg overflow-hidden"
              style={{ background: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-lg)" }}
            >
              {/* Panel header */}
              <div
                className="px-6 py-5 border-b"
                style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, #3A7040 100%)", borderColor: "rgba(255,255,255,0.1)" }}
              >
                <h1 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                  Accès Sécurisé
                </h1>
                <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-caption)" }}>
                  Plateforme de gestion des opérations minières
                </p>
              </div>

              {/* Tabs */}
              <div
                className="flex border-b"
                style={{ borderColor: "var(--color-border)" }}
              >
                {TABS?.map((tab) => (
                  <button
                    key={tab?.id}
                    onClick={() => { setActiveTab(tab?.id); setLoggedInUser(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none ${activeTab === tab?.id ? "border-b-2" : ""}`}
                    style={{
                      borderBottomColor: activeTab === tab?.id ? "var(--color-primary)" : "transparent",
                      color: activeTab === tab?.id ? "var(--color-primary)" : "var(--color-muted-foreground)",
                      background: activeTab === tab?.id ? "rgba(44,85,48,0.04)" : "transparent",
                      fontFamily: "var(--font-caption)",
                    }}
                  >
                    <Icon name={tab?.icon} size={15} color={activeTab === tab?.id ? "var(--color-primary)" : "var(--color-muted-foreground)"} />
                    {tab?.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-6">
                {activeTab === "login" && !loggedInUser && (
                  <LoginForm onLoginSuccess={handleLoginSuccess} />
                )}

                {activeTab === "login" && loggedInUser && (
                  <div className="space-y-5">
                    <div className="flex flex-col items-center gap-3 py-4">
                      <div
                        className="flex items-center justify-center w-16 h-16 rounded-full"
                        style={{ background: "rgba(56,161,105,0.12)" }}
                      >
                        <Icon name="CheckCircle" size={36} color="var(--color-success)" />
                      </div>
                      <div className="text-center">
                        <p className="text-base font-semibold" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-heading)" }}>
                          Connexion réussie !
                        </p>
                        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
                          Bienvenue, {loggedInUser?.name}
                        </p>
                      </div>
                    </div>

                    <RoleBadge role={loggedInUser?.role} userName={loggedInUser?.name} userSite={loggedInUser?.site} />

                    <div className="flex gap-3">
                      <button
                        onClick={handleLogout}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
                      >
                        <Icon name="LogOut" size={15} color="var(--color-muted-foreground)" />
                        Déconnexion
                      </button>
                      <button
                        onClick={handleProceed}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 focus-visible:outline-none"
                        style={{ background: "var(--color-primary)", color: "#fff", fontFamily: "var(--font-caption)" }}
                      >
                        Accéder au tableau de bord
                        <Icon name="ArrowRight" size={15} color="#fff" />
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "create" && (
                  <CreateAccountForm />
                )}
              </div>
            </div>

            {/* Right: Info + Activity Log */}
            <div className="space-y-6">
              {/* Security info */}
              <div
                className="rounded-2xl border p-6"
                style={{ background: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-md)" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="Shield" size={18} color="var(--color-primary)" />
                  <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-heading)" }}>
                    Sécurité & Accès
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: "ShieldCheck", label: "Administrateur", desc: "Accès complet", color: "var(--color-primary)", bg: "rgba(44,85,48,0.08)" },
                    { icon: "TrendingUp", label: "Directeur", desc: "Vue exécutive", color: "var(--color-accent)", bg: "rgba(214,158,46,0.08)" },
                    { icon: "HardHat", label: "Chef de Site", desc: "Opérations terrain", color: "#3182CE", bg: "rgba(49,130,206,0.08)" },
                    { icon: "Calculator", label: "Comptable", desc: "Finances uniquement", color: "#805AD5", bg: "rgba(128,90,213,0.08)" },
                  ]?.map((r) => (
                    <div
                      key={r?.label}
                      className="flex items-start gap-2.5 p-3 rounded-xl"
                      style={{ background: r?.bg }}
                    >
                      <div
                        className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                        style={{ background: `${r?.color}20` }}
                      >
                        <Icon name={r?.icon} size={16} color={r?.color} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-caption)" }}>
                          {r?.label}
                        </p>
                        <p className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
                          {r?.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Compliance badges */}
                <div className="mt-4 pt-4 border-t flex flex-wrap gap-2" style={{ borderColor: "var(--color-border)" }}>
                  {["ISO 27001", "RGPD Conforme", "Chiffrement AES-256", "Audit Trail"]?.map((badge) => (
                    <span
                      key={badge}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-full border"
                      style={{ borderColor: "rgba(44,85,48,0.3)", color: "var(--color-primary)", background: "rgba(44,85,48,0.06)", fontFamily: "var(--font-caption)" }}
                    >
                      <Icon name="CheckCircle" size={11} color="var(--color-primary)" />
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              {/* Activity log panel */}
              <div
                className={`rounded-2xl border overflow-hidden transition-all duration-300 ${showActivityLog ? "block" : "hidden lg:block"}`}
                style={{ background: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-md)" }}
              >
                <div className="p-6">
                  <ActivityLog />
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total comptes", value: realStats.total_users, icon: "Users",  color: "var(--color-primary)" },
                  { label: "Comptes actifs", value: realStats.active_users, icon: "UserCheck", color: "var(--color-success)" },
                  { label: "Sites gérés",    value: realStats.sites,        icon: "MapPin", color: "#3182CE" },
                ]?.map((stat) => (
                  <div
                    key={stat?.label}
                    className="rounded-xl p-3 border text-center"
                    style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
                  >
                    <div className="flex justify-center mb-1.5">
                      <Icon name={stat?.icon} size={18} color={stat?.color} />
                    </div>
                    <p className="text-lg font-bold" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-data)" }}>
                      {stat?.value}
                    </p>
                    <p className="text-xs leading-tight" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
                      {stat?.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Footer */}
      <footer
        className="px-4 md:px-8 py-4 border-t text-center"
        style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}
      >
        <p className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
          &copy; {new Date()?.getFullYear()} MineOps &mdash; Plateforme de Gestion Minière. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}