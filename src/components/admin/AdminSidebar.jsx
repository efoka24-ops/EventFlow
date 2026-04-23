import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, CalendarDays, Users, ArrowLeft, CircleHelp, Activity, UserCog, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listRegistrations } from "@/api/registrationsApi";

const navItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Événements", path: "/admin/events", icon: CalendarDays },
  { label: "Inscriptions", path: "/admin/registrations", icon: Users, badgeKey: "registrations" },
  { label: "Paiements", path: "/admin/payments", icon: CreditCard },
  { label: "Activité utilisateurs", path: "/admin/user-activity", icon: Activity },
  { label: "Comptes créés", path: "/admin/accounts", icon: UserCog },
  { label: "Aide", path: "/admin/help", icon: CircleHelp },
];

export default function AdminSidebar() {
  const location = useLocation();

  const { data: registrations = [] } = useQuery({
    queryKey: ["admin-registrations"],
    queryFn: () => listRegistrations({ sort: "-created_date" }),
    refetchInterval: 30_000,
    refetchOnMount: "always",
  });

  const pendingCount = registrations.filter((r) => r.status === "en_attente").length;

  return (
    <aside className="w-64 bg-card border-r border-border min-h-[calc(100vh-4rem)] p-4 hidden lg:block">
      <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Retour au site
      </Link>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const count = item.badgeKey === "registrations" ? pendingCount : 0;
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
              >
                <item.icon className="w-4 h-4" />
                <span className="flex-1 text-left">{item.label}</span>
                {count > 0 && (
                  <Badge className="ml-auto bg-amber-500 text-white text-xs px-1.5 py-0 min-w-[20px] justify-center">
                    {count}
                  </Badge>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}