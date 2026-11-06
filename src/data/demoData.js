// ⚠️ DEMONSTRATION DATA ONLY — replace with API responses once the backend is connected.
// Positions are manually entered "last reported" points, NOT live GPS.

export const kpis = [
  { id: 'vehicles',   label: 'Active vehicles',       value: '9 / 12', hint: '3 in workshop or off duty', tone: 'ok' },
  { id: 'collected',  label: 'Stops completed',       value: '145',    hint: 'of 168 scheduled today',    tone: 'ok' },
  { id: 'complaints', label: 'Pending complaints',    value: '8',      hint: '3 missed collections',      tone: 'warn' },
  { id: 'success',    label: 'On-time rate',          value: '86%',    hint: 'vs 82% yesterday',          tone: 'ok' },
  { id: 'delayed',    label: 'Delayed routes',        value: '2',      hint: 'R-04, R-09',                tone: 'bad' },
  { id: 'cases',      label: 'Open compliance cases', value: '14',     hint: '5 awaiting officer review', tone: 'info' },
]

export const zones = [
  { id: 'A', name: 'Zone A · Patia',        color: '#3fb868', active: 4 },
  { id: 'B', name: 'Zone B · Saheed Nagar', color: '#4b8df0', active: 3 },
  { id: 'C', name: 'Zone C · Old Town',     color: '#e3a62f', active: 2 },
  { id: 'D', name: 'Zone D · Khandagiri',   color: '#e0534f', active: 0 },
]

export const mapCenter = [20.30, 85.83]

export const routes = [
  { id: 'R-01', zone: 'A', color: '#3fb868', path: [[20.3560, 85.8160], [20.3490, 85.8230], [20.3410, 85.8290], [20.3300, 85.8230]] },
  { id: 'R-04', zone: 'B', color: '#4b8df0', path: [[20.3050, 85.8420], [20.2980, 85.8470], [20.2920, 85.8380], [20.2860, 85.8330]] },
  { id: 'R-07', zone: 'C', color: '#e3a62f', path: [[20.2450, 85.8300], [20.2390, 85.8370], [20.2330, 85.8410]] },
  { id: 'R-09', zone: 'D', color: '#e0534f', path: [[20.2640, 85.7780], [20.2590, 85.7830], [20.2540, 85.7900]] },
]

export const vehicles = [
  { id: 'TRK-101', route: 'R-01', zone: 'A', status: 'On route', tone: 'ok',   progress: 62, lastUpdate: '8:12 AM',   position: [20.3410, 85.8290], source: 'Collector update' },
  { id: 'TRK-102', route: 'R-04', zone: 'B', status: 'Delayed',  tone: 'warn', progress: 35, lastUpdate: '8:05 AM',   position: [20.2980, 85.8470], source: 'Collector update' },
  { id: 'TRK-103', route: 'R-07', zone: 'C', status: 'On route', tone: 'ok',   progress: 80, lastUpdate: '8:10 AM',   position: [20.2390, 85.8370], source: 'Collector update' },
  { id: 'TRK-104', route: 'R-09', zone: 'D', status: 'Workshop', tone: 'bad',  progress: 0,  lastUpdate: 'Yesterday', position: null,               source: 'Unavailable' },
]

export const collectionStatus = [
  { label: 'Wet waste',     done: 82, color: '#3fb868' },
  { label: 'Dry waste',     done: 64, color: '#4b8df0' },
  { label: 'Special waste', done: 41, color: '#e3a62f' },
  { label: 'Event areas',   done: 28, color: '#e0534f' },
]

export const activityLog = [
  { id: 1, title: 'Route R-01 started',              detail: 'TRK-101 · Collector R. Das',               time: '2 min ago',  tone: 'ok' },
  { id: 2, title: 'Delay reported on R-04',          detail: 'Road closure near Saheed Nagar, +40 min',  time: '15 min ago', tone: 'warn' },
  { id: 3, title: 'Segregation violation recorded',  detail: 'Ward 12, Street 4: first warning',         time: '32 min ago', tone: 'info' },
  { id: 4, title: 'Overflowing bin report resolved', detail: 'BIN-3421 near Janpath',                    time: '1 hr ago',   tone: 'ok' },
  { id: 5, title: 'Case sent for officer review',    detail: 'Repeat violation, Ward 7',                 time: '2 hr ago',   tone: 'bad' },
]

export const weeklyCollections = [
  { day: 'Mon', scheduled: 160, completed: 148 },
  { day: 'Tue', scheduled: 160, completed: 132 },
  { day: 'Wed', scheduled: 165, completed: 158 },
  { day: 'Thu', scheduled: 165, completed: 150 },
  { day: 'Fri', scheduled: 168, completed: 155 },
  { day: 'Sat', scheduled: 172, completed: 160 },
  { day: 'Sun', scheduled: 140, completed: 121 },
]

// Collectors record bag counts / estimates, so these are shares, not measured weight.
export const wasteBreakdown = [
  { name: 'Wet',     value: 52, color: '#3fb868' },
  { name: 'Dry',     value: 33, color: '#4b8df0' },
  { name: 'Special', value: 10, color: '#e3a62f' },
  { name: 'Mixed',   value: 5,  color: '#e0534f' },
]