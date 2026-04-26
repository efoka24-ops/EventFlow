import { useQuery } from "@tanstack/react-query";
import { listSiteSessions, listEventFeedback } from "@/api/analyticsApi";
import { listEvents } from "@/api/eventsApi";
import { listRegistrations } from "@/api/registrationsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area, Legend,
} from "recharts";
import { Download, Globe2, Monitor, Smartphone, Clock, Users, Star, FileSpreadsheet } from "lucide-react";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#6b7280", "#8b5cf6", "#ec4899", "#06b6d4"];
const fmt = (n) => Number(n || 0).toLocaleString("fr-FR");

const downloadBlob = (content, fileName, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = fileName; a.click();
  URL.revokeObjectURL(url);
};

const toCsv = (rows) => {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [
    headers.join(";"),
    ...rows.map((row) => headers.map((h) => `"${String(row[h] ?? "").replaceAll('"', '""')}"`).join(";")),
  ].join("\n");
};

export default function AdminAnalytics() {
  const { data: sessions = [] } = useQuery({
    queryKey: ["admin-site-sessions"],
    queryFn: () => listSiteSessions({ sort: "-started_at" }),
    staleTime: 60_000,
  });

  const { data: feedback = [] } = useQuery({
    queryKey: ["admin-feedback"],
    queryFn: () => listEventFeedback({ sort: "-created_date" }),
    staleTime: 60_000,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["admin-events"],
    queryFn: () => listEvents({ sort: "-created_date" }),
    staleTime: 60_000,
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ["admin-registrations"],
    queryFn: () => listRegistrations({ sort: "-created_date" }),
    staleTime: 60_000,
  });

  // Aggregate data
  const totalMinutes = sessions.reduce((acc, s) => acc + Number(s.minutes_spent || 0), 0);
  const avgMinutes = sessions.length ? Math.round(totalMinutes / sessions.length) : 0;
  const avgFeedback = feedback.length
    ? (feedback.reduce((a, f) => a + Number(f.rating || 0), 0) / feedback.length).toFixed(1)
    : "—";

  const browserMap = {};
  const deviceMap = {};
  const osMap = {};
  const locationMap = {};
  const hourMap = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}h`, visits: 0 }));

  sessions.forEach((s) => {
    const browser = s.browser_full || s.browser || "Autre";
    browserMap[browser] = (browserMap[browser] || 0) + 1;
    const device = s.device_type || "Unknown";
    deviceMap[device] = (deviceMap[device] || 0) + 1;
    const os = s.os || "Unknown";
    osMap[os] = (osMap[os] || 0) + 1;
    const loc = s.country || s.city || "Inconnu";
    locationMap[loc] = (locationMap[loc] || 0) + 1;
    if (s.started_at) {
      const hour = new Date(s.started_at).getHours();
      hourMap[hour].visits += 1;
    }
  });

  const browserData = Object.entries(browserMap).map(([name, value]) => ({ name, value }));
  const deviceData = Object.entries(deviceMap).map(([name, value]) => ({ name, value }));
  const osData = Object.entries(osMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const locationData = Object.entries(locationMap)
    .map(([location, visits]) => ({ location, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10);

  // Registration funnel
  const totalVisitors = sessions.length;
  const totalRegs = registrations.length;
  const confirmedRegs = registrations.filter((r) => r.status === "validee").length;
  const conversionRate = totalVisitors ? ((totalRegs / totalVisitors) * 100).toFixed(1) : 0;

  const exportExcel = () => {
    const rows = sessions.map((s) => ({
      id: s.id, started_at: s.started_at, minutes_spent: s.minutes_spent,
      browser: s.browser_full || s.browser, os: s.os, device_type: s.device_type,
      country: s.country, city: s.city, referrer: s.referrer,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sessions");
    XLSX.writeFile(wb, `analytics-${Date.now()}.xlsx`);
  };

  const exportCsv = () => {
    const rows = sessions.map((s) => ({
      id: s.id, started_at: s.started_at, minutes_spent: s.minutes_spent,
      browser: s.browser_full || s.browser, os: s.os, device_type: s.device_type,
      country: s.country, city: s.city,
    }));
    downloadBlob(`\uFEFF${toCsv(rows)}`, `analytics-${Date.now()}.csv`, "text/csv;charset=utf-8;");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics Plateforme</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Statistiques avancées, comportement utilisateurs et trafic</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={exportCsv}>
            <Download className="w-3.5 h-3.5" />CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={exportExcel}>
            <FileSpreadsheet className="w-3.5 h-3.5" />Excel
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Sessions totales", value: fmt(sessions.length), icon: Globe2, color: "bg-blue-100 text-blue-700" },
          { label: "Temps moyen (min)", value: avgMinutes, icon: Clock, color: "bg-emerald-100 text-emerald-700" },
          { label: "Taux conversion", value: `${conversionRate}%`, icon: Users, color: "bg-violet-100 text-violet-700" },
          { label: "Note moyenne feedback", value: `${avgFeedback}/5`, icon: Star, color: "bg-amber-100 text-amber-700" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funnel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Funnel de conversion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Visiteurs", value: fmt(totalVisitors), color: "bg-blue-500" },
              { label: "Inscriptions", value: fmt(totalRegs), color: "bg-violet-500" },
              { label: "Confirmées", value: fmt(confirmedRegs), color: "bg-emerald-500" },
            ].map((step, i) => (
              <div key={step.label} className="relative">
                {i > 0 && <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">→</div>}
                <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-2`}>
                  <span className="text-white font-bold text-lg">{i + 1}</span>
                </div>
                <p className="text-2xl font-bold">{step.value}</p>
                <p className="text-sm text-muted-foreground">{step.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visites par heure */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Visites par heure du jour</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourMap} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="visits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Localisation */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Top 10 localisations</CardTitle></CardHeader>
          <CardContent className="h-56">
            {locationData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Aucune donnée</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationData} layout="vertical" margin={{ top: 4, right: 8, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="location" type="category" tick={{ fontSize: 10 }} width={60} />
                  <Tooltip />
                  <Bar dataKey="visits" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Navigateurs */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Navigateurs</CardTitle></CardHeader>
          <CardContent className="h-56">
            {browserData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Aucune donnée</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={browserData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {browserData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* OS & Devices */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Appareils & OS</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Types d'appareils</p>
                <div className="space-y-1.5">
                  {deviceData.map((d) => (
                    <div key={d.name} className="flex justify-between text-sm">
                      <span className="flex items-center gap-1.5">
                        {d.name === "mobile" ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                        {d.name}
                      </span>
                      <span className="font-semibold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Systèmes d'exploitation</p>
                <div className="space-y-1.5">
                  {osData.slice(0, 5).map((o) => (
                    <div key={o.name} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate">{o.name}</span>
                      <span className="font-semibold">{o.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Feedback participants — {feedback.length} avis · Moyenne {avgFeedback}/5</CardTitle>
        </CardHeader>
        <CardContent>
          {feedback.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucun feedback</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {feedback.slice(0, 20).map((f) => (
                <div key={f.id} className="p-3 rounded-lg bg-muted/40 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{f.event_title || "Événement"}</span>
                    <span className="font-bold text-amber-600">★ {f.rating}/5</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{f.participant_name || f.participant_email || "Anonyme"}</p>
                  {f.comment && <p className="text-xs mt-1 line-clamp-2">{f.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
