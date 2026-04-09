import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sri Sai Mobiles - Admin Dashboard',
  description: 'Professional admin dashboard for Sri Sai Mobiles',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-ibm-gray-10">{children}</body>
    </html>
  )
}
