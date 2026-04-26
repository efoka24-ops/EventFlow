import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import PromoBanner from "./PromoBanner";
import Footer from "./Footer";
import FooterSaaS from "@/components/landing/FooterSaaS";
import { useLocation } from "react-router-dom";

export default function AppLayout() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PromoBanner />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      {isHomePage ? <FooterSaaS /> : <Footer />}
    </div>
  );
}