import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { listRegistrations } from "@/api/registrationsApi";
import { listMyEvents } from "@/api/eventsApi";
import { getCreatorUser } from "@/lib/creatorSession";
import { creatorLogout, fetchMe, updateCreatorProfile } from "@/api/authApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Ticket, PlusSquare, CalendarDays, UserCircle2, Briefcase } from "lucide-react";

export default function UserDashboard() {
  const user = getCreatorUser();
  const navigate = useNavigate();
  const [profileForm, setProfileForm] = useState({ full_name: "", email: "", phone: "" });
  const [pwdForm, setPwdForm] = useState({ current_password: "", new_password: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["creator-me"],
    queryFn: () => fetchMe(),
    enabled: Boolean(user),
    refetchOnMount: "always",
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ["dashboard-registrations"],
    queryFn: () => listRegistrations({ sort: "-created_date" }),
    enabled: Boolean(user),
    refetchOnMount: "always",
  });

  const { data: events = [] } = useQuery({
    queryKey: ["dashboard-events"],
    queryFn: () => listMyEvents(),
    enabled: Boolean(user),
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (!me) return;
    setProfileForm({
      full_name: me.full_name || "",
      email: me.email || "",
      phone: me.phone || "",
    });
  }, [me]);

  const stats = useMemo(() => {
    const validated = registrations.filter((r) => r.status === "validee").length;
    return {
      registrations: registrations.length,
      validated,
      submittedEvents: events.length,
    };
  }, [registrations, events]);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Compte requis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connectez-vous ou creez un compte pour acceder a votre mini dashboard.
            </p>
            <Link to="/submit-event?auth=login" className="inline-block">
              <Button>Se connecter</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateCreatorProfile({
        full_name: profileForm.full_name,
        email: profileForm.email,
        phone: profileForm.phone,
      });
      toast.success("Profil mis a jour");
    } catch (err) {
      toast.error(err?.message || "Impossible de mettre a jour le profil");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (!pwdForm.current_password || !pwdForm.new_password) {
      toast.error("Renseignez le mot de passe actuel et le nouveau mot de passe");
      return;
    }
    setSavingPassword(true);
    try {
      await updateCreatorProfile({
        current_password: pwdForm.current_password,
        new_password: pwdForm.new_password,
      });
      setPwdForm({ current_password: "", new_password: "" });
      toast.success("Mot de passe mis a jour");
    } catch (err) {
      toast.error(err?.message || "Impossible de mettre a jour le mot de passe");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    creatorLogout();
    toast.success("Deconnexion reussie");
    navigate("/");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <UserCircle2 className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Mon dashboard</h1>
          <p className="text-sm text-muted-foreground">{user.email || user.phone}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Inscriptions</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats.registrations}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Billets valides</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats.validated}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Evenements proposes</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats.submittedEvents}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Acces rapide</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Link to="/dashboard/events">
            <Button className="w-full gap-2" variant="outline"><Briefcase className="w-4 h-4" /> Mes événements</Button>
          </Link>
          <Link to="/participant/tickets">
            <Button className="w-full gap-2" variant="outline"><Ticket className="w-4 h-4" /> Mes billets</Button>
          </Link>
          <Link to="/submit-event">
            <Button className="w-full gap-2" variant="outline"><PlusSquare className="w-4 h-4" /> Proposer</Button>
          </Link>
          <Link to="/events">
            <Button className="w-full gap-2" variant="outline"><CalendarDays className="w-4 h-4" /> Evenements</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Dernieres inscriptions</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {registrations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune inscription pour le moment.</p>
          ) : (
            registrations.slice(0, 6).map((reg) => (
              <div key={reg.id} className="flex items-center justify-between border-b border-border/50 pb-2">
                <div>
                  <p className="text-sm font-medium">{reg.first_name} {reg.last_name}</p>
                  <p className="text-xs text-muted-foreground">Ref: {reg.id.slice(-8).toUpperCase()}</p>
                </div>
                <Badge variant="outline">{reg.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Parametres du compte</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-semibold">Modifier mon profil</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Nom complet</Label>
                <Input value={profileForm.full_name} onChange={(e) => setProfileForm((p) => ({ ...p, full_name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={profileForm.email} onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Telephone</Label>
                <Input value={profileForm.phone} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <Button onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? "Enregistrement..." : "Enregistrer le profil"}
            </Button>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Changer le mot de passe</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Mot de passe actuel</Label>
                <Input type="password" value={pwdForm.current_password} onChange={(e) => setPwdForm((p) => ({ ...p, current_password: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Nouveau mot de passe</Label>
                <Input type="password" value={pwdForm.new_password} onChange={(e) => setPwdForm((p) => ({ ...p, new_password: e.target.value }))} />
              </div>
            </div>
            <Button variant="outline" onClick={savePassword} disabled={savingPassword}>
              {savingPassword ? "Mise a jour..." : "Mettre a jour le mot de passe"}
            </Button>
          </div>

          <div className="pt-2">
            <Button variant="destructive" onClick={handleLogout}>Se deconnecter</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
