import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarDays, Menu, X, Shield, Ticket, PlusSquare, CircleHelp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";

const isAdminUser = (user) => {
  if (!user) return false;
  return Boolean(
    user.isAdmin ||
    user.is_admin ||
    user.role === "admin" ||
    (Array.isArray(user.roles) && user.roles.includes("admin"))
  );
};

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const canSeeAdmin = isAdminUser(user);
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">EventFlow</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link to="/">
              <Button variant={location.pathname === "/" ? "secondary" : "ghost"} size="sm">
                Découvrir
              </Button>
            </Link>
            <Link to="/events">
              <Button variant={location.pathname === "/events" ? "secondary" : "ghost"} size="sm">
                Événements
              </Button>
            </Link>
            <Link to="/participant/tickets">
              <Button variant={location.pathname.startsWith("/participant") ? "secondary" : "ghost"} size="sm" className="gap-2">
                <Ticket className="w-3.5 h-3.5" />
                Mes billets
              </Button>
            </Link>
            <Link to="/help">
              <Button variant={location.pathname === "/help" ? "secondary" : "ghost"} size="sm" className="gap-2">
                <CircleHelp className="w-3.5 h-3.5" />
                Aide
              </Button>
            </Link>
            <Link to="/submit-event">
              <Button variant={location.pathname === "/submit-event" ? "secondary" : "ghost"} size="sm" className="gap-2">
                <PlusSquare className="w-3.5 h-3.5" />
                Proposer
              </Button>
            </Link>
            {canSeeAdmin && (
              <>
                <div className="w-px h-6 bg-border mx-2" />
                <Link to="/admin">
                  <Button variant={isAdmin ? "default" : "outline"} size="sm" className="gap-2">
                    <Shield className="w-3.5 h-3.5" />
                    Admin
                  </Button>
                </Link>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-card"
          >
            <div className="px-4 py-3 space-y-1">
              <Link to="/" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">Découvrir</Button>
              </Link>
              <Link to="/events" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">Événements</Button>
              </Link>
              <Link to="/participant/tickets" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Ticket className="w-3.5 h-3.5" /> Mes billets
                </Button>
              </Link>
              <Link to="/help" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <CircleHelp className="w-3.5 h-3.5" /> Aide
                </Button>
              </Link>
              <Link to="/submit-event" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <PlusSquare className="w-3.5 h-3.5" /> Proposer un événement
                </Button>
              </Link>
              {canSeeAdmin && (
                <Link to="/admin" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Shield className="w-3.5 h-3.5" /> Admin
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}