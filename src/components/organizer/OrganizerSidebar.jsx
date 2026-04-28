import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getCreatorUser } from "@/lib/creatorSession";
import {
  LayoutDashboard, Plus, CalendarDays, Users, MessageSquare,
  DollarSign, BarChart3, Settings, Building2, Ticket, LogOut,
} from "lucide-react";
import { creatorLogout } from "@/api/authApi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const NAV_ITEMS = [
  { label: "Vue d'ensemble", path: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Créer un événement", path: "/submit-event", icon: Plus, highlight: true },
  { label: "Mes Événements", path: "/dashboard/events", icon: CalendarDays },
  { label: "Participants", path: "/dashboard/participants", icon: Users },
  { label: "Billets & Inscriptions", path: "/dashboard/participants", icon: Ticket, hide: true }, // alias
  { label: "Messagerie", path: "/dashboard/messages", icon: MessageSquare },
  { label: "Sponsors", path: "/dashboard/sponsors", icon: Building2 },
  { label: "Revenus", path: "/dashboard/revenue", icon: DollarSign },
  { label: "Analytics", path: "/dashboard/analytics", icon: BarChart3 },
  { label: "Paramètres", path: "/dashboard/settings", icon: Settings },
];

function NavItem({ item }) {
  const location = useLocation();
  const isActive = item.exact
    ? location.pathname === item.path
    : location.pathname === item.path || location.pathname.startsWith(item.path + "/");

  if (item.hide) return null;

  return (
    <Link to={item.path}>
      <div
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer group",
          item.highlight
            ? "bg-primary text-primary-foreground font-medium hover:bg-primary/90"
            : isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <item.icon
          className={cn(
            "w-4 h-4 shrink-0",
            item.highlight
              ? "text-primary-foreground"
              : isActive
              ? "text-primary"
              : "text-muted-foreground group-hover:text-foreground"
          )}
        />
        <span className="truncate">{item.label}</span>
      </div>
    </Link>
  );
}

export default function OrganizerSidebar() {
  const user = getCreatorUser();
  const initial = (user?.full_name || user?.email || "O").charAt(0).toUpperCase();

  const handleLogout = async () => {
    await creatorLogout();
    window.location.assign("/");
  };

  return (
    <aside className="w-60 bg-card border-r border-border min-h-[calc(100vh-4rem)] flex flex-col hidden lg:flex">
      {/* User info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{user?.full_name || "Organisateur"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || user?.phone || ""}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 py-1.5 mt-1">
          Mon espace
        </p>
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.path + item.label} item={item} />
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-1">
        <Link to="/" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
          <CalendarDays className="w-4 h-4" />
          <span>Voir le site</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Se déconnecter</span>
        </button>
      </div>
    </aside>
  );
}
