{
  "name": "Registration",
  "type": "object",
  "properties": {
    "event_id": {
      "type": "string",
      "description": "ID de l'\u00e9v\u00e9nement"
    },
    "first_name": {
      "type": "string",
      "description": "Pr\u00e9nom"
    },
    "last_name": {
      "type": "string",
      "description": "Nom de famille"
    },
    "email": {
      "type": "string",
      "description": "Adresse email"
    },
    "phone": {
      "type": "string",
      "description": "Num\u00e9ro de t\u00e9l\u00e9phone"
    },
    "gender": {
      "type": "string",
      "enum": [
        "homme",
        "femme",
        "autre"
      ],
      "description": "Genre"
    },
    "age": {
      "type": "number",
      "description": "\u00c2ge"
    },
    "id_type": {
      "type": "string",
      "enum": [
        "cni",
        "passeport",
        "permis",
        "autre"
      ],
      "description": "Type de pi\u00e8ce d'identit\u00e9"
    },
    "id_number": {
      "type": "string",
      "description": "Num\u00e9ro de pi\u00e8ce d'identit\u00e9"
    },
    "geo_latitude": {
      "type": "number",
      "description": "Latitude de g\u00e9olocalisation"
    },
    "geo_longitude": {
      "type": "number",
      "description": "Longitude de g\u00e9olocalisation"
    },
    "status": {
      "type": "string",
      "enum": [
        "en_attente",
        "validee",
        "refusee"
      ],
      "default": "en_attente",
      "description": "Statut de l'inscription"
    },
    "registration_method": {
      "type": "string",
      "enum": [
        "email_auto",
        "formulaire"
      ],
      "description": "M\u00e9thode d'inscription"
    }
  },
  "required": [
    "event_id",
    "first_name",
    "last_name"
  ]
}