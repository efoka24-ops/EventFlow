import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { listRegistrations, updateRegistration } from "@/api/registrationsApi";
import { listMyEvents, deleteEvent } from "@/api/eventsApi";
import { listSponsors, createSponsor, updateSponsor, deleteSponsor } from "@/api/sponsorsApi";
import { apiPost } from "@/api/apiClient";
import { getCreatorUser } from "@/lib/creatorSession";
import { trackUserAction } from "@/lib/trackUserAction";
import { creatorLogout, fetchMe, updateCreatorProfile } from "@/api/authApi";
import { uploadImage } from "@/api/uploadApi";
import EventFormDialog from "@/components/admin/EventFormDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Plus, CalendarDays, Users, BarChart3, CheckCircle2,
  Clock, MapPin, LogOut, Settings, Eye, Edit2, Trash2,
  FileSpreadsheet, MessageSquare, Star, Loader2,
  Mail, Phone, Send, UserCircle2, DollarSign, Ticket, RefreshCcw,
  Building2, Globe, ImagePlus, X, AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { REGISTRATION_STATUS, getCategoryLabel } from "@/lib/constants";

// ── Helpers ────────────────────────────────────────────────────────────────
const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#10b981", "#f59e0b", "#ef4444"];

const STATUS_CFG = {
  publie: { label: "Publié", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  brouillon: { label: "Brouillon", color: "bg-muted text-muted-foreground" },
  annule: { label: "Annulé", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  termine: { label: "Terminé", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.38, delay },
});

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, iconClass = "text-primary", bgClass = "bg-primary/10" }) {
  return (
    <Card className="border-border/50 hover:shadow-md transition-shadow">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className={`w-9 h-9 rounded-xl ${bgClass} flex items-center justify-center shrink-0`}>
            <Icon className={`w-4 h-4 ${iconClass}`} />
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold leading-none">{value}</p>
            {sub !== undefined && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════
export default function UserDashboard() {
  const user = getCreatorUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Profile / settings state ───────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({ full_name: "", email: "", phone: "" });
  const [pwdForm, setPwdForm] = useState({ current_password: "", new_password: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // ── Event management state ─────────────────────────────────────────────
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteEventId, setDeleteEventId] = useState(null);
  const [deletingEvent, setDeletingEvent] = useState(false);

  // ── Participants state ─────────────────────────────────────────────────
  const [selectedEventId, setSelectedEventId] = useState("all");
  const [regSearch, setRegSearch] = useState("");
  const [regStatusFilter, setRegStatusFilter] = useState("all");
  const [validatingId, setValidatingId] = useState(null);

  // ── Messaging state ────────────────────────────────────────────────────
  const [msgEventId, setMsgEventId] = useState("all");
  const [msgSubject, setMsgSubject] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgPreviewOpen, setMsgPreviewOpen] = useState(false);
  const [msgResult, setMsgResult] = useState(null);

  // ── Sponsors state ─────────────────────────────────────────────────────
  const [sponsorEventId, setSponsorEventId] = useState("all");
  const [sponsorForm, setSponsorForm] = useState({ name: "", logo_url: "", website_url: "", level: "bronze", description: "" });
  const [sponsorDialogOpen, setSponsorDialogOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [deleteSponsorId, setDeleteSponsorId] = useState(null);
  const [savingSponsor, setSavingSponsor] = useState(false);
  const [logoPicking, setLogoPicking] = useState(false);
  const logoFileInputRef = useRef(null);

  // ── Queries ────────────────────────────────────────────────────────────
  const { data: me } = useQuery({
    queryKey: ["creator-me"],
    queryFn: () => fetchMe(),
    enabled: Boolean(user),
    refetchOnMount: "always",
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["dashboard-events"],
    queryFn: () => listMyEvents(),
    enabled: Boolean(user),
    refetchOnMount: "always",
  });

  const { data: registrations = [], isLoading: regsLoading } = useQuery({
    queryKey: ["dashboard-registrations"],
    queryFn: () => listRegistrations({ sort: "-created_date" }),
    enabled: Boolean(user),
    refetchOnMount: "always",
  });

  const { data: sponsors = [], isLoading: sponsorsLoading } = useQuery({
    queryKey: ["dashboard-sponsors", sponsorEventId],
    queryFn: () => listSponsors(sponsorEventId && sponsorEventId !== "all" ? { event_id: sponsorEventId } : {}),
    enabled: Boolean(user),
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (!me) return;
    setProfileForm({ full_name: me.full_name || "", email: me.email || "", phone: me.phone || "" });
  }, [me]);

  // ── Derived data ───────────────────────────────────────────────────────
  const regByEvent = useMemo(() =>
    registrations.reduce((acc, r) => {
      if (!acc[r.event_id]) acc[r.event_id] = [];
      acc[r.event_id].push(r);
      return acc;
    }, {}), [registrations]);

  const stats = useMemo(() => {
    const validated = registrations.filter((r) => r.status === "validee").length;
    const pending = registrations.filter((r) => r.status === "en_attente").length;
    const paymentPending = registrations.filter((r) => r.status === "en_attente_paiement").length;
    const revenue = events.reduce((sum, ev) => {
      const evRegs = regByEvent[ev.id] || [];
      const paid = evRegs.filter((r) => r.status === "validee").length;
      return sum + (paid * (ev.price || 0));
    }, 0);
    const upcoming = events.filter((e) => e.date_start && new Date(e.date_start) > new Date()).length;
    return { totalEvents: events.length, upcoming, totalRegs: registrations.length, validated, pending, paymentPending, revenue };
  }, [registrations, events, regByEvent]);

  // ── Participants filters ───────────────────────────────────────────────
  const filteredRegs = useMemo(() => {
    let list = selectedEventId === "all" ? registrations : (regByEvent[selectedEventId] || []);
    if (regStatusFilter !== "all") list = list.filter((r) => r.status === regStatusFilter);
    if (regSearch) {
      const q = regSearch.toLowerCase();
      list = list.filter((r) =>
        `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q) ||
        (r.phone || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [registrations, regByEvent, selectedEventId, regStatusFilter, regSearch]);

  // ── Charts data ────────────────────────────────────────────────────────
  const registrationsByEvent = useMemo(() =>
    events.slice(0, 7).map((ev) => ({
      name: ev.title.length > 18 ? ev.title.slice(0, 18) + "…" : ev.title,
      inscriptions: (regByEvent[ev.id] || []).length,
      validées: (regByEvent[ev.id] || []).filter((r) => r.status === "validee").length,
    })), [events, regByEvent]);

  const statusPieData = useMemo(() => {
    const map = {};
    registrations.forEach((r) => {
      const label = REGISTRATION_STATUS[r.status]?.label || r.status;
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [registrations]);

  // ── Revenue per event ──────────────────────────────────────────────────
  const revenueByEvent = useMemo(() =>
    events
      .filter((ev) => (ev.price || 0) > 0)
      .map((ev) => {
        const evRegs = regByEvent[ev.id] || [];
        const paid = evRegs.filter((r) => r.status === "validee").length;
        return {
          event: ev,
          total: paid * (ev.price || 0),
          paid,
          pending: evRegs.filter((r) => r.status === "en_attente_paiement").length,
          registrations: evRegs.length,
        };
      })
      .sort((a, b) => b.total - a.total), [events, regByEvent]);

  // ── Actions ────────────────────────────────────────────────────────────
  const handleValidate = async (reg) => {
    setValidatingId(reg.id);
    try {
      await updateRegistration(reg.id, { status: "validee", validated_date: new Date().toISOString(), notification_status: "sent", notification_sent_at: new Date().toISOString() });
      queryClient.invalidateQueries({ queryKey: ["dashboard-registrations"] });
      toast.success("Inscription validée");
    } catch { toast.error("Impossible de valider"); }
    finally { setValidatingId(null); }
  };

  const handleRefuse = async (reg) => {
    try {
      await updateRegistration(reg.id, { status: "refusee", refused_date: new Date().toISOString() });
      queryClient.invalidateQueries({ queryKey: ["dashboard-registrations"] });
      toast.success("Inscription refusée");
    } catch { toast.error("Impossible de refuser"); }
  };

  const handleDeleteEvent = async () => {
    if (!deleteEventId) return;
    setDeletingEvent(true);
    try {
      await deleteEvent(deleteEventId);
      queryClient.invalidateQueries({ queryKey: ["dashboard-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Événement supprimé");
    } catch { toast.error("Impossible de supprimer l'événement"); }
    finally { setDeletingEvent(false); setDeleteEventId(null); }
  };

  const handleExportExcel = (regs, filename = "participants") => {
    if (!regs.length) { toast.error("Aucune donnée à exporter"); return; }
    const rows = regs.map((r) => ({
      prénom: r.first_name || "",
      nom: r.last_name || "",
      email: r.email || "",
      téléphone: r.phone || "",
      statut: REGISTRATION_STATUS[r.status]?.label || r.status,
      date: r.created_date ? format(new Date(r.created_date), "dd/MM/yyyy HH:mm", { locale: fr }) : "",
      ville: r.geo_city || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Participants");
    XLSX.writeFile(wb, `${filename}-${Date.now()}.xlsx`);
    toast.success("Export Excel généré");
  };

  const handleSendMessage = async () => {
    if (!msgSubject.trim() || !msgBody.trim()) { toast.error("Objet et message requis"); return; }
    setMsgSending(true);
    try {
      const payload = { subject: msgSubject.trim(), body: msgBody.trim() };
      if (msgEventId !== "all") payload.event_id = msgEventId;
      const result = await apiPost("/notifications/send", payload);
      queryClient.invalidateQueries({ queryKey: ["dashboard-registrations"] });
      setMsgResult(result);
      if (result.sent > 0) {
        toast.success(`${result.sent} email(s) envoyé(s) avec succès !`);
      } else if (result.skipped) {
        toast.info("SMTP non configuré — les participants ont été marqués comme notifiés.");
      }
      setMsgSubject(""); setMsgBody(""); setMsgPreviewOpen(false);
    } catch { toast.error("Erreur lors de l'envoi"); }
    finally { setMsgSending(false); }
  };

  const handleSaveSponsor = async () => {
    if (!sponsorForm.name.trim()) { toast.error("Le nom du sponsor est requis"); return; }
    if (!sponsorEventId || sponsorEventId === "all") { toast.error("Sélectionnez un événement"); return; }

    const normalizedLogoPath = String(sponsorForm.logo_url || "").trim().replace(/\\/g, "/");
    const normalizedPayload = {
      ...sponsorForm,
      logo_url: normalizedLogoPath,
    };

    setSavingSponsor(true);
    try {
      if (editingSponsor) {
        await updateSponsor(editingSponsor.id, normalizedPayload);
        trackUserAction({
          action: "sponsor_updated",
          user_email: user?.email || null,
          user_phone: user?.phone || null,
          event_id: sponsorEventId,
          context: "organizer_dashboard_sponsors",
          metadata: {
            sponsor_id: editingSponsor.id,
            sponsor_name: normalizedPayload.name,
            logo_path: normalizedPayload.logo_url || null,
            sponsor_level: normalizedPayload.level,
          },
        });
        toast.success("Sponsor mis à jour");
      } else {
        const created = await createSponsor({ ...normalizedPayload, event_id: sponsorEventId });
        trackUserAction({
          action: "sponsor_created",
          user_email: user?.email || null,
          user_phone: user?.phone || null,
          event_id: sponsorEventId,
          context: "organizer_dashboard_sponsors",
          metadata: {
            sponsor_id: created?.id || null,
            sponsor_name: normalizedPayload.name,
            logo_path: normalizedPayload.logo_url || null,
            sponsor_level: normalizedPayload.level,
          },
        });
        toast.success("Sponsor ajouté");
      }
      queryClient.invalidateQueries({ queryKey: ["dashboard-sponsors"] });
      setSponsorDialogOpen(false);
      setEditingSponsor(null);
      setSponsorForm({ name: "", logo_url: "", website_url: "", level: "bronze", description: "" });
    } catch (err) { toast.error(err?.message || "Erreur"); }
    finally { setSavingSponsor(false); }
  };

  const handleDeleteSponsor = async () => {
    if (!deleteSponsorId) return;
    try {
      const deletingSponsor = sponsors.find((sp) => sp.id === deleteSponsorId);
      await deleteSponsor(deleteSponsorId);
      trackUserAction({
        action: "sponsor_deleted",
        user_email: user?.email || null,
        user_phone: user?.phone || null,
        event_id: deletingSponsor?.event_id || null,
        context: "organizer_dashboard_sponsors",
        metadata: {
          sponsor_id: deleteSponsorId,
          sponsor_name: deletingSponsor?.name || null,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard-sponsors"] });
      toast.success("Sponsor supprimé");
    } catch { toast.error("Impossible de supprimer"); }
    finally { setDeleteSponsorId(null); }
  };

  const handlePickSponsorLogo = async (evt) => {
    const file = evt?.target?.files?.[0];
    if (!file) return;

    setLogoPicking(true);
    try {
      const imageValue = await uploadImage(file);
      setSponsorForm((prev) => ({ ...prev, logo_url: imageValue }));
      toast.success(`Logo sélectionné: ${file.name}`);
    } catch {
      toast.error("Impossible de charger ce fichier logo.");
    } finally {
      setLogoPicking(false);
      if (evt?.target) evt.target.value = "";
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateCreatorProfile({ full_name: profileForm.full_name, email: profileForm.email, phone: profileForm.phone });
      toast.success("Profil mis à jour");
    } catch (err) { toast.error(err?.message || "Impossible de mettre à jour"); }
    finally { setSavingProfile(false); }
  };

  const savePassword = async () => {
    if (!pwdForm.current_password || !pwdForm.new_password) { toast.error("Renseignez les deux mots de passe"); return; }
    setSavingPassword(true);
    try {
      await updateCreatorProfile({ current_password: pwdForm.current_password, new_password: pwdForm.new_password });
      setPwdForm({ current_password: "", new_password: "" });
      toast.success("Mot de passe mis à jour");
    } catch (err) { toast.error(err?.message || "Impossible de mettre à jour"); }
    finally { setSavingPassword(false); }
  };

  const handleLogout = () => { creatorLogout(); toast.success("Déconnexion réussie"); navigate("/"); };

  // ── Not logged in ──────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <UserCircle2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
        <h2 className="text-2xl font-bold mb-2">Connexion requise</h2>
        <p className="text-muted-foreground mb-6">Connectez-vous pour accéder à votre espace organisateur.</p>
        <Link to="/submit-event?auth=login"><Button className="rounded-full">Se connecter</Button></Link>
      </div>
    );
  }

  const initials = (user.full_name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <motion.div {...fadeUp()} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-14 h-14 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-extrabold">{user.full_name}</h1>
            <p className="text-sm text-muted-foreground">{user.email || user.phone} · Organisateur</p>
          </div>
        </div>
        <Button onClick={() => { setEditingEvent(null); setFormDialogOpen(true); }} className="gap-2 rounded-full">
          <Plus className="w-4 h-4" /> Créer un événement
        </Button>
      </motion.div>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0.04)} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={CalendarDays} label="Événements" value={stats.totalEvents} sub={`${stats.upcoming} à venir`} />
        <StatCard icon={Users} label="Participants" value={stats.totalRegs} sub={`${stats.validated} validés`} iconClass="text-violet-500" bgClass="bg-violet-500/10" />
        <StatCard icon={DollarSign} label="Revenus estimés" value={`${stats.revenue.toLocaleString()} F`} sub="billets validés" iconClass="text-emerald-600" bgClass="bg-emerald-500/10" />
        <StatCard icon={Clock} label="En attente" value={stats.pending + stats.paymentPending} sub="à traiter" iconClass="text-amber-600" bgClass="bg-amber-500/10" />
      </motion.div>

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0.08)}>
        <Tabs defaultValue="overview">
          <div className="overflow-x-auto pb-1">
            <TabsList className="rounded-full w-max">
              <TabsTrigger value="overview" className="rounded-full gap-1.5"><BarChart3 className="w-3.5 h-3.5" />Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="events" className="rounded-full gap-1.5"><CalendarDays className="w-3.5 h-3.5" />Événements</TabsTrigger>
              <TabsTrigger value="participants" className="rounded-full gap-1.5"><Users className="w-3.5 h-3.5" />Participants</TabsTrigger>
              <TabsTrigger value="revenue" className="rounded-full gap-1.5"><DollarSign className="w-3.5 h-3.5" />Revenus</TabsTrigger>
              <TabsTrigger value="messaging" className="rounded-full gap-1.5"><MessageSquare className="w-3.5 h-3.5" />Messagerie</TabsTrigger>
              <TabsTrigger value="sponsors" className="rounded-full gap-1.5"><Building2 className="w-3.5 h-3.5" />Sponsors</TabsTrigger>
              <TabsTrigger value="settings" className="rounded-full gap-1.5"><Settings className="w-3.5 h-3.5" />Paramètres</TabsTrigger>
            </TabsList>
          </div>

          {/* ── VUE D'ENSEMBLE ────────────────────────────────────────── */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Inscriptions par événement */}
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" /> Inscriptions par événement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {registrationsByEvent.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">Aucune donnée</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={registrationsByEvent} margin={{ top: 4, right: 4, left: -20, bottom: 40 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="inscriptions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="validées" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Statuts inscriptions */}
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-primary" /> Répartition par statut
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statusPieData.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">Aucune inscription</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                          {statusPieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend iconType="circle" iconSize={8} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick actions */}
            <Card className="border-border/50">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Accès rapide</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Plus, label: "Créer un événement", action: () => { setEditingEvent(null); setFormDialogOpen(true); } },
                  { icon: FileSpreadsheet, label: "Exporter participants", action: () => handleExportExcel(registrations, "tous-participants") },
                  { icon: MessageSquare, label: "Messagerie", tab: "messaging" },
                  { icon: Eye, label: "Voir mes événements", link: "/events" },
                ].map(({ icon: Icon, label, action, tab, link }) => (
                  link ? (
                    <Link key={label} to={link}>
                      <button className="w-full h-auto py-4 flex flex-col items-center gap-2 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-muted/40 transition-all">
                        <Icon className="w-5 h-5 text-primary" />
                        <span className="text-xs font-medium text-center leading-tight">{label}</span>
                      </button>
                    </Link>
                  ) : (
                    <button key={label} onClick={action} className="w-full h-auto py-4 flex flex-col items-center gap-2 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-muted/40 transition-all">
                      <Icon className="w-5 h-5 text-primary" />
                      <span className="text-xs font-medium text-center leading-tight">{label}</span>
                    </button>
                  )
                ))}
              </CardContent>
            </Card>

            {/* Recent registrations */}
            <Card className="border-border/50">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Dernières inscriptions</CardTitle>
                <Badge variant="secondary" className="text-xs">{registrations.length}</Badge>
              </CardHeader>
              <CardContent>
                {registrations.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Aucune inscription pour le moment.</p>
                ) : (
                  <div className="space-y-2">
                    {registrations.slice(0, 5).map((reg) => {
                      const sm = REGISTRATION_STATUS[reg.status] || { label: reg.status, color: "bg-muted" };
                      return (
                        <div key={reg.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                              {(reg.first_name || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{reg.first_name} {reg.last_name}</p>
                              <p className="text-xs text-muted-foreground">{reg.email || reg.phone || `#${reg.id?.slice(-6).toUpperCase()}`}</p>
                            </div>
                          </div>
                          <Badge className={`${sm.color} text-xs shrink-0`}>{sm.label}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ÉVÉNEMENTS ────────────────────────────────────────────── */}
          <TabsContent value="events" className="mt-6">
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Mes événements ({events.length})</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["dashboard-events"] })} className="gap-1 text-xs">
                    <RefreshCcw className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" className="gap-2 rounded-full" onClick={() => { setEditingEvent(null); setFormDialogOpen(true); }}>
                    <Plus className="w-3.5 h-3.5" /> Créer
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
                ) : events.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarDays className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="font-semibold mb-1">Aucun événement</p>
                    <p className="text-sm text-muted-foreground mb-4">Créez votre premier événement maintenant.</p>
                    <Button className="rounded-full gap-2" onClick={() => { setEditingEvent(null); setFormDialogOpen(true); }}>
                      <Plus className="w-4 h-4" /> Créer un événement
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((ev) => {
                      const evRegs = regByEvent[ev.id] || [];
                      const validated = evRegs.filter((r) => r.status === "validee").length;
                      const sc = STATUS_CFG[ev.status] || STATUS_CFG.brouillon;
                      const isUpcoming = ev.date_start && new Date(ev.date_start) > new Date();
                      const revenue = validated * (ev.price || 0);

                      return (
                        <div key={ev.id} className="flex items-start gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/20 transition-colors">
                          <div className="w-12 shrink-0 text-center">
                            {ev.date_start ? (
                              <>
                                <div className="text-xs font-bold text-primary uppercase">{format(new Date(ev.date_start), "MMM", { locale: fr })}</div>
                                <div className="text-xl font-extrabold">{format(new Date(ev.date_start), "d")}</div>
                              </>
                            ) : <CalendarDays className="w-5 h-5 text-muted-foreground mx-auto mt-1" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-bold text-sm leading-snug">{ev.title}</p>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {isUpcoming && <Badge variant="outline" className="text-xs text-primary border-primary/40">À venir</Badge>}
                                <Badge className={`${sc.color} text-xs`}>{sc.label}</Badge>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground mb-2">
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.city}</span>
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{evRegs.length} inscrits · {validated} validés</span>
                              {revenue > 0 && <span className="flex items-center gap-1 text-emerald-600 font-medium"><DollarSign className="w-3 h-3" />{revenue.toLocaleString()} FCFA</span>}
                              {!ev.price || ev.price === 0 ? <span className="text-emerald-600">Gratuit</span> : <span className="text-primary">{ev.price?.toLocaleString()} FCFA/billet</span>}
                            </div>
                            {ev.max_participants && (
                              <div className="w-full max-w-xs">
                                <Progress value={Math.min((evRegs.length / ev.max_participants) * 100, 100)} className="h-1.5" />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Link to={`/events/${ev.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Voir"><Eye className="w-4 h-4" /></Button>
                            </Link>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Modifier" onClick={() => { setEditingEvent(ev); setFormDialogOpen(true); }}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" title="Supprimer" onClick={() => setDeleteEventId(ev.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── PARTICIPANTS ───────────────────────────────────────────── */}
          <TabsContent value="participants" className="mt-6 space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Tous les événements" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les événements</SelectItem>
                  {events.map((ev) => <SelectItem key={ev.id} value={ev.id}>{ev.title.slice(0, 40)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={regStatusFilter} onValueChange={setRegStatusFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {Object.entries(REGISTRATION_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Chercher nom, email, tél..." value={regSearch} onChange={(e) => setRegSearch(e.target.value)} className="w-56" />
              <Button variant="outline" className="gap-2 rounded-full ml-auto" onClick={() => handleExportExcel(filteredRegs, "participants")}>
                <FileSpreadsheet className="w-4 h-4" /> Export Excel
              </Button>
            </div>

            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{filteredRegs.length} participant(s)</CardTitle>
              </CardHeader>
              <CardContent>
                {regsLoading ? (
                  <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-12 rounded bg-muted animate-pulse" />)}</div>
                ) : filteredRegs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Aucun participant trouvé.</p>
                ) : (
                  <div className="space-y-2">
                    {filteredRegs.map((reg) => {
                      const sm = REGISTRATION_STATUS[reg.status] || { label: reg.status, color: "bg-muted" };
                      const evTitle = events.find((e) => e.id === reg.event_id)?.title || "—";
                      return (
                        <div key={reg.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:bg-muted/20 transition-colors">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                            {(reg.first_name || "?")[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">{reg.first_name} {reg.last_name}</p>
                            <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                              {reg.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{reg.email}</span>}
                              {reg.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{reg.phone}</span>}
                              <span className="truncate max-w-[140px]">{evTitle}</span>
                            </div>
                          </div>
                          <Badge className={`${sm.color} text-xs shrink-0`}>{sm.label}</Badge>
                          {reg.status === "en_attente" && (
                            <div className="flex gap-1 shrink-0">
                              <Button size="sm" className="h-7 px-2 text-xs gap-1 rounded-full" onClick={() => handleValidate(reg)} disabled={validatingId === reg.id}>
                                {validatingId === reg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Valider
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs rounded-full text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleRefuse(reg)}>
                                Refuser
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── REVENUS ───────────────────────────────────────────────── */}
          <TabsContent value="revenue" className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard icon={DollarSign} label="Revenus totaux estimés" value={`${stats.revenue.toLocaleString()} F`} sub="billets validés payants" iconClass="text-emerald-600" bgClass="bg-emerald-500/10" />
              <StatCard icon={Ticket} label="Billets validés payants" value={revenueByEvent.reduce((s, r) => s + r.paid, 0)} iconClass="text-primary" bgClass="bg-primary/10" />
              <StatCard icon={Clock} label="Paiements en attente" value={revenueByEvent.reduce((s, r) => s + r.pending, 0)} iconClass="text-amber-600" bgClass="bg-amber-500/10" />
            </div>

            {revenueByEvent.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="font-semibold mb-1">Aucun événement payant</p>
                  <p className="text-sm text-muted-foreground">Créez un événement payant pour voir vos revenus ici.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Revenus par événement</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {revenueByEvent.map(({ event: ev, total, paid, pending, registrations: evRegs }) => (
                    <div key={ev.id} className="p-4 rounded-xl border border-border/50 hover:border-primary/20 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="font-bold text-sm">{ev.title}</p>
                          <p className="text-xs text-muted-foreground">{ev.price?.toLocaleString()} FCFA/billet · {evRegs} inscrits</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-extrabold text-emerald-600">{total.toLocaleString()} FCFA</p>
                          <p className="text-xs text-muted-foreground">{paid} billet{paid > 1 ? "s" : ""} payé{paid > 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3 h-3" />{paid} validés</span>
                        <span className="flex items-center gap-1 text-amber-600"><Clock className="w-3 h-3" />{pending} en attente paiement</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── MESSAGERIE ────────────────────────────────────────────── */}
          <TabsContent value="messaging" className="mt-6 space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" /> Envoyer un message aux participants
                </CardTitle>
                <p className="text-xs text-muted-foreground">Le message sera marqué comme envoyé pour les participants ayant un email.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Destinataires — Événement</Label>
                  <Select value={msgEventId} onValueChange={setMsgEventId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les événements" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous mes participants ({registrations.filter((r) => r.email).length} emails)</SelectItem>
                      {events.map((ev) => {
                        const count = (regByEvent[ev.id] || []).filter((r) => r.email).length;
                        return <SelectItem key={ev.id} value={ev.id}>{ev.title.slice(0, 45)} ({count} emails)</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Objet *</Label>
                  <Input value={msgSubject} onChange={(e) => setMsgSubject(e.target.value)} placeholder="Rappel : votre événement commence demain !" />
                </div>

                <div className="space-y-1.5">
                  <Label>Message *</Label>
                  <Textarea value={msgBody} onChange={(e) => setMsgBody(e.target.value)} rows={6} placeholder="Bonjour,&#10;&#10;Nous vous rappelons que l'événement [Titre] aura lieu le [Date] à [Lieu].&#10;&#10;À très bientôt !" />
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="gap-2 rounded-full" onClick={() => setMsgPreviewOpen(true)} disabled={!msgSubject || !msgBody}>
                    <Eye className="w-4 h-4" /> Aperçu
                  </Button>
                  <Button className="gap-2 rounded-full flex-1" onClick={handleSendMessage} disabled={msgSending || !msgSubject || !msgBody}>
                    {msgSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {msgSending ? "Envoi en cours..." : "Envoyer le message"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notification history */}
            <Card className="border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Historique des notifications</CardTitle></CardHeader>
              <CardContent>
                {registrations.filter((r) => r.notification_sent_at).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Aucune notification envoyée pour le moment.</p>
                ) : (
                  <div className="space-y-2">
                    {registrations.filter((r) => r.notification_sent_at).slice(0, 10).map((reg) => (
                      <div key={reg.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0 text-sm">
                        <div>
                          <p className="font-medium">{reg.first_name} {reg.last_name}</p>
                          <p className="text-xs text-muted-foreground">{reg.email}</p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">Envoyée</Badge>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {reg.notification_sent_at && format(new Date(reg.notification_sent_at), "d MMM HH:mm", { locale: fr })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── SPONSORS ──────────────────────────────────────────────── */}
          <TabsContent value="sponsors" className="mt-6 space-y-4">
            {/* Filters + Add */}
            <div className="flex flex-wrap gap-3 items-center">
              <Select value={sponsorEventId} onValueChange={setSponsorEventId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Filtrer par événement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous mes événements</SelectItem>
                  {events.map((ev) => (
                    <SelectItem key={ev.id} value={ev.id}>{ev.title.slice(0, 45)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="gap-2 rounded-full ml-auto"
                onClick={() => {
                  if ((sponsorEventId === "all" || !sponsorEventId) && events.length > 0) setSponsorEventId(events[0].id);
                  setEditingSponsor(null);
                  setSponsorForm({ name: "", logo_url: "", website_url: "", level: "bronze", description: "" });
                  setSponsorDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4" /> Ajouter un sponsor
              </Button>
            </div>

            {/* Sponsor levels legend */}
            <div className="flex flex-wrap gap-2">
              {[
                { level: "or", label: "Or", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
                { level: "argent", label: "Argent", color: "bg-slate-100 text-slate-700 border-slate-300" },
                { level: "bronze", label: "Bronze", color: "bg-amber-100 text-amber-800 border-amber-300" },
                { level: "partenaire", label: "Partenaire", color: "bg-primary/10 text-primary border-primary/30" },
              ].map(({ level, label, color }) => (
                <Badge key={level} variant="outline" className={`text-xs ${color}`}>{label}</Badge>
              ))}
            </div>

            <Card className="border-border/50">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">{sponsors.length} sponsor(s)</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["dashboard-sponsors"] })}>
                  <RefreshCcw className="w-3.5 h-3.5" />
                </Button>
              </CardHeader>
              <CardContent>
                {sponsorsLoading ? (
                  <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}</div>
                ) : sponsors.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="font-semibold mb-1">Aucun sponsor</p>
                    <p className="text-sm text-muted-foreground mb-4">Ajoutez les sponsors de vos événements ici.</p>
                    <Button className="rounded-full gap-2" onClick={() => {
                      if ((sponsorEventId === "all" || !sponsorEventId) && events.length > 0) setSponsorEventId(events[0].id);
                      setEditingSponsor(null);
                      setSponsorDialogOpen(true);
                    }}>
                      <Plus className="w-4 h-4" /> Ajouter un sponsor
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sponsors.map((sp) => {
                      const levelColors = { or: "bg-yellow-100 text-yellow-800", argent: "bg-slate-100 text-slate-700", bronze: "bg-amber-100 text-amber-800", partenaire: "bg-primary/10 text-primary" };
                      const ev = events.find((e) => e.id === sp.event_id);
                      return (
                        <div key={sp.id} className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/20 transition-colors">
                          {sp.logo_url ? (
                            <img src={sp.logo_url} alt={sp.name} className="w-12 h-12 rounded-xl object-contain border border-border/40 bg-muted/30" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                              <Building2 className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-bold text-sm">{sp.name}</p>
                              <Badge className={`text-xs ${levelColors[sp.level] || "bg-muted"}`}>{sp.level}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                              {ev && <span className="truncate">{ev.title.slice(0, 35)}</span>}
                              {sp.website_url && (
                                <a href={sp.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                                  <Globe className="w-3 h-3" /> Site web
                                </a>
                              )}
                            </div>
                            {sp.description && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">{sp.description}</p>}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                              setEditingSponsor(sp);
                              setSponsorEventId(sp.event_id);
                              setSponsorForm({ name: sp.name, logo_url: sp.logo_url || "", website_url: sp.website_url || "", level: sp.level, description: sp.description || "" });
                              setSponsorDialogOpen(true);
                            }}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteSponsorId(sp.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── PARAMÈTRES ────────────────────────────────────────────── */}
          <TabsContent value="settings" className="mt-6 space-y-4">
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-sm">Profil organisateur</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5"><Label>Nom complet</Label><Input value={profileForm.full_name} onChange={(e) => setProfileForm((p) => ({ ...p, full_name: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={profileForm.email} onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>Téléphone</Label><Input value={profileForm.phone} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} /></div>
                </div>
                <Button onClick={saveProfile} disabled={savingProfile} className="rounded-full">
                  {savingProfile && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Enregistrer
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-sm">Changer le mot de passe</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Mot de passe actuel</Label><Input type="password" value={pwdForm.current_password} onChange={(e) => setPwdForm((p) => ({ ...p, current_password: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>Nouveau mot de passe</Label><Input type="password" value={pwdForm.new_password} onChange={(e) => setPwdForm((p) => ({ ...p, new_password: e.target.value }))} /></div>
                </div>
                <Button variant="outline" onClick={savePassword} disabled={savingPassword} className="rounded-full">
                  {savingPassword && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Mettre à jour
                </Button>
              </CardContent>
            </Card>

            <Card className="border-destructive/20">
              <CardHeader><CardTitle className="text-sm text-destructive">Zone dangereuse</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Se déconnecter de votre espace organisateur.</p>
                <Button variant="destructive" onClick={handleLogout} className="gap-2 rounded-full">
                  <LogOut className="w-4 h-4" /> Se déconnecter
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ── Dialogs ────────────────────────────────────────────────────── */}
      <EventFormDialog
        open={formDialogOpen}
        onClose={() => { setFormDialogOpen(false); setEditingEvent(null); }}
        event={editingEvent}
      />

      <AlertDialog open={!!deleteEventId} onOpenChange={(o) => { if (!o) setDeleteEventId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'événement ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible. Les inscriptions associées seront également supprimées.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive hover:bg-destructive/90">
              {deletingEvent && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Message preview dialog */}
      <Dialog open={msgPreviewOpen} onOpenChange={setMsgPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Aperçu du message</DialogTitle>
            <DialogDescription>Vérifiez votre message avant envoi.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 p-4 rounded-xl bg-muted/40 border border-border/40 text-sm">
            <p><span className="font-semibold text-muted-foreground">Objet :</span> {msgSubject}</p>
            <hr className="border-border/40" />
            <p className="whitespace-pre-wrap leading-relaxed">{msgBody}</p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="rounded-full" onClick={() => setMsgPreviewOpen(false)}>Modifier</Button>
            <Button className="gap-2 rounded-full flex-1" onClick={handleSendMessage} disabled={msgSending}>
              {msgSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {msgSending ? "Envoi en cours..." : "Confirmer l'envoi"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sponsor form dialog */}
      <Dialog open={sponsorDialogOpen} onOpenChange={(o) => { if (!o) { setSponsorDialogOpen(false); setEditingSponsor(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSponsor ? "Modifier le sponsor" : "Ajouter un sponsor"}</DialogTitle>
            <DialogDescription>Associez un sponsor à l'un de vos événements.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Événement *</Label>
              <Select value={sponsorEventId} onValueChange={setSponsorEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un événement" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((ev) => <SelectItem key={ev.id} value={ev.id}>{ev.title.slice(0, 50)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nom du sponsor *</Label>
                <Input value={sponsorForm.name} onChange={(e) => setSponsorForm((p) => ({ ...p, name: e.target.value }))} placeholder="Orange, MTN, Total..." />
              </div>
              <div className="space-y-1.5">
                <Label>Niveau</Label>
                <Select value={sponsorForm.level} onValueChange={(v) => setSponsorForm((p) => ({ ...p, level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="or">Or</SelectItem>
                    <SelectItem value="argent">Argent</SelectItem>
                    <SelectItem value="bronze">Bronze</SelectItem>
                    <SelectItem value="partenaire">Partenaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Logo du sponsor</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Input value={sponsorForm.logo_url} onChange={(e) => setSponsorForm((p) => ({ ...p, logo_url: e.target.value }))} placeholder="/assets/sponsors/mon-logo.webp" />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full gap-2"
                  onClick={() => logoFileInputRef.current?.click()}
                  disabled={logoPicking}
                >
                  {logoPicking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                  Choisir dans le répertoire
                </Button>
                {sponsorForm.logo_url && (
                  <Button type="button" variant="ghost" className="rounded-full gap-1.5" onClick={() => setSponsorForm((p) => ({ ...p, logo_url: "" }))}>
                    <X className="w-3.5 h-3.5" /> Retirer
                  </Button>
                )}
              </div>
              <input
                ref={logoFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePickSponsorLogo}
              />
              <p className="text-xs text-muted-foreground">Cliquez sur le bouton pour parcourir vos fichiers, ou saisissez un chemin relatif.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Site web</Label>
              <Input value={sponsorForm.website_url} onChange={(e) => setSponsorForm((p) => ({ ...p, website_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>Description courte</Label>
              <Textarea value={sponsorForm.description} onChange={(e) => setSponsorForm((p) => ({ ...p, description: e.target.value }))} rows={2} placeholder="Description du partenariat..." />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setSponsorDialogOpen(false)}>Annuler</Button>
            <Button className="rounded-full gap-2" onClick={handleSaveSponsor} disabled={savingSponsor}>
              {savingSponsor && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingSponsor ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete sponsor confirmation */}
      <AlertDialog open={!!deleteSponsorId} onOpenChange={(o) => { if (!o) setDeleteSponsorId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce sponsor ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSponsor} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
