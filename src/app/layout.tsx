
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider } from './app-provider';
import { AuthProvider } from '@/context/auth-provider';
import { DataProvider } from '@/context/data-provider-refactored';

import { InstallButton } from '@/components/pwa/install-button';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AIP - Sistema para Gestionar el Aula de Innovación Pedagógica',
  description: 'Sistema integral para la gestión del aula de innovación pedagógica - Gestión de usuarios, reservas, préstamos y reuniones',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AIP Recursos',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/icon-192x192.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <DataProvider>
            <AppProvider>{children}</AppProvider>
          </DataProvider>
        </AuthProvider>
        <InstallButton />
        <Toaster />
      </body>
    </html>
  );
}
