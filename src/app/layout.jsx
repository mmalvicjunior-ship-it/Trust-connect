import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'Trust Connect — Find Trusted Professionals for Every Job',
  description: 'Trust Connect is a premium marketplace connecting homeowners, businesses, hotels, schools and organizations with verified, trusted service professionals.',
  authors: [{ name: 'Trust Connect' }],
  keywords: 'trust connect, service providers, plumbers, electricians, mechanics, Zimbabwe, home services, verified professionals',
  openGraph: {
    type: 'website',
    title: 'Trust Connect — Find Trusted Professionals for Every Job',
    description: 'Trust Connect matches homeowners, businesses, hotels and schools with background-checked electricians, plumbers, cleaners and technicians.',
    url: 'https://trustconnect.co.zw',
    images: ['/images/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trust Connect — Find Trusted Professionals for Every Job',
    description: 'Trust Connect matches homeowners, businesses, hotels and schools with background-checked electricians, plumbers, cleaners and technicians.',
  },
  icons: { icon: '/images/logo.png' },
};

export const viewport = {
  themeColor: '#0057D9',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
