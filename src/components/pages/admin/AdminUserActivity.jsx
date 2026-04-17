import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileSpreadsheet, RefreshCcw } from "lucide-react";
import * as XLSX from "xlsx";

const toCsv = (rows) => {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [
    headers.join(";"),
    ...rows.map((row) => headers.map((h) => `"${String(row[h] ?? "").replaceAll('"', '""')}"`).join(";")),
  ].join("\n");
};

const downloadBlob = (content, fileName, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export default function AdminUserActivity() {
  const [search, setSearch] = useState("");

  const { data: actions = [], refetch: refetchActions } = useQuery({
    queryKey: ["admin-user-actions"],
    queryFn: () => base44.entities.UserAction.list("-created_date"),
    refetchOnMount: "always",
    refetchInterval: 15000,
  });

  const { data: sessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ["admin-site-sessions"],
    queryFn: () => base44.entities.SiteSession.list("-started_at"),
    refetchOnMount: "always",
    refetchInterval: 15000,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["admin-events"],
    queryFn: () => base44.entities.Event.list("-created_date"),
    refetchOnMount: "always",
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ["admin-registrations"],
    queryFn: () => base44.entities.Registration.list("-created_date"),
    refetchOnMount: "always",
  });

  const normalizedSearch = search.trim().toLowerCase();

  const creatorEvents = useMemo(
    () => events.filter((event) => event.submitted_by_user && event.organizer_email),
    [events]
  );

  const participantsByEvent = useMemo(() => {
    const map = new Map();
    registrations.forEach((registration) => {
      const current = map.get(registration.event_id) || 0;
      map.set(registration.event_id, current + 1);
    });
    return map;
  }, [registrations]);

  const perUserSummary = useMemo(() => {
    const users = new Map();

    sessions.forEach((session) => {
      const email = session.user_email || "anonyme";
      if (!users.has(email)) {
        users.set(email, {
          user_email: email,
          total_minutes: 0,
          actions_count: 0,
          sessions_count: 0,
          browser: session.browser_full || session.browser || "-",
          os: session.os || "-",
          country: session.country || "-",
          city: session.city || "-",
        });
      }
      const current = users.get(email);
      current.total_minutes += Number(session.minutes_spent || 0);
      current.sessions_count += 1;
      if (!current.country || current.country === "-") current.country = session.country || "-";
      if (!current.city || current.city === "-") current.city = session.city || "-";
    });

    actions.forEach((action) => {
      const email = action.user_email || "anonyme";
      if (!users.has(email)) {
        users.set(email, {
          user_email: email,
          total_minutes: 0,
          actions_count: 0,
          sessions_count: 0,
          browser: "-",
          os: "-",
          country: "-",
          city: "-",
        });
      }
      users.get(email).actions_count += 1;
    });

    creatorEvents.forEach((event) => {
      const email = event.organizer_email || "anonyme";
      if (!users.has(email)) {
        users.set(email, {
          user_email: email,
          total_minutes: 0,
          actions_count: 0,
          sessions_count: 0,
          browser: "-",
          os: "-",
          country: "-",
          city: "-",
        });
      }
      const current = users.get(email);
      current.events_created = (current.events_created || 0) + 1;
      current.total_event_participants = (current.total_event_participants || 0) + Number(participantsByEvent.get(event.id) || 0);
    });

    return Array.from(users.values()).sort((a, b) => b.actions_count - a.actions_count);
  }, [actions, sessions, creatorEvents, participantsByEvent]);

  const filteredActions = useMemo(() => {
    if (!normalizedSearch) return actions;
    return actions.filter((action) =>
      [
        action.user_email,
        action.action,
        action.event_title,
        action.event_category,
        action.page_path,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
    );
  }, [actions, normalizedSearch]);

  const creatorEventRows = useMemo(
    () => creatorEvents.map((event) => ({
      event_id: event.id,
      title: event.title,
      category: event.category,
      organizer_email: event.organizer_email || "-",
      organizer_name: event.organizer_name || "-",
      created_date: event.created_date || "-",
      participants_live: Number(participantsByEvent.get(event.id) || 0),
      city: event.city || "-",
    })),
    [creatorEvents, participantsByEvent]
  );

  const exportActionsCsv = () => {
    const rows = filteredActions.map((action) => ({
      created_date: action.created_date,
      user_email: action.user_email || "",
      action: action.action,
      page_path: action.page_path || "",
      event_title: action.event_title || "",
      event_category: action.event_category || "",
      context: action.context || "",
      metadata: action.metadata ? JSON.stringify(action.metadata) : "",
    }));
    downloadBlob(`\uFEFF${toCsv(rows)}`, `user-actions-${Date.now()}.csv`, "text/csv;charset=utf-8;");
  };

  const exportCreatorsExcel = () => {
    const sheet = XLSX.utils.json_to_sheet(creatorEventRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "CreatorEvents");
    XLSX.writeFile(wb, `creator-events-live-${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Activité utilisateurs</h1>
          <p className="text-sm text-muted-foreground">Temps passé, actions effectuées, événements créés et participants en temps réel.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => { refetchActions(); refetchSessions(); }}>
          <RefreshCcw className="w-4 h-4" /> Rafraîchir
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Actions loggées</p><p className="text-2xl font-bold">{actions.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Sessions</p><p className="text-2xl font-bold">{sessions.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Événements créés (utilisateurs)</p><p className="text-2xl font-bold">{creatorEvents.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Participants live cumulés</p><p className="text-2xl font-bold">{creatorEventRows.reduce((acc, row) => acc + row.participants_live, 0)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actions détaillées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input placeholder="Filtrer par email, action, événement..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
            <Button variant="outline" className="gap-2" onClick={exportActionsCsv}><Download className="w-4 h-4" /> Export actions CSV</Button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredActions.slice(0, 300).map((action) => (
              <div key={action.id} className="p-3 rounded-lg border text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{action.action}</p>
                  <Badge variant="outline">{action.created_date ? new Date(action.created_date).toLocaleString("fr-FR") : "-"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Utilisateur: {action.user_email || "anonyme"}</p>
                <p className="text-xs text-muted-foreground">Page: {action.page_path || "-"}</p>
                {action.event_title ? <p className="text-xs text-muted-foreground">Événement: {action.event_title} ({action.event_category || "-"})</p> : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Par utilisateur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {perUserSummary.slice(0, 100).map((user) => (
            <div key={user.user_email} className="p-3 rounded-lg border text-sm">
              <p className="font-semibold">{user.user_email}</p>
              <p className="text-xs text-muted-foreground">
                Actions: {user.actions_count} · Temps: {user.total_minutes} min · Sessions: {user.sessions_count}
              </p>
              <p className="text-xs text-muted-foreground">
                Navigateur: {user.browser} · OS: {user.os} · Localisation: {user.city}, {user.country}
              </p>
              <p className="text-xs text-muted-foreground">
                Événements créés: {user.events_created || 0} · Participants sur ses événements: {user.total_event_participants || 0}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Événements créés par utilisateurs (live)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="gap-2" onClick={exportCreatorsExcel}><FileSpreadsheet className="w-4 h-4" /> Export Excel</Button>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {creatorEventRows.map((row) => (
              <div key={row.event_id} className="p-3 rounded-lg border text-sm">
                <p className="font-semibold">{row.title}</p>
                <p className="text-xs text-muted-foreground">Type: {row.category} · Ville: {row.city}</p>
                <p className="text-xs text-muted-foreground">Créateur: {row.organizer_name} ({row.organizer_email})</p>
                <p className="text-xs text-muted-foreground">Créé le: {row.created_date ? new Date(row.created_date).toLocaleString("fr-FR") : "-"}</p>
                <p className="text-xs text-muted-foreground">Participants en temps réel: {row.participants_live}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
