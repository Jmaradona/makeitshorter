import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Make it shorter!!!',
  description: 'Professional email editor with AI-powered enhancements',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <main className="min-h-screen bg-[rgb(var(--bg-primary))] transition-colors w-full h-full overflow-y-auto overflow-x-hidden">
            {children}
          </main>
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  )
}