import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarDays, Menu, X, Shield, LayoutDashboard, LogOut, Ticket, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/libs/AuthContext";
import { getCreatorUser, clearCreatorSession } from "@/lib/creatorSession";
import { getParticipantEmail } from "@/lib/participantSession";
import { toast } from "sonner";

const isAdminUser = (user) => {
  if (!user) return false;
  return Boolean(
    user.isAdmin || user.is_admin || user.role === "admin" ||
    (Array.isArray(user.roles) && user.roles.includes("admin"))
  );
};

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canSeeAdmin = isAdminUser(user);
  const [isCreatorConnected, setIsCreatorConnected] = useState(Boolean(getCreatorUser()));
  const [hasParticipantSession, setHasParticipantSession] = useState(Boolean(getParticipantEmail()));
  const isAdmin = location.pathname.startsWith("/admin");

  useEffect(() => {
    const refresh = () => setIsCreatorConnected(Boolean(getCreatorUser()));
    refresh();
    window.addEventListener("creator-session-changed", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("creator-session-changed", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  useEffect(() => {
    const refresh = () => setHasParticipantSession(Boolean(getParticipantEmail()));
    refresh();
    window.addEventListener("participant-session-changed", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("participant-session-changed", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    clearCreatorSession();
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  const publicLinks = [
    { to: "/", label: "Accueil", exact: true },
    { to: "/events", label: "Événements" },
    { to: "/help", label: "Aide" },
  ];
  const navLinks = isCreatorConnected ? [] : publicLinks;

  const isActive = (to, exact) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/95 backdrop-blur-xl shadow-sm border-b border-border/50" : "bg-background/80 backdrop-blur-lg border-b border-border/30"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <CalendarDays className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">EventFlow</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map(({ to, label, exact }) => (
              <Link key={to} to={to}>
                <Button
                  variant={isActive(to, exact) ? "secondary" : "ghost"}
                  size="sm"
                  className="text-sm font-medium"
                >
                  {label}
                </Button>
              </Link>
            ))}
            {hasParticipantSession && (
              <Link to="/participant/profile">
                <Button variant={isActive("/participant/profile", false) ? "secondary" : "ghost"} size="sm" className="gap-1.5 text-sm">
                  <User className="w-3.5 h-3.5" /> Profil
                </Button>
              </Link>
            )}
            {hasParticipantSession && (
              <Link to="/participant/tickets">
                <Button variant={isActive("/participant/tickets", false) ? "secondary" : "ghost"} size="sm" className="gap-1.5 text-sm">
                  <Ticket className="w-3.5 h-3.5" /> Mes billets
                </Button>
              </Link>
            )}
            {isCreatorConnected && (
              <Link to="/dashboard">
                <Button variant={isActive("/dashboard", false) ? "secondary" : "ghost"} size="sm" className="gap-1.5 text-sm">
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </Button>
              </Link>
            )}
            {canSeeAdmin && (
              <>
                <div className="w-px h-5 bg-border mx-1.5" />
                <Link to="/admin">
                  <Button variant={isAdmin ? "default" : "outline"} size="sm" className="gap-1.5 text-sm">
                    <Shield className="w-3.5 h-3.5" /> Admin
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2">
            {isCreatorConnected ? (
              <Button variant="outline" size="sm" className="gap-1.5 rounded-full text-sm" onClick={handleLogout}>
                <LogOut className="w-3.5 h-3.5" /> Se déconnecter
              </Button>
            ) : (
              <>
                {hasParticipantSession && (
                  <Link to="/participant/profile">
                    <Button variant="outline" size="sm" className="gap-1.5 rounded-full text-sm">
                      <User className="w-3.5 h-3.5" /> Profil
                    </Button>
                  </Link>
                )}
                {hasParticipantSession && (
                  <Link to="/participant/tickets">
                    <Button variant="outline" size="sm" className="gap-1.5 rounded-full text-sm">
                      <Ticket className="w-3.5 h-3.5" /> Mes billets
                    </Button>
                  </Link>
                )}
                <Link to="/submit-event">
                  <Button variant="ghost" size="sm" className="text-sm">Se connecter</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile burger */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border bg-background/98 backdrop-blur-xl"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(({ to, label }) => (
                <Link key={to} to={to} onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-sm">{label}</Button>
                </Link>
              ))}
              {hasParticipantSession && (
                <Link to="/participant/profile" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                    <User className="w-4 h-4" /> Profil participant
                  </Button>
                </Link>
              )}
              {hasParticipantSession && (
                <Link to="/participant/tickets" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                    <Ticket className="w-4 h-4" /> Mes billets
                  </Button>
                </Link>
              )}
              {isCreatorConnected && (
                <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Button>
                </Link>
              )}
              {canSeeAdmin && (
                <Link to="/admin" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                    <Shield className="w-4 h-4" /> Admin
                  </Button>
                </Link>
              )}
              <div className="pt-2 border-t border-border space-y-2">
                {isCreatorConnected ? (
                  <Button variant="outline" className="w-full gap-2 rounded-full" onClick={() => { setMobileOpen(false); handleLogout(); }}>
                    <LogOut className="w-4 h-4" /> Se déconnecter
                  </Button>
                ) : (
                  <Link to="/submit-event" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-sm">Se connecter</Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
