export const getCategoryIcon = (value) => {
  const cat = CATEGORIES.find((c) => c.value === value);
  return cat ? cat.icon : "📌";
};

export const getCategoryLabel = (value) => {
  const cat = CATEGORIES.find((c) => c.value === value);
  return cat ? cat.label : value;
};

export const STATUS_LABELS = {
  brouillon: "Brouillon",
  publie: "Publié",
  annule: "Annulé",
  termine: "Terminé",
};

export const REGISTRATION_STATUS = {
  en_attente: {
    label: "En attente",
    color: "bg-amber-100 text-amber-800",
  },
  validee: {
    label: "Validée",
    color: "bg-emerald-100 text-emerald-800",
  },
  refusee: {
    label: "Refusée",
    color: "bg-red-100 text-red-800",
  },
};

export const CATEGORIES = [
  { value: "conference", label: "Conférence", icon: "🎤" },
  { value: "concert", label: "Concert", icon: "🎵" },
  { value: "sport", label: "Sport", icon: "⚽" },
  { value: "theatre", label: "Théâtre", icon: "🎭" },
  { value: "exposition", label: "Exposition", icon: "🎨" },
  { value: "festival", label: "Festival", icon: "🎉" },
  { value: "atelier", label: "Atelier", icon: "🛠️" },
  { value: "networking", label: "Networking", icon: "🤝" },
  { value: "formation", label: "Formation", icon: "📚" },
  { value: "autre", label: "Autre", icon: "📌" },
];
