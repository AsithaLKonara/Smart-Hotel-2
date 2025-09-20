import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import ErrorBoundary from "@/components/error-boundary"
import ClientScripts from "@/components/client-scripts"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

export const metadata: Metadata = {
  title: "SmartHotel - Premium Hotel Management",
  description: "Premium hotel management system with booking, ordering, and analytics",
  keywords: ["hotel", "booking", "management", "restaurant", "analytics"],
  authors: [{ name: "SmartHotel Team" }],
  creator: "SmartHotel",
  publisher: "SmartHotel",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://smarthotel-demo.vercel.app'),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SmartHotel - Premium Hotel Management",
    description: "Premium hotel management system with booking, ordering, and analytics",
    url: "/",
    siteName: "SmartHotel",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SmartHotel - Premium Hotel Management",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartHotel - Premium Hotel Management",
    description: "Premium hotel management system with booking, ordering, and analytics",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SmartHotel",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "application-name": "SmartHotel",
    "msapplication-TileColor": "#f59e0b",
    "msapplication-config": "/browserconfig.xml",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f59e0b" },
    { media: "(prefers-color-scheme: dark)", color: "#d97706" },
  ],
  colorScheme: "light",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.stripe.com" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/_next/static/css/app.css" as="style" />
        <link rel="preload" href="/_next/static/js/app.js" as="script" />
        
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ErrorBoundary>
          {children}
          <Toaster />
          <ClientScripts />
        </ErrorBoundary>
      </body>
    </html>
  )
}