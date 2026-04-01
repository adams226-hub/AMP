# ROMBAT Mining Platform

Une plateforme moderne de gestion minière basée sur React avec les dernières technologies frontend pour la gestion des opérations minières, production, équipements et finances.

## 🚀 Fonctionnalités

- **Production Management** - Suivi de la production par dimension avec objectifs
- **Equipment Management** - Gestion des équipements et maintenance  
- **Fuel Management** - Suivi de la consommation et coûts de carburant
- **Stock Management** - Gestion des stocks et mouvements
- **Accounting** - Gestion financière et comptabilité
- **Executive Dashboard** - Tableau de bord avec KPIs et graphiques
- **Reports** - Génération de rapports détaillés
- **Role-based Access** - Gestion des permissions par rôle (admin, directeur, comptable, etc.)
- **Real-time Notifications** - Système de notifications toast
- **Responsive Design** - Interface adaptative mobile/desktop

## �️ Stack Technique

- **React 18** - Version React avec rendu amélioré et fonctionnalités concurrentes
- **Vite** - Outil de build ultra-rapide et serveur de développement
- **Supabase** - Backend as a Service avec base de données PostgreSQL
- **Redux Toolkit** - Gestion d'état avec configuration Redux simplifiée
- **TailwindCSS** - Framework CSS utilitaire avec personnalisation avancée
- **React Router v6** - Routage déclaratif pour applications React
- **Recharts** - Visualisation de données avec graphiques puissants
- **React Hook Form** - Gestion efficace des formulaires
- **Framer Motion** - Animations UI fluides
- **Lucide React** - Bibliothèque d'icônes modernes

## 📋 Prérequis

- Node.js (v14.x ou plus)
- npm ou yarn
- Compte Supabase (pour la base de données)

## 🛠️ Installation

1. Cloner le repository:
   ```bash
   git clone https://github.com/votre-username/rombat-mining-platform.git
   cd rombat-mining-platform
   ```

2. Installer les dépendances:
   ```bash
   npm install
   # ou
   yarn install
   ```
   
3. Configurer les variables d'environnement:
   ```bash
   cp .env.example .env
   # Modifier .env avec vos clés Supabase
   ```

4. Démarrer le serveur de développement:
   ```bash
   npm start
   # ou
   yarn start
   ```

## 📁 Structure du Projet

```
rombat-mining-platform/
├── public/             # Assets statiques
├── src/
│   ├── components/     # Composants UI réutilisables
│   │   ├── navigation/ # Navigation et layout
│   │   └── ui/         # Composants UI de base
│   ├── pages/          # Composants de pages
│   │   ├── executive-dashboard/
│   │   ├── production-management/
│   │   ├── equipment-management/
│   │   ├── fuel-management/
│   │   ├── stock-management/
│   │   ├── accounting/
│   │   └── reports/
│   ├── config/         # Configuration (Supabase, etc.)
│   ├── context/        # Contextes React (Auth, etc.)
│   ├── utils/          # Utilitaires et helpers
│   ├── styles/         # Styles globaux et configuration Tailwind
│   ├── App.jsx         # Composant principal
│   ├── Routes.jsx      # Routes de l'application
│   └── index.jsx       # Point d'entrée
├── .env.example        # Variables d'environnement exemple
├── .env.production     # Variables d'environnement production
├── package.json        # Dépendances et scripts
├── tailwind.config.js  # Configuration Tailwind CSS
└── vite.config.mjs     # Configuration Vite
```

## 🔐 Utilisateurs par Défaut

- **Admin**: `admin` / `admin123`
- **Directeur**: `directeur` / `dir123`
- **Chef de Site**: `chefsite` / `chef123`
- **Comptable**: `comptable` / `comp123`
- **Équipement**: `equipement` / `equip123`
- **Supervisor**: `supervisor` / `sup123`
- **Operator**: `operator1` / `op123`

## 📦 Build Production

Construire l'application pour la production:

```bash
npm run build
```

Servir la version de production:

```bash
npm run serve
```

## 🚀 Déploiement

### Netlify
1. Connecter votre repository GitHub
2. Configurer les variables d'environnement
3. Déployer automatiquement

### Vercel
1. Importer le projet depuis GitHub
2. Configurer les variables d'environnement
3. Déployer

### Autres hébergeurs
Uploader le dossier `build/` généré par `npm run build`

## 🎨 Personnalisation

### Thème et Couleurs
Les couleurs sont définies via les variables CSS dans `src/styles/index.css`

### Rôles et Permissions
Modifier `src/context/AuthContext.jsx` pour ajuster les rôles et permissions

### Base de Données
Le schéma Supabase est dans `database-schema.sql`

## 🤝 Contribuer

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajouter nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## � Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour les détails

## 🙏 Remerciements

- Construit avec [Rocket.new](https://rocket.new)
- Propulsé par React et Vite
- Stylé avec Tailwind CSS
- Backend par Supabase

Built with ❤️ for ROMBAT Exploration & Mines
