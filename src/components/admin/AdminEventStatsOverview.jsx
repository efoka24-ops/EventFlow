import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Users, Ticket, TrendingUp } from "lucide-react";

export default function AdminEventStatsOverview({ events = [], registrations = [] }) {
  const publishedEvents = events.filter((event) => event.status === "publie").length;
  const paidEvents = events.filter((event) => Number(event.price || 0) > 0).length;

  const totalCapacity = events.reduce((sum, event) => sum + Number(event.max_participants || 0), 0);
  const occupancyRate = totalCapacity > 0
    ? Math.min(100, Math.round((registrations.length / totalCapacity) * 100))
    : 0;

  const stats = [
    {
      title: "Événements publiés",
      value: publishedEvents,
      icon: CalendarDays,
      tone: "from-blue-50 to-cyan-50 border-blue-100 text-blue-700",
    },
    {
      title: "Inscriptions totales",
      value: registrations.length,
      icon: Users,
      tone: "from-emerald-50 to-teal-50 border-emerald-100 text-emerald-700",
    },
    {
      title: "Événements payants",
      value: paidEvents,
      icon: Ticket,
      tone: "from-amber-50 to-yellow-50 border-amber-100 text-amber-700",
    },
    {
      title: "Taux d'occupation",
      value: `${occupancyRate}%`,
      icon: TrendingUp,
      tone: "from-violet-50 to-fuchsia-50 border-violet-100 text-violet-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <Card key={stat.title} className={`border bg-gradient-to-br ${stat.tone}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold mt-1 text-slate-900">{stat.value}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center">
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
