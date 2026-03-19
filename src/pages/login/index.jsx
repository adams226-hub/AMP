import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "components/AppIcon";
import Button from "components/ui/Button";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = login(formData.username, formData.password);
      
      if (result.success) {
        // Redirection selon le rôle
        switch (result.user.role) {
          case 'admin':
          case 'directeur':
            navigate('/executive-dashboard');
            break;
          case 'chef_de_site':
            navigate('/equipment-management');
            break;
          case 'comptable':
          case 'equipement':
            navigate('/accounting');
            break;
          case 'supervisor':
          case 'operator':
            navigate('/production-management');
            break;
          default:
            navigate('/executive-dashboard');
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError('Erreur lors de la connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)" }}>
      <div className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div 
            className="mx-auto mb-4"
            style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: 'white',
              fontSize: '32px',
              fontFamily: 'var(--font-heading)',
              backdropFilter: 'blur(10px)',
              border: '3px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            RB
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">RomBat Platform</h1>
          <p className="text-white/80">Exploration & Mines</p>
        </div>

        {/* Formulaire de connexion */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--color-foreground)" }}>
            Connexion
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
                Nom d'utilisateur
              </label>
              <div className="relative">
                <Icon 
                  name="User" 
                  size={20} 
                  color="var(--color-muted-foreground)" 
                  className="absolute left-3 top-3"
                />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full p-3 pl-10 border rounded-lg"
                  style={{
                    borderColor: "var(--color-border)",
                    background: "var(--color-background)",
                    color: "var(--color-foreground)"
                  }}
                  placeholder="Entrez votre nom d'utilisateur"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
                Mot de passe
              </label>
              <div className="relative">
                <Icon 
                  name="Lock" 
                  size={20} 
                  color="var(--color-muted-foreground)" 
                  className="absolute left-3 top-3"
                />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full p-3 pl-10 border rounded-lg"
                  style={{
                    borderColor: "var(--color-border)",
                    background: "var(--color-background)",
                    color: "var(--color-foreground)"
                  }}
                  placeholder="Entrez votre mot de passe"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="default"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          {/* Comptes de démonstration */}
          <div className="mt-6 p-4 rounded-lg" style={{ background: "var(--color-muted)" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--color-foreground)" }}>
              Comptes de démonstration :
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span style={{ color: "var(--color-muted-foreground)" }}>Admin:</span>
                <span style={{ color: "var(--color-foreground)" }}>admin / admin123</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--color-muted-foreground)" }}>Directeur:</span>
                <span style={{ color: "var(--color-foreground)" }}>directeur / dir123</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--color-muted-foreground)" }}>Chef de site:</span>
                <span style={{ color: "var(--color-foreground)" }}>chefsite / chef123</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--color-muted-foreground)" }}>Superviseur:</span>
                <span style={{ color: "var(--color-foreground)" }}>supervisor / sup123</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--color-muted-foreground)" }}>Comptable:</span>
                <span style={{ color: "var(--color-foreground)" }}>comptable / comp123</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--color-muted-foreground)" }}>Opérateur:</span>
                <span style={{ color: "var(--color-foreground)" }}>operator1 / op123</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--color-muted-foreground)" }}>Équipement:</span>
                <span style={{ color: "var(--color-foreground)" }}>equipement / equip123</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-white/80 text-sm">
            © 2026 RomBat Exploration & Mines
          </p>
        </div>
      </div>
    </div>
  );
}
