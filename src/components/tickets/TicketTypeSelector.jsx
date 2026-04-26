import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { crown, zap, star } from "lucide-react";
import { useState } from "react";

export default function TicketTypeSelector({ eventPrice, maxParticipants, onSelect }) {
  const [selected, setSelected] = useState(null);

  const ticketTypes = [
    {
      id: "gratuit",
      name: "Gratuit",
      price: 0,
      color: "from-gray-500 to-gray-600",
      description: "Entrée libre",
      icon: "🎟️",
      limit: null,
    },
    {
      id: "early-bird",
      name: "Early Bird",
      price: eventPrice * 0.7,
      color: "from-yellow-500 to-orange-500",
      description: "Offer spéciale",
      icon: "⚡",
      limit: Math.floor(maxParticipants * 0.2),
      badge: "-30%",
    },
    {
      id: "standard",
      name: "Standard",
      price: eventPrice,
      color: "from-blue-500 to-cyan-500",
      description: "Price régulier",
      icon: "🎫",
      limit: null,
      featured: true,
    },
    {
      id: "vip",
      name: "VIP",
      price: eventPrice * 1.5,
      color: "from-purple-500 to-pink-500",
      description: "Accès premium",
      icon: "👑",
      limit: Math.floor(maxParticipants * 0.1),
    },
    {
      id: "etudiant",
      name: "Étudiant",
      price: eventPrice * 0.5,
      color: "from-green-500 to-emerald-500",
      description: "Tarif réduit",
      icon: "🎓",
      limit: Math.floor(maxParticipants * 0.3),
    },
  ];

  const handleSelect = (type) => {
    setSelected(type.id);
    onSelect(type);
  };

  return (
    <div>
      <h3 className="text-2xl font-bold mb-6 text-gray-900">Choisissez votre billet</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {ticketTypes.map((type) => (
          <Card
            key={type.id}
            className={`cursor-pointer transition-all transform hover:scale-105 ${
              selected === type.id
                ? "ring-2 ring-blue-500 shadow-xl"
                : "hover:shadow-lg"
            } ${type.featured ? "border-2 border-blue-400" : ""}`}
            onClick={() => handleSelect(type)}
          >
            <CardHeader className={`bg-gradient-to-br ${type.color} text-white rounded-t-lg pb-4`}>
              <div className="flex items-start justify-between">
                <div className="text-3xl">{type.icon}</div>
                {type.badge && (
                  <Badge className="bg-white text-green-600 font-bold">
                    {type.badge}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl mt-2">{type.name}</CardTitle>
              <CardDescription className="text-blue-100 text-sm">
                {type.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-4">
                <div className="text-3xl font-bold text-gray-900">
                  {type.price === 0 ? "Gratuit" : `${Math.floor(type.price).toLocaleString()} FCFA`}
                </div>
              </div>
              {type.limit && (
                <p className="text-xs text-gray-600 mb-4">
                  Limité à {type.limit} places
                </p>
              )}
              <Button
                className={`w-full ${
                  selected === type.id
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "border border-gray-300 text-gray-900 hover:bg-gray-50"
                }`}
                variant={selected === type.id ? "default" : "outline"}
              >
                {selected === type.id ? "✓ Sélectionné" : "Sélectionner"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
