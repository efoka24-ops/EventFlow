import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Home, Bell, Shield, ChevronDown } from "lucide-react";
import { useAuth } from "@/libs/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminStats } from "@/api/adminApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminNavbar() {
  const { logout, user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchAdminStats,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const alertCount = (stats?.pending_events || 0) + (stats?.registrations?.pending || 0);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <nav className="border-b border-border bg-card sticky top-0 z-50">
      <div className="flex items-center justify-between h-14 px-4 md:px-6">
        {/* Logo */}
        <Link to="/admin" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base tracking-tight">EventFlow</span>
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">ADMIN</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {/* Alertes */}
          <Link to="/admin/events">
            <Button variant="ghost" size="icon" className="relative w-9 h-9">
              <Bell className="w-4 h-4" />
              {alertCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {alertCount > 99 ? "99+" : alertCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Retour au site */}
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hidden sm:flex">
              <Home className="w-3.5 h-3.5" />
              Site
            </Button>
          </Link>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-8">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                  {(user?.email || "A").charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:block text-xs max-w-[100px] truncate">{user?.email || "Admin"}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-xs font-semibold">{user?.full_name || ({ super_admin: "Super Admin", admin: "Admin", support: "Support", finance: "Finance", marketing: "Marketing", moderator: "Modérateur" }[user?.role] || "Admin")}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/admin/cms" className="cursor-pointer">CMS</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin/settings" className="cursor-pointer">Paramètres</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin/activity-log" className="cursor-pointer">Journal d'activité</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer gap-2">
                <LogOut className="w-3.5 h-3.5" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
