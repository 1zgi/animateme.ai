import './styles/globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from './contexts/ThemeContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AnimateMe.ai',
  description: '3D Motion Capture Animation Studio',
  icons: {
    icon: [
      { url: '/anmtlogo.svg', sizes: '16x16', type: 'image/svg+xml' },
      { url: '/anmtlogo.svg', sizes: '32x32', type: 'image/svg+xml' },
      { url: '/anmtlogo.svg', sizes: '48x48', type: 'image/svg+xml' },
      { url: '/anmtlogo.svg', sizes: '64x64', type: 'image/svg+xml' },
      { url: '/anmtlogo.svg', sizes: '128x128', type: 'image/svg+xml' },
    ],
    shortcut: [
      { url: '/anmtlogo.svg', sizes: '16x16' },
      { url: '/anmtlogo.svg', sizes: '32x32' },
    ],
    apple: [
      { url: '/anmtlogo.svg', sizes: '180x180', type: 'image/svg+xml' },
      { url: '/anmtlogo.svg', sizes: '152x152', type: 'image/svg+xml' },
      { url: '/anmtlogo.svg', sizes: '120x120', type: 'image/svg+xml' },
    ],
    other: [
      {
        rel: 'icon',
        url: '/anmtlogo.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        rel: 'icon',
        url: '/anmtlogo.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
