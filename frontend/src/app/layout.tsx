import type { Metadata } from 'next'
import '@/styles/globals.css'
import { GoogleOAuthProvider } from '@react-oauth/google'

export const metadata: Metadata = {
  title: 'Syllaparse',
  description: 'A simple, modern fullstack application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  if (!googleClientId) {
    console.warn('NEXT_PUBLIC_GOOGLE_CLIENT_ID not set')
  }

  return (
    <html lang="en">
      <body>
        <GoogleOAuthProvider clientId={googleClientId || ''}>
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}
