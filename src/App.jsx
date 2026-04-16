import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';
import AdminLayout from '@/components/admin/AdminLayout';
import Home from '@/components/pages/Home';
import Events from '@/components/pages/Events';
import EventDetail from '@/components/pages/EventDetail';
import Help from '@/components/pages/Help';
import ParticipantTickets from '@/components/pages/ParticipantTickets';
import SubmitEvent from '@/components/pages/SubmitEvent';
import AdminLogin from '@/components/pages/admin/AdminLogin';
import Dashboard from '@/components/pages/admin/Dashboard';
import AdminEvents from '@/components/pages/admin/AdminEvents';
import AdminRegistrations from '@/components/pages/admin/AdminRegistrations';
import AdminHelp from '@/components/pages/admin/AdminHelp';

const isAdminUser = (user) => {
  if (!user) return false;
  return Boolean(
    user.isAdmin ||
    user.is_admin ||
    user.role === 'admin' ||
    (Array.isArray(user.roles) && user.roles.includes('admin'))
  );
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user } = useAuth();
  const canAccessAdmin = isAdminUser(user);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
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
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/help" element={<Help />} />
        <Route path="/submit-event" element={<SubmitEvent />} />
        <Route path="/participant/tickets" element={<ParticipantTickets />} />
        <Route path="/admin/login" element={<AdminLogin />} />
      </Route>
      {canAccessAdmin && (
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/events" element={<AdminEvents />} />
          <Route path="/admin/registrations" element={<AdminRegistrations />} />
          <Route path="/admin/help" element={<AdminHelp />} />
        </Route>
      )}
      {!canAccessAdmin && <Route path="/admin/*" element={<Navigate to="/admin/login" replace />} />}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App