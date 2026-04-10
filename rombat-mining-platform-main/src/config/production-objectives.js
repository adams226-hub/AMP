// Configuration des objectifs de production - synchronisés avec tous les modules
export const PRODUCTION_OBJECTIVES = {
  // Objectifs journaliers par type de production
  daily: {
    default: 1000, // Objectif par défaut en tonnes
    minerai: 800,  // Objectif spécifique pour le minerai
    forage: 400,   // Objectif spécifique pour le forage
    gravier_04: 300, // Objectif pour 0/4
    gravier_05: 300, // Objectif pour 0/5
  },
  
  // Objectifs hebdomadaires
  weekly: {
    default: 10500, // 1000 * 7 jours
    minerai: 5600,
    forage: 2800,
    gravier_04: 2100,
    gravier_05: 2100,
  },
  
  // Objectifs mensuels
  monthly: {
    default: 45000, // 1000 * 30 jours
    minerai: 24000,
    forage: 12000,
    gravier_04: 9000,
    gravier_05: 9000,
  },
  
  // Objectifs par shift
  shift: {
    default: 750, // 1000 / 2 shifts
    nuit: 600,   // Objectif réduit pour le shift de nuit
    matin: 800,  // Objectif pour le shift du matin
  },
  
  // Objectifs par site
  site: {
    'Site Principal': 1000,
    'Site Secondaire': 1200,
    'Site Annexe': 800,
  }
};

// Fonction pour calculer l'objectif selon le contexte
export const calculateObjective = (context = {}) => {
  const {
    period = 'daily',
    site = 'Site Principal',
    shift = 'Jour',
    dimensions = []
  } = context;
  
  let baseObjective = PRODUCTION_OBJECTIVES[period]?.default || 1000;
  
  // Ajuster selon le site
  if (PRODUCTION_OBJECTIVES.site[site]) {
    baseObjective = PRODUCTION_OBJECTIVES.site[site];
  }
  
  // Ajuster selon le shift
  if (period === 'daily' && PRODUCTION_OBJECTIVES.shift[shift]) {
    baseObjective = PRODUCTION_OBJECTIVES.shift[shift];
  }
  
  // Calculer l'objectif total basé sur les dimensions
  if (dimensions && dimensions.length > 0) {
    let dimensionObjective = 0;
    dimensions.forEach(dim => {
      const dimType = mapDimensionToType(dim.dimension);
      if (PRODUCTION_OBJECTIVES[period][dimType]) {
        dimensionObjective += PRODUCTION_OBJECTIVES[period][dimType];
      }
    });
    
    if (dimensionObjective > 0) {
      baseObjective = dimensionObjective;
    }
  }
  
  return baseObjective;
};

// Mapper les noms de dimensions vers les types d'objectifs
const mapDimensionToType = (dimension) => {
  const mapping = {
    'Minerai': 'minerai',
    'Forage': 'forage',
    '0/4': 'gravier_04',
    '0/5': 'gravier_05',
  };
  
  return mapping[dimension] || 'default';
};

// Fonction pour sauvegarder les objectifs personnalisés
export const saveCustomObjectives = (objectives) => {
  try {
    localStorage.setItem('production_objectives', JSON.stringify(objectives));
    return true;
  } catch (error) {
    console.error('Error saving custom objectives:', error);
    return false;
  }
};

// Fonction pour charger les objectifs personnalisés
export const loadCustomObjectives = () => {
  try {
    const custom = localStorage.getItem('production_objectives');
    if (custom) {
      return JSON.parse(custom);
    }
  } catch (error) {
    console.error('Error loading custom objectives:', error);
  }
  
  return PRODUCTION_OBJECTIVES;
};

// Export par défaut
export default PRODUCTION_OBJECTIVES;
