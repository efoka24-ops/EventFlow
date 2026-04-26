import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listMyEvents } from "@/api/eventsApi";
import { listRegistrations } from "@/api/registrationsApi";
import { getCreatorUser } from "@/lib/creatorSession";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Plus, CalendarDays, MapPin, Users, Eye, TrendingUp, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const STATUS_CONFIG = {
  publie: { label: "Publié", color: "bg-emerald-100 text-emerald-800" },
  brouillon: { label: "Brouillon", color: "bg-muted text-muted-foreground" },
  annule: { label: "Annulé", color: "bg-red-100 text-red-800" },
  termine: { label: "Terminé", color: "bg-slate-100 text-slate-600" },
};

export default function UserEventsDashboard() {
  const user = getCreatorUser();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["user-events-dashboard"],
    queryFn: () => listMyEvents(),
    enabled: Boolean(user),
    refetchOnMount: "always",
  });

  const { data: allRegistrations = [] } = useQuery({
    queryKey: ["all-registrations"],
    queryFn: () => listRegistrations({ sort: "-created_date" }),
    enabled: Boolean(user),
    refetchOnMount: "always",
  });

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-2xl font-bold mb-2">Connexion requise</h2>
        <p className="text-muted-foreground mb-6">Connectez-vous pour accéder à votre dashboard événements.</p>
        <Link to="/submit-event?auth=login">
          <Button className="rounded-full">Se connecter</Button>
        </Link>
      </div>
    );
  }

  const regByEvent = allRegistrations.reduce((acc, reg) => {
    if (!acc[reg.event_id]) acc[reg.event_id] = [];
    acc[reg.event_id].push(reg);
    return acc;
  }, {});

  const published = events.filter((e) => e.status === "publie").length;
  const upcoming = events.filter((e) => e.date_start && new Date(e.date_start) > new Date()).length;
  const totalRegistrations = allRegistrations.length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-extrabold">Mes événements</h1>
          </div>
          <p className="text-sm text-muted-foreground">{events.length} événement{events.length !== 1 ? "s" : ""} proposé{events.length !== 1 ? "s" : ""}</p>
        </div>
        <Link to="/submit-event">
          <Button className="gap-2 rounded-full">
            <Plus className="w-4 h-4" /> Nouvel événement
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: CalendarDays, value: events.length, label: "Total" },
          { icon: TrendingUp, value: published, label: "Publiés" },
          { icon: CalendarDays, value: upcoming, label: "À venir" },
          { icon: Users, value: totalRegistrations, label: "Inscriptions" },
        ].map(({ icon: Icon, value, label }) => (
          <Card key={label} className="border-border/50">
            <CardContent className="pt-5 pb-4 text-center">
              <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-extrabold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Events list */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Liste des événements</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-14 h-14 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30" />
              <p className="font-semibold mb-1">Vous n'avez pas encore proposé d'événement</p>
              <p className="text-sm text-muted-foreground mb-5">Créez votre premier événement en quelques minutes.</p>
              <Link to="/submit-event">
                <Button className="gap-2 rounded-full">
                  <Plus className="w-4 h-4" /> Créer mon premier événement
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((ev, i) => {
                const evRegs = regByEvent[ev.id] || [];
                const validated = evRegs.filter((r) => r.status === "validee").length;
                const statusConfig = STATUS_CONFIG[ev.status] || STATUS_CONFIG.brouillon;
                const isUpcoming = ev.date_start && new Date(ev.date_start) > new Date();

                return (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <div className="flex items-start gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all">
                      {/* Date block */}
                      <div className="w-14 shrink-0 text-center">
                        {ev.date_start ? (
                          <>
                            <div className="text-xs font-bold text-primary uppercase">
                              {format(new Date(ev.date_start), "MMM", { locale: fr })}
                            </div>
                            <div className="text-2xl font-extrabold leading-none">
                              {format(new Date(ev.date_start), "d")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(ev.date_start), "yyyy")}
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-muted-foreground">—</div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-bold text-sm leading-snug">{ev.title}</p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isUpcoming && <Badge variant="outline" className="text-xs text-primary border-primary/40">À venir</Badge>}
                            <Badge className={`${statusConfig.color} text-xs`}>{statusConfig.label}</Badge>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.city || "—"}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{evRegs.length} inscrits ({validated} validés)</span>
                          {ev.price > 0 && <span className="text-primary font-medium">{ev.price?.toLocaleString()} FCFA</span>}
                          {!ev.price || ev.price === 0 ? <span className="text-emerald-600 font-medium">Gratuit</span> : null}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Link to={`/events/${ev.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Voir">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
