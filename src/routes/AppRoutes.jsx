import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import { useAuth } from '../hooks/useAuth'
import { adminNav, citizenNav, collectorNav } from '../data/navigationData'
import AdminDashboard from '../pages/admin/AdminDashboard'
import Analytics from '../pages/admin/Analytics'
import CollectionManagement from '../pages/admin/CollectionManagement'
import ComplaintManagement from '../pages/admin/ComplaintManagement'
import ComplianceManagement from '../pages/admin/ComplianceManagement'
import DisposalPointManagement from '../pages/admin/DisposalPointManagement'
import FestivalPlanning from '../pages/admin/FestivalPlanning'
import FleetManagement from '../pages/admin/FleetManagement'
import LiveOperations from '../pages/admin/LiveOperations'
import PersonnelManagement from '../pages/admin/PersonnelManagement'
import Reports from '../pages/admin/Reports'
import RouteManagement from '../pages/admin/RouteManagement'
import ScheduleManagement from '../pages/admin/ScheduleManagement'
import WasteFacilityManagement from '../pages/admin/WasteFacilityManagement'
import CitizenDashboard from '../pages/citizen/CitizenDashboard'
import CitizenProfile from '../pages/citizen/CitizenProfile'
import CitizenCollectionSchedule from '../pages/citizen/CollectionSchedule'
import CitizenComplaints from '../pages/citizen/MyComplaints'
import NearbyDisposalPoints from '../pages/citizen/NearbyDisposalPoints'
import CitizenNotifications from '../pages/citizen/Notifications'
import ReportMissedCollection from '../pages/citizen/ReportMissedCollection'
import SegregationGuide from '../pages/citizen/SegregationGuide'
import CitizenRoutes from '../pages/citizen/RouteTracking'
import CollectionHistory from '../pages/collector/CollectionHistory'
import CollectorDashboard from '../pages/collector/CollectorDashboard'
import CollectionTasks from '../pages/collector/CollectionTasks'
import MyRoutes from '../pages/collector/MyRoutes'
import MySchedule from '../pages/collector/MySchedule'
import ReportIssue from '../pages/collector/ReportIssue'
import ReportViolation from '../pages/collector/ReportViolation'
import Login from '../pages/auth/Login'

const homeByRole = { admin: '/admin', collector: '/collector', citizen: '/citizen' }

function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingPage />
  return <Navigate to={user ? homeByRole[user.role] || '/login' : '/login'} replace />
}

function LoadingPage() {
  return <div className="grid min-h-screen place-items-center text-sm text-muted">Loading your account…</div>
}

function RequireRole({ role, nav, title, subtitle, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingPage />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (user.role !== role) return <Navigate to={homeByRole[user.role] || '/login'} replace />
  return (
    <DashboardLayout nav={nav} title={title} subtitle={subtitle}>
      {children}
    </DashboardLayout>
  )
}

function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink px-4 text-center">
      <div>
        <h1 className="text-3xl font-extrabold">Page not found</h1>
        <p className="mt-2 text-muted">This page is not part of your available workspace.</p>
        <a href="/" className="mt-5 inline-block rounded-lg bg-forest px-4 py-2 font-semibold text-white">Go to home</a>
      </div>
    </div>
  )
}

