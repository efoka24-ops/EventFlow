import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchAdminStats, fetchAdminGrowth } from "@/api/adminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  CalendarDays, Users, UserCog, CreditCard, TrendingUp,
  Clock, CheckCircle2, XCircle, Star, Globe2, ArrowRight,
  AlertTriangle, BarChart3, Zap,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

const fmt = (n) => Number(n || 0).toLocaleString("fr-FR");
const fmtXAF = (n) => `${fmt(Math.round(Number(n || 0)))} FCFA`;

function KPICard({ title, value, sub, icon: Icon, color, trend, to, delay = 0 }) {
  const card = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="hover:shadow-md transition-shadow cursor-default group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            {trend !== undefined && (
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${trend >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {trend >= 0 ? "+" : ""}{trend}%
              </span>
            )}
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{title}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
}

function StatusRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold">{fmt(value)}</span>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchAdminStats,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const { data: growth } = useQuery({
    queryKey: ["admin-growth"],
    queryFn: () => fetchAdminGrowth(6),
    staleTime: 300_000,
  });

  if (loadingStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const ev = stats?.events || {};
  const reg = stats?.registrations || {};
  const org = stats?.organizers || {};
  const pay = stats?.payments || {};
  const sess = stats?.sessions || {};

  // Build growth chart — merge registrations + events by month
  const growthData = (growth?.registrations || []).map((r) => {
    const ev = (growth?.events || []).find((e) => e.month === r.month);
    const org = (growth?.organizers || []).find((o) => o.month === r.month);
    return {
      month: r.month,
      inscriptions: parseInt(r.count),
      evenements: ev ? parseInt(ev.count) : 0,
      organisateurs: org ? parseInt(org.count) : 0,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Global</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Vue CEO — plateforme EventFlow en temps réel</p>
        </div>
        <div className="flex gap-2">
          {(stats?.pending_events || 0) > 0 && (
            <Link to="/admin/events">
              <Button variant="outline" size="sm" className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50">
                <AlertTriangle className="w-3.5 h-3.5" />
                {stats.pending_events} événement{stats.pending_events > 1 ? "s" : ""} à approuver
              </Button>
            </Link>
          )}
          <Link to="/admin/analytics">
            <Button size="sm" className="gap-2">
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Grid principale */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Événements total"
          value={fmt(ev.total)}
          sub={`${fmt(ev.published)} publiés · ${fmt(ev.upcoming)} à venir`}
          icon={CalendarDays}
          color="bg-blue-100 text-blue-700"
          to="/admin/events"
          delay={0}
        />
        <KPICard
          title="Inscriptions"
          value={fmt(reg.total)}
          sub={`${fmt(reg.last_30d)} ce mois · ${fmt(reg.last_24h)} aujourd'hui`}
          icon={Users}
          color="bg-emerald-100 text-emerald-700"
          to="/admin/registrations"
          delay={0.05}
        />
        <KPICard
          title="Organisateurs"
          value={fmt(org.total)}
          sub={`${fmt(org.verified)} vérifiés · ${fmt(org.new_this_month)} ce mois`}
          icon={UserCog}
          color="bg-violet-100 text-violet-700"
          to="/admin/organizers"
          delay={0.1}
        />
        <KPICard
          title="Revenus plateforme"
          value={fmtXAF(pay.completed_amount)}
          sub={`${fmt(pay.completed)} paiements confirmés`}
          icon={CreditCard}
          color="bg-amber-100 text-amber-700"
          to="/admin/revenue"
          delay={0.15}
        />
      </div>

      {/* Ligne 2 : métriques secondaires */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Sessions visiteurs"
          value={fmt(sess.total_sessions)}
          sub={`${fmt(sess.last_24h)} dernières 24h`}
          icon={Globe2}
          color="bg-sky-100 text-sky-700"
          delay={0.2}
        />
        <KPICard
          title="Revenus 30 derniers jours"
          value={fmtXAF(pay.last_30d_amount)}
          icon={TrendingUp}
          color="bg-rose-100 text-rose-700"
          to="/admin/revenue"
          delay={0.25}
        />
        <KPICard
          title="Événements en avant"
          value={fmt(stats?.featured_events)}
          icon={Star}
          color="bg-yellow-100 text-yellow-700"
          to="/admin/marketplace"
          delay={0.3}
        />
        <KPICard
          title="Organisateurs suspendus"
          value={fmt(org.suspended)}
          icon={XCircle}
          color="bg-red-100 text-red-700"
          to="/admin/organizers"
          delay={0.35}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Croissance — 6 derniers mois</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {growthData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Pas encore de données</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="inscGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="evGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="inscriptions" stroke="#10b981" fill="url(#inscGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="evenements" stroke="#3b82f6" fill="url(#evGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">État des inscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              <StatusRow label="Validées" value={reg.confirmed} color="bg-emerald-500" />
              <StatusRow label="En attente" value={reg.pending} color="bg-amber-500" />
              <StatusRow label="Annulées" value={reg.cancelled} color="bg-red-400" />
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Paiements</p>
              <StatusRow label="Complétés" value={pay.completed} color="bg-emerald-500" />
              <StatusRow label="En attente" value={pay.pending} color="bg-amber-500" />
              <StatusRow label="Échoués" value={pay.failed} color="bg-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent events + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Derniers événements */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Derniers événements</CardTitle>
            <Link to="/admin/events">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">Voir tout <ArrowRight className="w-3 h-3" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(stats?.recent_events || []).length === 0 && (
                <p className="text-sm text-muted-foreground">Aucun événement</p>
              )}
              {(stats?.recent_events || []).map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.city} · {e.registration_count} inscrit(s)</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs shrink-0 ${
                      e.status === "publie" ? "border-emerald-300 text-emerald-700 bg-emerald-50" :
                      e.status === "brouillon" ? "border-muted text-muted-foreground" :
                      "border-red-300 text-red-700 bg-red-50"
                    }`}
                  >
                    {e.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Approuver événements", to: "/admin/events", icon: CheckCircle2, color: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700", count: stats?.pending_events },
                { label: "Gérer organisateurs", to: "/admin/organizers", icon: UserCog, color: "bg-violet-50 hover:bg-violet-100 text-violet-700" },
                { label: "Voir paiements", to: "/admin/payments", icon: CreditCard, color: "bg-amber-50 hover:bg-amber-100 text-amber-700" },
                { label: "Analytics", to: "/admin/analytics", icon: BarChart3, color: "bg-sky-50 hover:bg-sky-100 text-sky-700" },
                { label: "Marketing", to: "/admin/marketing", icon: Zap, color: "bg-rose-50 hover:bg-rose-100 text-rose-700" },
                { label: "Paramètres", to: "/admin/settings", icon: Globe2, color: "bg-slate-50 hover:bg-slate-100 text-slate-700" },
              ].map(({ label, to, icon: Icon, color, count }) => (
                <Link key={to} to={to}>
                  <div className={`flex flex-col gap-1.5 p-3 rounded-xl transition-colors cursor-pointer ${color}`}>
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium leading-tight">{label}</span>
                    {count > 0 && <Badge className="w-fit bg-amber-500 text-white text-[10px] px-1 h-4">{count}</Badge>}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
