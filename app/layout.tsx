import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import ClientLayout from './ClientLayout'

export const metadata: Metadata = {
  title: 'Amity University OD Portal',
  description: 'Amity University OD Generation Portal',
  icons: {
    icon: [
      { url: '/amity-coding-club-logo.png' },
      { url: '/amity-coding-club-logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/amity-coding-club-logo.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/amity-coding-club-logo.png' },
      { url: '/amity-coding-club-logo.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/amity-coding-club-logo.png',
  },
  manifest: '/manifest.json',
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
