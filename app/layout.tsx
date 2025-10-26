import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import ClientLayout from './ClientLayout'

export const metadata: Metadata = {
  title: 'Amity OD Portal',
  description: 'Amity University OD Generation Portal',
  icons: {
    // Use shield for browser tab favicons; mobile app icons come from manifest
    icon: [
      { url: '/favicon.ico' },
      { url: '/shield-favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/shield-favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#4338ca',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          html {
            font-family: ${GeistSans.style.fontFamily};
          }
          body {
            font-family: ${GeistSans.style.fontFamily};
            margin: 0;
            padding: 0;
          }
        `}} />
      </head>
      <body>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}
