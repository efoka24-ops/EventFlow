export const PLATFORM_SETTING_DEFAULTS = [
  {
    key: "platform_name",
    value: "EventFlow",
    label: "Nom de la plateforme",
    description: "Nom affiché sur le site",
    type: "text",
    category: "general",
  },
  {
    key: "platform_commission_rate",
    value: "10",
    label: "Commission plateforme (%)",
    description: "Pourcentage prélevé sur chaque paiement",
    type: "number",
    category: "finance",
  },
  {
    key: "platform_service_fee",
    value: "500",
    label: "Frais de service (FCFA)",
    description: "Frais fixes par transaction",
    type: "number",
    category: "finance",
  },
  {
    key: "event_approval_required",
    value: "true",
    label: "Approbation événements requise",
    description: "Les événements soumis par les utilisateurs nécessitent une validation",
    type: "boolean",
    category: "events",
  },
  {
    key: "max_events_per_organizer",
    value: "50",
    label: "Max événements par organisateur",
    description: "Limite d'événements actifs par organisateur",
    type: "number",
    category: "events",
  },
  {
    key: "maintenance_mode",
    value: "false",
    label: "Mode maintenance",
    description: "Activer le mode maintenance (site inaccessible au public)",
    type: "boolean",
    category: "technical",
  },
  {
    key: "smtp_from_name",
    value: "EventFlow",
    label: "Nom expéditeur email",
    description: "Nom affiché dans les emails envoyés",
    type: "text",
    category: "notifications",
  },
  {
    key: "homepage_hero_title",
    value: "Découvrez les meilleurs événements",
    label: "Titre hero homepage",
    description: "Titre principal de la page d'accueil",
    type: "text",
    category: "cms",
  },
  {
    key: "homepage_hero_subtitle",
    value: "Trouvez et réservez vos événements préférés en quelques clics",
    label: "Sous-titre hero homepage",
    description: "Sous-titre de la page d'accueil",
    type: "text",
    category: "cms",
  },
  {
    key: "promo_banner_active",
    value: "false",
    label: "Bannière promo active",
    description: "Afficher la bannière promotionnelle en haut du site",
    type: "boolean",
    category: "marketing",
  },
  {
    key: "promo_banner_text",
    value: "",
    label: "Texte bannière promo",
    description: "Texte de la bannière promotionnelle",
    type: "text",
    category: "marketing",
  },
  {
    key: "featured_events_count",
    value: "6",
    label: "Nombre d'événements mis en avant",
    description: "Nombre d'événements à afficher dans la section Featured",
    type: "number",
    category: "marketplace",
  },
];

const defaultsByKey = new Map(PLATFORM_SETTING_DEFAULTS.map((setting) => [setting.key, setting]));

export const getPlatformSettingDefault = (key) => defaultsByKey.get(key) || null;

export const ensurePlatformSettings = async (dbQuery, keys) => {
  const settingsToEnsure = (keys?.length ? keys : PLATFORM_SETTING_DEFAULTS.map((setting) => setting.key))
    .map((key) => defaultsByKey.get(key))
    .filter(Boolean);

  for (const setting of settingsToEnsure) {
    await dbQuery(
      `INSERT INTO platform_settings (key, value, label, description, type, category)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (key) DO NOTHING`,
      [setting.key, setting.value, setting.label, setting.description, setting.type, setting.category]
    );
  }
};
