import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/layout/Layout';
import ImpersonationBanner from '@/components/ImpersonationBanner';
import Login from '@/pages/Login';
import SuperAdminLogin from '@/pages/SuperAdminLogin';
import SuperAdminDashboard from '@/pages/SuperAdminDashboard';
import SuperAdminTenants from '@/pages/SuperAdminTenants';
import SuperAdminUsers from '@/pages/SuperAdminUsers';
import SuperAdminAnalytics from '@/pages/SuperAdminAnalytics';
import CreateTenant from '@/pages/CreateTenant';
import TenantNotFound from '@/pages/TenantNotFound';
import Dashboard from '@/pages/Dashboard';
import Tenants from '@/pages/Tenants';
import Stores from '@/pages/Stores';
import Extensions from '@/pages/Extensions';
import CDRViewer from '@/pages/CDRViewer';
import LiveCalls from '@/pages/LiveCalls';
import TrunkRegistration from '@/pages/TrunkRegistration';
import CallRouting from '@/pages/CallRouting';
import SipTrunks from '@/pages/SipTrunks';
import Destinations from '@/pages/Destinations';
import W3SuiteApiDocs from '@/pages/W3SuiteApiDocs';
import Logs from '@/pages/Logs';
import RingGroups from '@/pages/RingGroups';
import Queues from '@/pages/Queues';
import IvrMenus from '@/pages/IvrMenus';
import ConferenceRooms from '@/pages/ConferenceRooms';
import Voicemail from '@/pages/Voicemail';
import TimeConditions from '@/pages/TimeConditions';
import { useTenantValidation } from '@/hooks/useTenantValidation';

function TenantRoutes() {
  const { tenantSlug } = useParams();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { isValid: tenantValid, isLoading: tenantLoading } = useTenantValidation(tenantSlug);

  if (authLoading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (tenantValid === false) {
    return <TenantNotFound />;
  }

  return (
    <Routes>
      <Route path="login" element={<Login tenantSlug={tenantSlug!} />} />
      {isAuthenticated ? (
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="tenants" element={<Tenants />} />
              <Route path="stores" element={<Stores />} />
              <Route path="extensions" element={<Extensions />} />
              <Route path="cdr" element={<CDRViewer />} />
              <Route path="live-calls" element={<LiveCalls />} />
              <Route path="trunk-registration" element={<TrunkRegistration />} />
              <Route path="call-routing" element={<CallRouting />} />
              <Route path="sip-trunks" element={<SipTrunks />} />
              <Route path="destinations" element={<Destinations />} />
              <Route path="logs" element={<Logs />} />
              <Route path="w3-api-docs" element={<W3SuiteApiDocs />} />
              <Route path="ring-groups" element={<RingGroups />} />
              <Route path="queues" element={<Queues />} />
              <Route path="ivr-menus" element={<IvrMenus />} />
              <Route path="conference-rooms" element={<ConferenceRooms />} />
              <Route path="voicemail" element={<Voicemail />} />
              <Route path="time-conditions" element={<TimeConditions />} />
              <Route path="" element={<Navigate to={`/${tenantSlug}/dashboard`} replace />} />
              <Route path="*" element={<Navigate to={`/${tenantSlug}/dashboard`} replace />} />
            </Routes>
          </Layout>
        } />
      ) : (
        <Route path="*" element={<Navigate to={`/${tenantSlug}/login`} replace />} />
      )}
    </Routes>
  );
}

function SuperAdminRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/edgvoip/login" replace />;
  }

  return (
    <Layout variant="superadmin">
      <Routes>
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="tenants" element={<SuperAdminTenants />} />
        <Route path="tenants/create" element={<CreateTenant />} />
        <Route path="tenants/:tenantId" element={<SuperAdminTenants />} />
        <Route path="tenants/:tenantId/users" element={<SuperAdminUsers />} />
        <Route path="users" element={<SuperAdminUsers />} />
        <Route path="analytics" element={<SuperAdminAnalytics />} />
        <Route path="system-settings" element={<div>System Settings - Coming Soon</div>} />
        <Route path="logs" element={<div>System Logs - Coming Soon</div>} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <ImpersonationBanner />
          <Routes>
            {/* Root redirect to demo tenant */}
            <Route path="/" element={<Navigate to="/demo/login" replace />} />
            
            {/* Super admin routes */}
            <Route path="/edgvoip/login" element={<SuperAdminLogin />} />
            <Route path="/edgvoip/*" element={<SuperAdminRoutes />} />
            
            {/* Tenant routes (monotenant) */}
            <Route path="/:tenantSlug/*" element={<TenantRoutes />} />
            
            {/* 404 for invalid tenant */}
            <Route path="*" element={<TenantNotFound />} />
          </Routes>
          <Toaster />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;