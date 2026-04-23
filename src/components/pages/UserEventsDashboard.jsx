import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listMyEvents } from "@/api/eventsApi";
import { getCreatorUser } from "@/lib/creatorSession";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusSquare, CalendarDays, MapPin } from "lucide-react";

export default function UserEventsDashboard() {
  const user = getCreatorUser();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["user-events-dashboard"],
    queryFn: () => listMyEvents(),
    enabled: Boolean(user),
    refetchOnMount: "always",
  });

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Compte requis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connectez-vous pour accéder à votre dashboard événements.
            </p>
            <Link to="/submit-event?auth=login" className="inline-block">
              <Button>Se connecter</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Mes événements</h1>
          <p className="text-sm text-muted-foreground">
            Retrouvez vos événements proposés et leur statut.
          </p>
        </div>
        <Link to="/submit-event">
          <Button className="gap-2"><PlusSquare className="w-4 h-4" /> Proposer un événement</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des événements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun événement proposé pour le moment.</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="flex items-start justify-between gap-3 border-b border-border/50 pb-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{event.title}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {event.date_start ? new Date(event.date_start).toLocaleString() : "-"}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.city || "-"}</span>
                  </div>
                </div>
                <Badge variant="outline">{event.status || "brouillon"}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
