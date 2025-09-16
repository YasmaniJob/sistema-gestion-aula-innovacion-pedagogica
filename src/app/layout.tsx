
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider } from './app-provider';
import { AuthProvider } from '@/context/auth-provider';
import { DataProvider } from '@/context/data-provider-refactored';
import { SessionProvider } from '@/components/providers/session-provider';

const inter = Inter({ subsets: ['latin'] });

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
            <SessionProvider>
              <AppProvider>{children}</AppProvider>
            </SessionProvider>
          </DataProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
