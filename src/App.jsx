import { useQuery } from '@tanstack/react-query'
import { Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { useAuth } from '@/libs/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';
import OrganizerLayout from '@/components/organizer/OrganizerLayout';
import MaintenancePage from '@/components/pages/MaintenancePage';
import { fetchPublicSettings } from '@/api/publicSettingsApi';
import AdminLayout from '@/components/admin/AdminLayout';
import Home from '@/components/pages/Home';
import Events from '@/components/pages/Events';
import EventDetail from '@/components/pages/EventDetail';
import Help from '@/components/pages/Help';
import LegalPage from '@/components/pages/LegalPage';
import ParticipantProfile from '@/components/pages/ParticipantProfile';
import ParticipantTickets from '@/components/pages/ParticipantTickets';
import SubmitEvent from '@/components/pages/SubmitEvent';
import UserDashboard from '@/components/pages/UserDashboard';
import UserEventsDashboard from '@/components/pages/UserEventsDashboard';
import AdminLogin from '@/components/pages/admin/AdminLogin';
import Dashboard from '@/components/pages/admin/Dashboard';
import AdminEvents from '@/components/pages/admin/AdminEvents';
import AdminRegistrations from '@/components/pages/admin/AdminRegistrations';
import AdminHelp from '@/components/pages/admin/AdminHelp';
import AdminUserActivity from '@/components/pages/admin/AdminUserActivity';
import AdminAccounts from '@/components/pages/admin/AdminAccounts';
import AdminPayments from '@/components/pages/admin/AdminPayments';
import AdminParticipants from '@/components/pages/admin/AdminParticipants';
import AdminOrganizers from '@/components/pages/admin/AdminOrganizers';
import AdminRevenue from '@/components/pages/admin/AdminRevenue';
import AdminCategories from '@/components/pages/admin/AdminCategories';
import AdminSettings from '@/components/pages/admin/AdminSettings';
import AdminMarketing from '@/components/pages/admin/AdminMarketing';
import AdminSecurity from '@/components/pages/admin/AdminSecurity';
import AdminAnalytics from '@/components/pages/admin/AdminAnalytics';
import AdminMarketplace from '@/components/pages/admin/AdminMarketplace';
import AdminCMS from '@/components/pages/admin/AdminCMS';
import AdminRoles from '@/components/pages/admin/AdminRoles';
import AdminTestimonials from '@/components/pages/admin/AdminTestimonials';
import AdminPremium from '@/components/pages/admin/AdminPremium';

import { getCreatorUser } from '@/lib/creatorSession';
import { useEffect, useState } from 'react';

const ADMIN_ROLES = new Set(["super_admin", "admin", "support", "finance", "marketing", "moderator"]);


const isAdminUser = (user) => {
  if (!user) return false;
  return Boolean(user.isAdmin || user.is_admin || ADMIN_ROLES.has(user.role));
};

function useCreatorSession() {
  const [creatorUser, setCreatorUser] = useState(() => getCreatorUser());
  useEffect(() => {
    const handler = () => setCreatorUser(getCreatorUser());
    window.addEventListener("creator-session-changed", handler);
    return () => window.removeEventListener("creator-session-changed", handler);
  }, []);
  return creatorUser;
}

// Renders element only if user's role is in allowedRoles; otherwise shows "Accès refusé".
const AdminRoute = ({ element, allowedRoles, user }) => {
  if (!allowedRoles) return element;
  const role = user?.role || "admin";
  if (role === "super_admin" || allowedRoles.includes(role)) return element;
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold">Accès refusé</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        Votre rôle <strong>{role}</strong> ne vous autorise pas à accéder à cette section.
        Contactez votre Super Admin pour obtenir les permissions nécessaires.
      </p>
    </div>
  );
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, authError, navigateToLogin, user } = useAuth();
  const canAccessAdmin = isAdminUser(user);
  const creatorUser = useCreatorSession();

  const { data: publicSettings, isLoading: isLoadingPublicSettings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: fetchPublicSettings,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const isMaintenanceMode = publicSettings?.maintenance_mode === true;

  // Show loading spinner while checking auth
  if (isLoadingAuth || isLoadingPublicSettings) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Maintenance mode: block public users, admins can still access
  if (isMaintenanceMode && !canAccessAdmin) {
    return <MaintenancePage />;
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <>
        <Route element={<AppLayout />}>
          <>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/help" element={<Help />} />
            <Route path="/legal/:slug" element={<LegalPage />} />
            <Route path="/submit-event" element={<SubmitEvent />} />
            <Route path="/participant/profile" element={<ParticipantProfile />} />
            <Route path="/participant/tickets" element={<ParticipantTickets />} />
            <Route path="/admin/login" element={<AdminLogin />} />
          </>
        </Route>

        {/* ── Organizer portal (with sidebar layout) ── */}
        {creatorUser ? (
          <Route element={<OrganizerLayout />}>
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/dashboard/events" element={<UserDashboard />} />
            <Route path="/dashboard/participants" element={<UserDashboard />} />
            <Route path="/dashboard/revenue" element={<UserDashboard />} />
            <Route path="/dashboard/analytics" element={<UserDashboard />} />
            <Route path="/dashboard/messages" element={<UserDashboard />} />
            <Route path="/dashboard/sponsors" element={<UserDashboard />} />
            <Route path="/dashboard/settings" element={<UserDashboard />} />
          </Route>
        ) : (
          <Route path="/dashboard/*" element={<Navigate to="/submit-event?auth=login" replace />} />
        )}
        {canAccessAdmin && (
          <Route element={<AdminLayout />}>
            <>
              {/* Dashboard — tous les rôles */}
              <Route path="/admin" element={<Dashboard />} />
              {/* Utilisateurs */}
              <Route path="/admin/participants" element={<AdminRoute element={<AdminParticipants />} allowedRoles={["admin","support"]} user={user} />} />
              <Route path="/admin/organizers" element={<AdminRoute element={<AdminOrganizers />} allowedRoles={["admin","moderator"]} user={user} />} />
              <Route path="/admin/accounts" element={<AdminRoute element={<AdminAccounts />} allowedRoles={["admin"]} user={user} />} />
              {/* Événements */}
              <Route path="/admin/events" element={<AdminRoute element={<AdminEvents />} allowedRoles={["admin","moderator"]} user={user} />} />
              <Route path="/admin/marketplace" element={<AdminRoute element={<AdminMarketplace />} allowedRoles={["admin","marketing"]} user={user} />} />
              {/* Inscriptions */}
              <Route path="/admin/registrations" element={<AdminRoute element={<AdminRegistrations />} allowedRoles={["admin","support"]} user={user} />} />
              {/* Finance */}
              <Route path="/admin/payments" element={<AdminRoute element={<AdminPayments />} allowedRoles={["admin","finance","support"]} user={user} />} />
              <Route path="/admin/revenue" element={<AdminRoute element={<AdminRevenue />} allowedRoles={["admin","finance"]} user={user} />} />
              {/* Croissance */}
              <Route path="/admin/marketing" element={<AdminRoute element={<AdminMarketing />} allowedRoles={["admin","marketing"]} user={user} />} />
              <Route path="/admin/notifications-system" element={<AdminRoute element={<AdminUserActivity />} allowedRoles={["admin"]} user={user} />} />
              {/* Contenu & Config */}
              <Route path="/admin/cms" element={<AdminRoute element={<AdminCMS />} allowedRoles={["admin","marketing"]} user={user} />} />
              <Route path="/admin/testimonials" element={<AdminRoute element={<AdminTestimonials />} allowedRoles={["admin","marketing"]} user={user} />} />
              <Route path="/admin/categories" element={<AdminRoute element={<AdminCategories />} allowedRoles={["admin"]} user={user} />} />
              <Route path="/admin/settings" element={<AdminRoute element={<AdminSettings />} allowedRoles={["super_admin"]} user={user} />} />
              {/* Sécurité */}
              <Route path="/admin/security" element={<AdminRoute element={<AdminSecurity />} allowedRoles={["admin","moderator","support"]} user={user} />} />
              <Route path="/admin/roles" element={<AdminRoute element={<AdminRoles />} allowedRoles={["super_admin"]} user={user} />} />
              {/* Analytics */}
              <Route path="/admin/analytics" element={<AdminRoute element={<AdminAnalytics />} allowedRoles={["admin","marketing"]} user={user} />} />
              <Route path="/admin/premium" element={<AdminRoute element={<AdminPremium />} allowedRoles={["super_admin"]} user={user} />} />
              {/* Legacy */}
              <Route path="/admin/activity-log" element={<AdminRoute element={<AdminUserActivity />} allowedRoles={["admin"]} user={user} />} />
              <Route path="/admin/user-activity" element={<AdminRoute element={<AdminUserActivity />} allowedRoles={["admin"]} user={user} />} />
              <Route path="/admin/help" element={<AdminRoute element={<AdminHelp />} allowedRoles={["admin","support"]} user={user} />} />
            </>
          </Route>
        )}
        {!canAccessAdmin && <Route path="/admin/*" element={<Navigate to="/admin/login" replace />} />}
        <Route path="*" element={<PageNotFound />} />
      </>
    </Routes>
  );
};


export default AuthenticatedApp;