import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCreatorAccounts } from "@/api/authApi";
import { listSiteSessions } from "@/api/analyticsApi";
import { listEvents } from "@/api/eventsApi";
import { listRegistrations } from "@/api/registrationsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

export default function AdminAccounts() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const { data: accounts = [], refetch: refetchAccounts } = useQuery({
    queryKey: ["admin-creator-accounts"],
    queryFn: () => fetchCreatorAccounts(),
    refetchOnMount: "always",
    refetchInterval: 15000,
  });

  const { data: sessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ["admin-site-sessions"],
    queryFn: () => listSiteSessions({ sort: "-started_at" }),
    refetchOnMount: "always",
    refetchInterval: 15000,
  });

  const { data: events = [], refetch: refetchEvents } = useQuery({
    queryKey: ["admin-events"],
    queryFn: () => listEvents({ sort: "-created_date" }),
    refetchOnMount: "always",
    refetchInterval: 15000,
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ["admin-registrations"],
    queryFn: () => listRegistrations({ sort: "-created_date" }),
    refetchOnMount: "always",
    refetchInterval: 15000,
  });

  const participantsByEvent = useMemo(() => {
    const map = new Map();
    registrations.forEach((registration) => {
      map.set(registration.event_id, (map.get(registration.event_id) || 0) + 1);
    });
    return map;
  }, [registrations]);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredAccounts = useMemo(() => {
    if (!normalizedSearch) return accounts;
    return accounts.filter((account) =>
      [account.full_name, account.email, account.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
    );
  }, [accounts, normalizedSearch]);

  const selectedAccount = filteredAccounts.find((account) => account.id === selectedId) || filteredAccounts[0] || null;

  const accountSessions = useMemo(() => {
    if (!selectedAccount) return [];
    return sessions.filter(
      (session) =>
        (selectedAccount.email && session.user_email === selectedAccount.email) ||
        (selectedAccount.phone && session.user_phone === selectedAccount.phone)
    );
  }, [sessions, selectedAccount]);

  const accountEvents = useMemo(() => {
    if (!selectedAccount) return [];
    return events.filter(
      (event) =>
        event.submitted_by_user &&
        ((selectedAccount.email && event.organizer_email === selectedAccount.email) ||
          (selectedAccount.phone && event.organizer_phone === selectedAccount.phone))
    );
  }, [events, selectedAccount]);

  const totalAccountMinutes = accountSessions.reduce((acc, session) => acc + Number(session.minutes_spent || 0), 0);
  const totalEventParticipants = accountEvents.reduce((acc, event) => acc + Number(participantsByEvent.get(event.id) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Gestion des comptes créés</h1>
          <p className="text-sm text-muted-foreground">Informations des comptes, détails sessions et événements créés par utilisateur.</p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            refetchAccounts();
            refetchSessions();
            refetchEvents();
          }}
        >
          <RefreshCcw className="w-4 h-4" /> Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Comptes créés</p><p className="text-2xl font-bold">{accounts.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Sessions liées</p><p className="text-2xl font-bold">{selectedAccount ? accountSessions.length : 0}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Événements créés</p><p className="text-2xl font-bold">{selectedAccount ? accountEvents.length : 0}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Comptes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Rechercher nom, email, téléphone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="space-y-2 max-h-[420px] overflow-y-auto">
              {filteredAccounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => setSelectedId(account.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedAccount?.id === account.id ? "bg-primary/10 border-primary/40" : "hover:bg-muted/40"}`}
                >
                  <p className="font-semibold text-sm">{account.full_name || "Sans nom"}</p>
                  <p className="text-xs text-muted-foreground truncate">{account.email || account.phone || "-"}</p>
                </button>
              ))}
              {filteredAccounts.length === 0 ? <p className="text-sm text-muted-foreground">Aucun compte trouvé.</p> : null}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {selectedAccount ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Détails du compte</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Nom:</strong> {selectedAccount.full_name || "-"}</p>
                  <p><strong>Email:</strong> {selectedAccount.email || "-"}</p>
                  <p><strong>Téléphone:</strong> {selectedAccount.phone || "-"}</p>
                  <p><strong>Date création:</strong> {selectedAccount.created_date ? new Date(selectedAccount.created_date).toLocaleString("fr-FR") : "-"}</p>
                  <div className="flex gap-2 flex-wrap pt-1">
                    <Badge variant="secondary">Temps total: {totalAccountMinutes} min</Badge>
                    <Badge variant="outline">Participants cumulés: {totalEventParticipants}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sessions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-72 overflow-y-auto">
                  {accountSessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucune session liée.</p>
                  ) : (
                    accountSessions.slice(0, 100).map((session) => (
                      <div key={session.id} className="p-3 rounded-lg border text-xs space-y-1">
                        <p><strong>Début:</strong> {session.started_at ? new Date(session.started_at).toLocaleString("fr-FR") : "-"}</p>
                        <p><strong>Dernière activité:</strong> {session.last_seen_at ? new Date(session.last_seen_at).toLocaleString("fr-FR") : "-"}</p>
                        <p><strong>Temps:</strong> {session.minutes_spent || 0} min</p>
                        <p><strong>Navigateur:</strong> {session.browser_full || session.browser || "-"} · <strong>OS:</strong> {session.os || "-"}</p>
                        <p><strong>Localisation:</strong> {session.city || "-"}, {session.country || "-"}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Événements créés (utilisateur)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-80 overflow-y-auto">
                  {accountEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun événement créé.</p>
                  ) : (
                    accountEvents.map((event) => (
                      <div key={event.id} className="p-3 rounded-lg border text-xs space-y-1">
                        <p className="font-semibold text-sm">{event.title}</p>
                        <p><strong>Type:</strong> {event.category || "-"} · <strong>Ville:</strong> {event.city || "-"}</p>
                        <p><strong>Date création:</strong> {event.created_date ? new Date(event.created_date).toLocaleString("fr-FR") : "-"}</p>
                        <p><strong>Participants en temps réel:</strong> {participantsByEvent.get(event.id) || 0}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">Sélectionnez un compte pour voir les détails.</CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
