import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, CheckCircle2, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: events = [] } = useQuery({
    queryKey: ["admin-events"],
    queryFn: () => base44.entities.Event.list("-created_date"),
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ["admin-registrations"],
    queryFn: () => base44.entities.Registration.list("-created_date"),
  });

  const stats = [
    {
      title: "Total événements",
      value: events.length,
      icon: CalendarDays,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Événements publiés",
      value: events.filter((e) => e.status === "publie").length,
      icon: CheckCircle2,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      title: "Inscriptions totales",
      value: registrations.length,
      icon: Users,
      color: "bg-accent/20 text-accent",
    },
    {
      title: "En attente de validation",
      value: registrations.filter((r) => r.status === "en_attente").length,
      icon: Clock,
      color: "bg-amber-100 text-amber-700",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Derniers événements</CardTitle>
          </CardHeader>
          <CardContent>
            {events.slice(0, 5).length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun événement</p>
            ) : (
              <div className="space-y-3">
                {events.slice(0, 5).map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{e.city}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      e.status === "publie" ? "bg-emerald-100 text-emerald-700" : 
                      e.status === "brouillon" ? "bg-muted text-muted-foreground" : 
                      "bg-red-100 text-red-700"
                    }`}>
                      {e.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dernières inscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            {registrations.slice(0, 5).length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune inscription</p>
            ) : (
              <div className="space-y-3">
                {registrations.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{r.first_name} {r.last_name}</p>
                      <p className="text-xs text-muted-foreground">{r.email || r.phone}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      r.status === "validee" ? "bg-emerald-100 text-emerald-700" : 
                      r.status === "en_attente" ? "bg-amber-100 text-amber-700" : 
                      "bg-red-100 text-red-700"
                    }`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}