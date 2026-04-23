import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listRegistrations } from "@/api/registrationsApi";
import { listEvents } from "@/api/eventsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { REGISTRATION_STATUS } from "@/lib/constants";
import { getCreatorEmail, getCreatorUser } from "@/lib/creatorSession";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, RefreshCcw, Ticket } from "lucide-react";
import { toast } from "sonner";
import { generateTicketPDF } from "@/utils/generateTicket";
import { trackUserAction } from "@/lib/trackUserAction";
import { Link } from "react-router-dom";

export default function ParticipantTickets() {
  const creatorUser = getCreatorUser();
  const participantEmail = getCreatorEmail();
  const [ticketLoadingId, setTicketLoadingId] = useState(null);

  const { data: registrations = [], isLoading, refetch } = useQuery({
    queryKey: ["participant-registrations", participantEmail],
    enabled: Boolean(participantEmail),
    queryFn: () => listRegistrations({ email: participantEmail, sort: "-updated_date" }),
    refetchOnMount: "always",
    refetchInterval: 20000,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: () => listEvents(),
    enabled: Boolean(participantEmail),
    refetchOnMount: "always",
  });

  const eventsById = useMemo(
    () => Object.fromEntries(events.map((event) => [event.id, event])),
    [events]
  );

  if (!creatorUser) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Connexion requise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pour consulter vos billets, connectez-vous ou creez votre compte.
              L'inscription du compte exige un email et un numero de telephone.
            </p>
            <Link to="/submit-event" className="inline-block">
              <Button>Se connecter ou creer un compte</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDownloadTicket = async (registration) => {
    const event = eventsById[registration.event_id];
    if (!event) {
      toast.error("Événement introuvable pour ce billet.");
      return;
    }

    setTicketLoadingId(registration.id);
    try {
      await generateTicketPDF({ event, registration });
      trackUserAction({
        action: "ticket_download",
        user_email: participantEmail,
        event_id: registration.event_id,
        event_title: event.title,
        event_category: event.category,
        context: "participant_tickets",
      });
    } catch {
      toast.error("Impossible de générer le billet.");
    } finally {
      setTicketLoadingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold">Mes billets</h1>
        <p className="text-muted-foreground">
          Connectez-vous avec votre email pour suivre le statut de vos inscriptions et télécharger vos billets à jour.
        </p>
      </div>

      {participantEmail ? (
        <>
          <Card>
            <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Connecté avec</p>
                <p className="font-semibold break-all">{participantEmail}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2" onClick={() => refetch()}>
                  <RefreshCcw className="w-4 h-4" />
                  Actualiser
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {isLoading ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">Chargement des billets...</CardContent>
              </Card>
            ) : registrations.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center space-y-2">
                  <p className="font-semibold">Aucun billet trouvé</p>
                  <p className="text-sm text-muted-foreground">
                    Vérifiez l'email saisi ou inscrivez-vous à un événement.
                  </p>
                </CardContent>
              </Card>
            ) : (
              registrations.map((registration) => {
                const event = eventsById[registration.event_id];
                const statusMeta = REGISTRATION_STATUS[registration.status] || {
                  label: registration.status,
                  color: "bg-muted",
                };

                return (
                  <Card key={registration.id}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-base truncate">{event?.title || "Événement"}</p>
                          <p className="text-xs text-muted-foreground">
                            Réf. billet: {registration.id?.slice(-8)?.toUpperCase()}
                          </p>
                        </div>
                        <Badge className={statusMeta.color}>{statusMeta.label}</Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Participant</p>
                          <p className="font-medium">
                            {registration.first_name} {registration.last_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Date d'inscription</p>
                          <p className="font-medium">
                            {registration.created_date
                              ? format(new Date(registration.created_date), "dd/MM/yyyy HH:mm", { locale: fr })
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Dernière mise à jour</p>
                          <p className="font-medium">
                            {registration.updated_date
                              ? format(new Date(registration.updated_date), "dd/MM/yyyy HH:mm", { locale: fr })
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Notification email</p>
                          <p className="font-medium">
                            {registration.notification_sent_at
                              ? `Envoyée le ${format(new Date(registration.notification_sent_at), "dd/MM/yyyy HH:mm", { locale: fr })}`
                              : "En attente"}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => handleDownloadTicket(registration)}
                        disabled={ticketLoadingId === registration.id || !event}
                      >
                        {ticketLoadingId === registration.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Ticket className="w-4 h-4" />
                        )}
                        {ticketLoadingId === registration.id
                          ? "Préparation du billet..."
                          : "Télécharger le billet (statut à jour)"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-10 text-center space-y-2">
            <p className="font-semibold">Email de compte manquant</p>
            <p className="text-sm text-muted-foreground">
              Votre compte est connecte mais ne contient pas d'email. Connectez-vous avec un compte ayant un email.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
