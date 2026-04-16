{
  "name": "Event",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Titre de l'\u00e9v\u00e9nement"
    },
    "description": {
      "type": "string",
      "description": "Description d\u00e9taill\u00e9e"
    },
    "category": {
      "type": "string",
      "enum": [
        "concert",
        "sport",
        "conference",
        "festival",
        "atelier",
        "exposition",
        "theatre",
        "cinema",
        "gastronomie",
        "bien_etre",
        "technologie",
        "autre"
      ],
      "description": "Cat\u00e9gorie de l'\u00e9v\u00e9nement"
    },
    "date_start": {
      "type": "string",
      "format": "date-time",
      "description": "Date et heure de d\u00e9but"
    },
    "date_end": {
      "type": "string",
      "format": "date-time",
      "description": "Date et heure de fin"
    },
    "location_name": {
      "type": "string",
      "description": "Nom du lieu"
    },
    "city": {
      "type": "string",
      "description": "Ville"
    },
    "address": {
      "type": "string",
      "description": "Adresse compl\u00e8te"
    },
    "latitude": {
      "type": "number",
      "description": "Latitude"
    },
    "longitude": {
      "type": "number",
      "description": "Longitude"
    },
    "image_url": {
      "type": "string",
      "description": "URL de l'image de couverture"
    },
    "max_participants": {
      "type": "number",
      "description": "Nombre maximum de participants"
    },
    "price": {
      "type": "number",
      "description": "Prix en FCFA (0 pour gratuit)"
    },
    "status": {
      "type": "string",
      "enum": [
        "brouillon",
        "publie",
        "annule",
        "termine"
      ],
      "default": "brouillon",
      "description": "Statut de l'\u00e9v\u00e9nement"
    },
    "tags": {
      "type": "string",
      "description": "Tags s\u00e9par\u00e9s par des virgules"
    }
  },
  "required": [
    "title",
    "category",
    "date_start",
    "city"
  ]
}