import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/libs/AuthContext';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import SiteAnalyticsTracker from '@/components/analytics/SiteAnalyticsTracker';

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClientInstance}>
    <BrowserRouter>
      <AuthProvider>
        <SiteAnalyticsTracker />
        <App />
        <Toaster />
        <SonnerToaster />
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
)
