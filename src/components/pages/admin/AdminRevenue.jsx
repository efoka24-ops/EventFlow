import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRevenue } from "@/api/adminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  TrendingUp, CreditCard, CheckCircle2, Clock, XCircle, Trophy, CalendarDays,
} from "lucide-react";

const fmt = (n) => Number(n || 0).toLocaleString("fr-FR");
const fmtXAF = (n) => `${fmt(Math.round(Number(n || 0)))} FCFA`;

function KCard({ title, value, sub, icon: Icon, color, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground">{title}</p>
              {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AdminRevenue() {
  const [months, setMonths] = useState("6");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-revenue", months],
    queryFn: () => fetchRevenue(months),
    staleTime: 60_000,
  });

  const s = data?.summary || {};
  const monthly = data?.monthly || [];
  const topEvents = data?.top_events || [];
  const topOrganizers = data?.top_organizers || [];

  const commissionRate = 0.1;
  const commission = Number(s.total_revenue || 0) * commissionRate;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Revenus & Commissions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Suivi financier de la plateforme EventFlow</p>
        </div>
        <Select value={months} onValueChange={setMonths}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 mois</SelectItem>
            <SelectItem value="6">6 mois</SelectItem>
            <SelectItem value="12">12 mois</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KCard title="Revenus totaux" value={fmtXAF(s.total_revenue)} sub="Tous paiements complétés" icon={TrendingUp} color="bg-emerald-100 text-emerald-700" delay={0} />
        <KCard title="30 derniers jours" value={fmtXAF(s.last_30d)} icon={CalendarDays} color="bg-blue-100 text-blue-700" delay={0.05} />
        <KCard title="Commission EventFlow (10%)" value={fmtXAF(commission)} sub="Calculée sur revenus complétés" icon={Trophy} color="bg-violet-100 text-violet-700" delay={0.1} />
        <KCard title="Transaction moyenne" value={fmtXAF(s.avg_transaction)} icon={CreditCard} color="bg-amber-100 text-amber-700" delay={0.15} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Paiements complétés", value: fmt(s.completed_count), icon: CheckCircle2, color: "text-emerald-600" },
          { label: "En attente", value: fmt(s.pending_count), icon: Clock, color: "text-amber-600" },
          { label: "Échoués", value: fmt(s.failed_count), icon: XCircle, color: "text-red-600" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <div>
                <p className="font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Revenus mensuels</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {monthly.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Pas de données</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => fmtXAF(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revGrad)" strokeWidth={2} name="Revenus" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top événements */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />Top événements par revenus
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucune donnée</p>
            ) : (
              <div className="space-y-2">
                {topEvents.map((e, i) => (
                  <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-100 text-slate-700" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{e.tickets_sold} billet(s) · {e.category}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-700 shrink-0">{fmtXAF(e.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top organisateurs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />Top organisateurs par revenus
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topOrganizers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucune donnée</p>
            ) : (
              <div className="space-y-2">
                {topOrganizers.map((o, i) => (
                  <div key={o.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-100 text-slate-700" : "bg-muted text-muted-foreground"}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{o.full_name}</p>
                      <p className="text-xs text-muted-foreground">{o.events_count} événement(s)</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-700 shrink-0">{fmtXAF(o.total_revenue)}</span>
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
