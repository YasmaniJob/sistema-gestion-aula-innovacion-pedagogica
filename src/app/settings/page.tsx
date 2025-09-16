
'use client';

import { useSearchParams } from 'next/navigation';
import {
  Users,
  Building,
  GraduationCap,
  Clock,
  Paintbrush,
  Shield,
} from 'lucide-react';
import { AdministratorsTab } from '@/components/settings/administrators-tab';
import { AreasTab } from '@/components/settings/areas-tab';
import { GradesSectionsTab } from '@/components/settings/grades-sections-tab';
import { PedagogicalHoursTab } from '@/components/settings/pedagogical-hours-tab';
import { CustomizationTab } from '@/components/settings/customization-tab';
import { SecurityTab } from '@/components/settings/security-tab';
import { useAuthorization } from '@/hooks/use-authorization';
import { usePageTitle } from '@/hooks/use-page-title';

const tabs = [
  { name: 'Administradores', value: 'admins', icon: Users, component: <AdministratorsTab /> },
  { name: 'Áreas', value: 'areas', icon: Building, component: <AreasTab /> },
  { name: 'Grados y Secciones', value: 'grades', icon: GraduationCap, component: <GradesSectionsTab /> },
  { name: 'Horas Pedagógicas', value: 'hours', icon: Clock, component: <PedagogicalHoursTab /> },
  { name: 'Personalización', value: 'customization', icon: Paintbrush, component: <CustomizationTab /> },
  { name: 'Seguridad', value: 'security', icon: Shield, component: <SecurityTab /> },
];

export default function SettingsPage() {
  useAuthorization('Admin');
  
  const searchParams = useSearchParams();
  
  const activeTab = searchParams.get('tab') || 'admins';
  const activeTabInfo = tabs.find((tab) => tab.value === activeTab);
  
  usePageTitle(activeTabInfo ? `Ajustes: ${activeTabInfo.name}` : 'Ajustes');


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold hidden sm:block">
        {activeTabInfo?.name || 'Ajustes'}
      </h1>
      <div>
        {activeTabInfo?.component}
      </div>
    </div>
  );
}
