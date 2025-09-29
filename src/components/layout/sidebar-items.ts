
import {
  Archive,
  ArrowRightLeft,
  CalendarCheck,
  CalendarClock,
  GraduationCap,
  LayoutDashboard,
  LayoutGrid,
  LineChart,
  RefreshCw,
  Settings,
  User,
  Users,
  Building,
  Clock,
  Paintbrush,
  Shield,
  Activity,
  Package,
} from 'lucide-react';

export const adminNavItems = [
  { href: '/dashboard', icon: LayoutGrid, label: 'Dashboard', roles: ['Admin'] },
  { href: '/inventory', icon: Package, label: 'Inventario', roles: ['Admin'] },
  { href: '/loans', icon: ArrowRightLeft, label: 'Préstamos', roles: ['Admin'] },
  { href: '/reservations', icon: CalendarCheck, label: 'Reservas', roles: ['Admin'] },
  { href: '/meetings', icon: CalendarClock, label: 'Reuniones', roles: ['Admin'] },
  { href: '/docentes', icon: GraduationCap, label: 'Personal', roles: ['Admin'] },
  { href: '/reports', icon: LineChart, label: 'Reportes', roles: ['Admin'] },
  {
    label: 'Ajustes',
    icon: Settings,
    roles: ['Admin'],
    subItems: [
      { href: '/settings?tab=admins', icon: Users, label: 'Administradores' },
      { href: '/settings?tab=areas', icon: Building, label: 'Áreas' },
      { href: '/settings?tab=grades', icon: GraduationCap, label: 'Grados y Secciones' },
      { href: '/settings?tab=hours', icon: Clock, label: 'Horas Pedagógicas' },
      { href: '/settings?tab=customization', icon: Paintbrush, label: 'Personalización' },
      { href: '/settings?tab=security', icon: Shield, label: 'Seguridad' },
      { href: '/sync-monitor', icon: Activity, label: 'Monitor de Sincronización' },
    ],
  },
];

export const teacherNavItems = [
    { href: '/my-space', icon: LayoutDashboard, label: 'Mi Espacio', roles: ['Docente'] },
    { href: '/my-loans', icon: Archive, label: 'Préstamos', roles: ['Docente'] },
    { href: '/my-reservations', icon: CalendarCheck, label: 'Reservas', roles: ['Docente'] },
    { href: '/profile', icon: User, label: 'Perfil', roles: ['Docente'] },
];

export const contextualAddRoutes = {
    '/inventory': '/inventory/add',
    '/loans': '/loans/new',
    '/my-loans': '/my-loans/new',
    '/reservations': '/reservations/new',
    '/my-reservations': '/my-reservations/new',
    '/meetings': '/meetings/new',
    '/docentes': '/docentes/add',
};
