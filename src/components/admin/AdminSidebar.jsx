import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminStats } from "@/api/adminApi";
import { useAuth } from "@/libs/AuthContext";
import {
  LayoutDashboard, Users, UserCog, CalendarDays, CreditCard, TrendingUp,
  Megaphone, Bell, FileText, ShieldAlert, Tag, BarChart3, KeyRound, Store,
  Settings, ChevronDown, ChevronRight, Zap,
} from "lucide-react";

// roles: omit to allow all; '*' = all; array = specific roles allowed
const NAV_GROUPS = [
  {
    label: "Vue d'ensemble",
    items: [
      { label: "Dashboard", path: "/admin", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Utilisateurs",
    items: [
      { label: "Participants", path: "/admin/participants", icon: Users, roles: ["admin", "support"] },
      { label: "Organisateurs", path: "/admin/organizers", icon: UserCog, roles: ["admin", "moderator"] },
    ],
  },
  {
    label: "Événements",
    items: [
      { label: "Tous les événements", path: "/admin/events", icon: CalendarDays, badgeKey: "pending_events", roles: ["admin", "moderator"] },
      { label: "Marketplace", path: "/admin/marketplace", icon: Store, roles: ["admin", "marketing"] },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Paiements", path: "/admin/payments", icon: CreditCard, roles: ["admin", "finance", "support"] },
      { label: "Revenus & Commissions", path: "/admin/revenue", icon: TrendingUp, roles: ["admin", "finance"] },
    ],
  },
  {
    label: "Croissance",
    items: [
      { label: "Marketing", path: "/admin/marketing", icon: Megaphone, roles: ["admin", "marketing"] },
      { label: "Notifications", path: "/admin/notifications-system", icon: Bell, roles: ["admin"] },
    ],
  },
  {
    label: "Contenu & Config",
    items: [
      { label: "CMS", path: "/admin/cms", icon: FileText, roles: ["admin", "marketing"] },
      { label: "Catégories", path: "/admin/categories", icon: Tag, roles: ["admin"] },
      { label: "Paramètres", path: "/admin/settings", icon: Settings, roles: ["super_admin"] },
    ],
  },
  {
    label: "Sécurité",
    items: [
      { label: "Sécurité & Modération", path: "/admin/security", icon: ShieldAlert, roles: ["admin", "moderator", "support"] },
      { label: "Rôles & Permissions", path: "/admin/roles", icon: KeyRound, roles: ["super_admin"] },
    ],
  },
  {
    label: "Analytiques",
    items: [
      { label: "Analytics Avancées", path: "/admin/analytics", icon: BarChart3, roles: ["admin", "marketing"] },
      { label: "Modules Premium", path: "/admin/premium", icon: Zap, roles: ["super_admin"] },
    ],
  },
];

const ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Admin",
  support: "Support",
  finance: "Finance",
  marketing: "Marketing",
  moderator: "Modérateur",
};

function isAllowed(item, role) {
  if (!item.roles) return true; // no restriction = all roles
  if (role === "super_admin") return true;
  return item.roles.includes(role);
}

function NavItem({ item, badgeCount }) {
  const location = useLocation();
  const isActive = item.exact
    ? location.pathname === item.path
    : location.pathname.startsWith(item.path);

  return (
    <Link to={item.path}>
      <div className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer group",
        isActive
          ? "bg-primary text-primary-foreground font-medium shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}>
        <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
        <span className="flex-1 truncate">{item.label}</span>
        {badgeCount > 0 && (
          <Badge className="ml-auto bg-amber-500 text-white text-xs px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center">
            {badgeCount}
          </Badge>
        )}
      </div>
    </Link>
  );
}

function NavGroup({ group, role, pendingEvents }) {
  const location = useLocation();
  const visibleItems = group.items.filter((item) => isAllowed(item, role));
  if (visibleItems.length === 0) return null;

  const isGroupActive = visibleItems.some((item) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)
  );
  const [open, setOpen] = useState(isGroupActive || true);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>{group.label}</span>
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
      {open && (
        <div className="space-y-0.5 mt-0.5">
          {visibleItems.map((item) => (
            <NavItem
              key={item.path}
              item={item}
              badgeCount={item.badgeKey === "pending_events" ? pendingEvents : 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminSidebar() {
  const { user } = useAuth();
  const role = user?.role || "admin";

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchAdminStats,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const pendingEvents = stats?.pending_events || 0;

  return (
    <aside className="w-60 bg-card border-r border-border min-h-[calc(100vh-4rem)] flex flex-col hidden lg:flex">
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {NAV_GROUPS.map((group) => (
          <NavGroup key={group.label} group={group} role={role} pendingEvents={pendingEvents} />
        ))}
      </div>
      <div className="p-3 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          EventFlow · {ROLE_LABELS[role] || role}
        </p>
      </div>
    </aside>
  );
}
