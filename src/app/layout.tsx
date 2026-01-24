import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AdminProvider } from "@/contexts/admin-context";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: 'HarpTab Navigator',
  description: 'Convert music notes to harmonica tabs and back.',
  metadataBase: new URL(getSiteUrl()),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'HarpTab Navigator',
    description: 'Convert music notes to harmonica tabs and back.',
    url: '/',
    siteName: 'HarpTab Navigator',
    images: [
      {
        url: '/ogImage.png',
        width: 1200,
        height: 630,
        alt: 'HarpTab Navigator',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HarpTab Navigator',
    description: 'Convert music notes to harmonica tabs and back.',
    images: ['/ogImage.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Literata&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AdminProvider>
          {children}
          <Toaster />
        </AdminProvider>
      </body>
    </html>
  );
}
