import {
  BarChart3, BookOpen, CalendarClock, ClipboardCheck, Factory, FileText, History, LayoutDashboard,
  Map, MessageSquareWarning, PartyPopper, Route, ShieldCheck, Trash2, Truck, UserRound, Users,
} from 'lucide-react'

export const adminNav = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Live operations', path: '/admin/operations', icon: Map },
  { label: 'Routes', path: '/admin/routes', icon: Route },
  { label: 'Schedules', path: '/admin/schedules', icon: CalendarClock },
  { label: 'Collections', path: '/admin/collections', icon: ClipboardCheck },
  { label: 'Disposal points', path: '/admin/disposal', icon: Trash2 },
  { label: 'Fleet', path: '/admin/fleet', icon: Truck },
  { label: 'Personnel', path: '/admin/personnel', icon: Users },
  { label: 'Complaints', path: '/admin/complaints', icon: MessageSquareWarning },
  { label: 'Compliance', path: '/admin/compliance', icon: ShieldCheck },
  { label: 'Festivals', path: '/admin/festivals', icon: PartyPopper },
  { label: 'Facilities', path: '/admin/facilities', icon: Factory },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Reports', path: '/admin/reports', icon: FileText },
]

export const collectorNav = [
  { label: 'Dashboard', path: '/collector', icon: LayoutDashboard },
  { label: 'Today’s tasks', path: '/collector/tasks', icon: ClipboardCheck },
  { label: 'My routes', path: '/collector/routes', icon: Route },
  { label: 'My schedule', path: '/collector/schedule', icon: CalendarClock },
  { label: 'Collection history', path: '/collector/history', icon: History },
  { label: 'Report an issue', path: '/collector/report-issue', icon: MessageSquareWarning },
  { label: 'Report a violation', path: '/collector/report-violation', icon: ShieldCheck },
]

export const citizenNav = [
  { label: 'Dashboard', path: '/citizen', icon: LayoutDashboard },
  { label: 'Profile', path: '/citizen/profile', icon: UserRound },
  { label: 'Collection schedule', path: '/citizen/schedules', icon: CalendarClock },
  { label: 'Routes and tracking', path: '/citizen/routes', icon: Map },
  { label: 'Report missed collection', path: '/citizen/missed-collection', icon: MessageSquareWarning },
  { label: 'My complaints', path: '/citizen/complaints', icon: ClipboardCheck },
  { label: 'Disposal points', path: '/citizen/disposal', icon: Trash2 },
  { label: 'Notifications', path: '/citizen/notifications', icon: FileText },
  { label: 'Segregation guide', path: '/citizen/guide', icon: BookOpen },
]