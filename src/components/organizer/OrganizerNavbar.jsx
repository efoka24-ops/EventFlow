import { Link } from "react-router-dom";
import { Menu, Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import OrganizerSidebar from "./OrganizerSidebar";

export default function OrganizerNavbar() {
  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40 flex items-center px-4 gap-4">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <OrganizerSidebar />
        </SheetContent>
      </Sheet>

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary">
        EventFlow
        <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          Organisateur
        </span>
      </Link>

      <div className="flex-1" />

      {/* Actions */}
      <Link to="/submit-event">
        <Button size="sm" className="gap-1.5 hidden sm:flex">
          <Plus className="w-4 h-4" />
          Nouvel événement
        </Button>
      </Link>
    </header>
  );
}
