import { Outlet } from "react-router-dom";
import OrganizerNavbar from "./OrganizerNavbar";
import OrganizerSidebar from "./OrganizerSidebar";

export default function OrganizerLayout() {
  return (
    <div className="min-h-screen bg-background">
      <OrganizerNavbar />
      <div className="flex">
        <OrganizerSidebar />
        <main className="flex-1 p-4 md:p-8 max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