export default function AppRoutes() {
  const adminTitle = 'Municipal Operations'
  const adminSubtitle = 'Live data from your municipal database'

  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />

      <Route path="/admin" element={<RequireRole role="admin" nav={adminNav} title={adminTitle} subtitle={adminSubtitle}><AdminDashboard /></RequireRole>} />
      <Route path="/admin/routes" element={<RequireRole role="admin" nav={adminNav} title={adminTitle} subtitle={adminSubtitle}><RouteManagement /></RequireRole>} />
      <Route path="/admin/schedules" element={<RequireRole role="admin" nav={adminNav} title={adminTitle} subtitle={adminSubtitle}><ScheduleManagement /></RequireRole>} />
      <Route path="/admin/collections" element={<RequireRole role="admin" nav={adminNav} title={adminTitle} subtitle={adminSubtitle}><CollectionManagement /></RequireRole>} />
      <Route path="/admin/disposal" element={<RequireRole role="admin" nav={adminNav} title={adminTitle} subtitle={adminSubtitle}><DisposalPointManagement /></RequireRole>} />
      <Route path="/admin/fleet" element={<RequireRole role="admin" nav={adminNav} title={adminTitle} subtitle={adminSubtitle}><FleetManagement /></RequireRole>} />
      <Route path="/admin/operations" element={<RequireRole role="admin" nav={adminNav} title={adminTitle} subtitle={adminSubtitle}><LiveOperations /></RequireRole>} />
      <Route path="/admin/personnel" element={<RequireRole role="admin" nav={adminNav} title={adminTitle} subtitle={adminSubtitle}><PersonnelManagement /></RequireRole>} />
      <Route path="/admin/complaints" element={<RequireRole role="admin" nav={adminNav} title={adminTitle} subtitle={adminSubtitle}><ComplaintManagement /></RequireRole>} />
      <Route path="/admin/compliance" element={<RequireRole role="admin" nav={adminNav} title={adminTitle} subtitle={adminSubtitle}><ComplianceManagement /></RequireRole>} />
      <Route path="/admin/festivals" element={<RequireRole role="admin" nav={adminNav} title={adminTitle} subtitle={adminSubtitle}><FestivalPlanning /></RequireRole>} />
      <Route path="/admin/facilities" element={<RequireRole role="admin" nav={adminNav} title={adminTitle} subtitle={adminSubtitle}><WasteFacilityManagement /></RequireRole>} />
      <Route path="/admin/analytics" element={<RequireRole role="admin" nav={adminNav} title={adminTitle} subtitle={adminSubtitle}><Analytics /></RequireRole>} />
      <Route path="/admin/reports" element={<RequireRole role="admin" nav={adminNav} title={adminTitle} subtitle={adminSubtitle}><Reports /></RequireRole>} />

      <Route path="/collector" element={<RequireRole role="collector" nav={collectorNav} title="Collector workspace" subtitle="Your assigned collection work"><CollectorDashboard /></RequireRole>} />
      <Route path="/collector/tasks" element={<RequireRole role="collector" nav={collectorNav} title="Collector workspace" subtitle="Your assigned collection work"><CollectionTasks /></RequireRole>} />
      <Route path="/collector/routes" element={<RequireRole role="collector" nav={collectorNav} title="Collector workspace" subtitle="Your assigned collection work"><MyRoutes /></RequireRole>} />
      <Route path="/collector/schedule" element={<RequireRole role="collector" nav={collectorNav} title="Collector workspace" subtitle="Your assigned collection work"><MySchedule /></RequireRole>} />
      <Route path="/collector/history" element={<RequireRole role="collector" nav={collectorNav} title="Collector workspace" subtitle="Your assigned collection work"><CollectionHistory /></RequireRole>} />
      <Route path="/collector/report-issue" element={<RequireRole role="collector" nav={collectorNav} title="Collector workspace" subtitle="Your assigned collection work"><ReportIssue /></RequireRole>} />
      <Route path="/collector/report-violation" element={<RequireRole role="collector" nav={collectorNav} title="Collector workspace" subtitle="Your assigned collection work"><ReportViolation /></RequireRole>} />

      <Route path="/citizen" element={<RequireRole role="citizen" nav={citizenNav} title="Community services" subtitle="Collection information for your neighborhood"><CitizenDashboard /></RequireRole>} />
      <Route path="/citizen/profile" element={<RequireRole role="citizen" nav={citizenNav} title="Community services" subtitle="Collection information for your neighborhood"><CitizenProfile /></RequireRole>} />
      <Route path="/citizen/schedules" element={<RequireRole role="citizen" nav={citizenNav} title="Community services" subtitle="Collection information for your neighborhood"><CitizenCollectionSchedule /></RequireRole>} />
      <Route path="/citizen/routes" element={<RequireRole role="citizen" nav={citizenNav} title="Community services" subtitle="Collection information for your neighborhood"><CitizenRoutes /></RequireRole>} />
      <Route path="/citizen/missed-collection" element={<RequireRole role="citizen" nav={citizenNav} title="Community services" subtitle="Collection information for your neighborhood"><ReportMissedCollection /></RequireRole>} />
      <Route path="/citizen/complaints" element={<RequireRole role="citizen" nav={citizenNav} title="Community services" subtitle="Collection information for your neighborhood"><CitizenComplaints /></RequireRole>} />
      <Route path="/citizen/disposal" element={<RequireRole role="citizen" nav={citizenNav} title="Community services" subtitle="Collection information for your neighborhood"><NearbyDisposalPoints /></RequireRole>} />
      <Route path="/citizen/notifications" element={<RequireRole role="citizen" nav={citizenNav} title="Community services" subtitle="Collection information for your neighborhood"><CitizenNotifications /></RequireRole>} />
      <Route path="/citizen/guide" element={<RequireRole role="citizen" nav={citizenNav} title="Community services" subtitle="Collection information for your neighborhood"><SegregationGuide /></RequireRole>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
