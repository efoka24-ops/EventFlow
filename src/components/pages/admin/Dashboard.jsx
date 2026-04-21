import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, CheckCircle2, Clock, Globe2, Timer, Download, FileSpreadsheet } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";

const browserColors = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#6b7280"];

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

export default function Dashboard() {
  const { data: events = [] } = useQuery({
    queryKey: ["admin-events"],
    queryFn: () => base44.entities.Event.list("-created_date"),
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ["admin-registrations"],
    queryFn: () => base44.entities.Registration.list("-created_date"),
    refetchInterval: 30_000,
    refetchOnMount: "always",
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["admin-site-sessions"],
    queryFn: () => base44.entities.SiteSession.list("-started_at"),
    refetchOnMount: "always",
  });

  const { data: feedbackItems = [] } = useQuery({
    queryKey: ["admin-feedback"],
    queryFn: () => base44.entities.EventFeedback.list("-created_date"),
    refetchOnMount: "always",
  });

  const totalMinutes = sessions.reduce((acc, session) => acc + Number(session.minutes_spent || 0), 0);
  const uniqueVisitors = new Set(sessions.map((session) => session.id)).size;
  const averageMinutes = sessions.length ? Math.round(totalMinutes / sessions.length) : 0;
  const userCreatedEvents = events.filter((event) => event.submitted_by_user);
  const averageFeedback = feedbackItems.length
    ? (feedbackItems.reduce((acc, item) => acc + Number(item.rating || 0), 0) / feedbackItems.length).toFixed(1)
    : "0.0";

  const browserMap = sessions.reduce((acc, session) => {
    const key = session.browser_full || session.browser || "Autre";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const browserData = Object.entries(browserMap).map(([name, value]) => ({ name, value }));

  const deviceTypeMap = sessions.reduce((acc, session) => {
    const key = session.device_type || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const deviceTypeData = Object.entries(deviceTypeMap).map(([name, value]) => ({ name, value }));

  const osMap = sessions.reduce((acc, session) => {
    const key = session.os || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const osData = Object.entries(osMap).map(([name, value]) => ({ name, value }));

  const locationMap = sessions.reduce((acc, session) => {
    const key = session.country || session.city || "Inconnu";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const locationData = Object.entries(locationMap)
    .map(([location, visits]) => ({ location, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 8);

  const preciseGeoSessions = sessions.filter(
    (session) => typeof session.geo_latitude === "number" && typeof session.geo_longitude === "number"
  );

  const exportAnalyticsCsv = () => {
    const rows = sessions.map((session) => ({
      session_id: session.id,
      started_at: session.started_at || "",
      ended_at: session.ended_at || "",
      last_seen_at: session.last_seen_at || "",
      minutes_spent: session.minutes_spent || 0,
      browser: session.browser || "",
      country: session.country || "",
      city: session.city || "",
      region: session.region || "",
      timezone: session.timezone || "",
      page_paths: (session.page_paths || []).join(" | "),
      user_agent: session.user_agent || "",
      referrer: session.referrer || "",
      language: session.language || "",
      browser_full: session.browser_full || "",
      browser_version: session.browser_version || "",
      os: session.os || "",
      device_type: session.device_type || "",
      geo_source: session.geo_source || "",
      geo_latitude: session.geo_latitude ?? "",
      geo_longitude: session.geo_longitude ?? "",
      geo_accuracy_m: session.geo_accuracy_m ?? "",
      geo_altitude_m: session.geo_altitude_m ?? "",
      geo_heading_deg: session.geo_heading_deg ?? "",
      geo_speed_mps: session.geo_speed_mps ?? "",
    }));
    downloadBlob(`\uFEFF${toCsv(rows)}`, `analytics-sessions-${Date.now()}.csv`, "text/csv;charset=utf-8;");
  };

  const exportAnalyticsExcel = () => {
    const rows = sessions.map((session) => ({
      session_id: session.id,
      started_at: session.started_at || "",
      ended_at: session.ended_at || "",
      last_seen_at: session.last_seen_at || "",
      minutes_spent: session.minutes_spent || 0,
      browser: session.browser || "",
      country: session.country || "",
      city: session.city || "",
      region: session.region || "",
      timezone: session.timezone || "",
      page_paths: (session.page_paths || []).join(" | "),
      user_agent: session.user_agent || "",
      referrer: session.referrer || "",
      language: session.language || "",
      browser_full: session.browser_full || "",
      browser_version: session.browser_version || "",
      os: session.os || "",
      device_type: session.device_type || "",
      geo_source: session.geo_source || "",
      geo_latitude: session.geo_latitude ?? "",
      geo_longitude: session.geo_longitude ?? "",
      geo_accuracy_m: session.geo_accuracy_m ?? "",
      geo_altitude_m: session.geo_altitude_m ?? "",
      geo_heading_deg: session.geo_heading_deg ?? "",
      geo_speed_mps: session.geo_speed_mps ?? "",
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Sessions");
    XLSX.writeFile(wb, `analytics-sessions-${Date.now()}.xlsx`);
  };

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
    {
      title: "Visiteurs uniques",
      value: uniqueVisitors,
      icon: Globe2,
      color: "bg-sky-100 text-sky-700",
    },
    {
      title: "Temps moyen (min)",
      value: averageMinutes,
      icon: Timer,
      color: "bg-violet-100 text-violet-700",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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

      <div className="flex gap-2 flex-wrap mb-6">
        <Button variant="outline" className="gap-2" onClick={exportAnalyticsCsv}>
          <Download className="w-4 h-4" /> Export analytics CSV
        </Button>
        <Button variant="outline" className="gap-2" onClick={exportAnalyticsExcel}>
          <FileSpreadsheet className="w-4 h-4" /> Export analytics Excel
        </Button>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Visites par localisation</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {locationData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée de localisation pour le moment.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationData} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" angle={-20} textAnchor="end" interval={0} height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="visits" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Navigateurs utilisés</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {browserData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée navigateur pour le moment.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={browserData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {browserData.map((entry, index) => (
                      <Cell key={entry.name} fill={browserColors[index % browserColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Types d'appareils</CardTitle>
          </CardHeader>
          <CardContent>
            {deviceTypeData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée appareil.</p>
            ) : (
              <div className="space-y-2">
                {deviceTypeData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-2 rounded-md bg-muted/40">
                    <span className="text-sm">{item.name}</span>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Systèmes d'exploitation</CardTitle>
          </CardHeader>
          <CardContent>
            {osData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée OS.</p>
            ) : (
              <div className="space-y-2">
                {osData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-2 rounded-md bg-muted/40">
                    <span className="text-sm">{item.name}</span>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Géolocalisation appareil (arrière-plan)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            {preciseGeoSessions.length} session(s) avec coordonnées GPS récupérées en arrière-plan
          </p>
          {preciseGeoSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune coordonnée GPS disponible pour le moment (permission de localisation requise côté utilisateur).
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {preciseGeoSessions.slice(0, 20).map((session) => (
                <div key={session.id} className="p-3 rounded-lg bg-muted/40 text-xs space-y-1">
                  <p><strong>Session:</strong> {session.id}</p>
                  <p><strong>Coordonnées:</strong> {session.geo_latitude}, {session.geo_longitude}</p>
                  <p><strong>Précision:</strong> {session.geo_accuracy_m ?? "-"} m</p>
                  <p><strong>Source:</strong> {session.geo_source || "ip"} · <strong>Navigateur:</strong> {session.browser_full || session.browser || "-"}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Événements créés par des utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            {userCreatedEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun événement soumis par un utilisateur.</p>
            ) : (
              <div className="space-y-3">
                {userCreatedEvents.slice(0, 8).map((event) => (
                  <div key={event.id} className="p-3 rounded-lg bg-muted/50">
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.organizer_name || "Organisateur inconnu"}
                      {event.organizer_email ? ` · ${event.organizer_email}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.city || "Ville non renseignée"} · {event.status}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Feedback participants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {feedbackItems.length} feedback(s) · Note moyenne {averageFeedback}/5
            </p>
            {feedbackItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun retour pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {feedbackItems.slice(0, 8).map((item) => (
                  <div key={item.id} className="p-3 rounded-lg bg-muted/50">
                    <p className="font-medium text-sm">{item.event_title || "Événement"}</p>
                    <p className="text-xs text-muted-foreground">{item.participant_name || item.participant_email || "Anonyme"} · {item.rating}/5</p>
                    <p className="text-xs text-muted-foreground">{item.comment || "Sans commentaire"}</p>
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