import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import ErrorBoundary from "@/components/error-boundary"
import ClientScripts from "@/components/client-scripts"
import HotelNavigation from "@/components/hotel-navigation"
import ConditionalFooter from "@/components/conditional-footer"
import { ChatWrapper } from "@/components/live-chat/chat-wrapper"
import { Providers } from "@/components/providers"
import { WebVitalsTracker } from "@/components/web-vitals-tracker"

// Initialize Sentry on the server (optional)
// Only initialize if SENTRY_DSN is set and package is available
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  try {
    // Use dynamic require to avoid webpack bundling issues
    const sentryPath = '@sentry/nextjs'
    if (require.resolve && require.resolve(sentryPath)) {
      const Sentry = require(sentryPath)
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: 0.1,
        environment: process.env.NODE_ENV,
      })
    }
  } catch (error) {
    // Sentry not installed or configuration error - continue without it
    // This is expected if Sentry is not installed
  }
}

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
  title: "Grand Palace Hotel - Luxury 5-Star Accommodation",
  description: "Experience unparalleled luxury at Grand Palace Hotel. 5-star accommodations, award-winning dining, and world-class amenities in the heart of the city.",
  keywords: ["luxury hotel", "5 star hotel", "hotel booking", "grand palace hotel", "luxury accommodation", "city center hotel", "fine dining", "spa", "business hotel"],
  authors: [{ name: "Grand Palace Hotel" }],
  creator: "Grand Palace Hotel",
  publisher: "Grand Palace Hotel",
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
    title: "Grand Palace Hotel - Luxury 5-Star Accommodation",
    description: "Experience unparalleled luxury at Grand Palace Hotel. 5-star accommodations, award-winning dining, and world-class amenities in the heart of the city.",
    url: "/",
    siteName: "Grand Palace Hotel",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Grand Palace Hotel - Luxury 5-Star Accommodation",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grand Palace Hotel - Luxury 5-Star Accommodation",
    description: "Experience unparalleled luxury at Grand Palace Hotel. 5-star accommodations, award-winning dining, and world-class amenities in the heart of the city.",
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
    title: "Grand Palace Hotel",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "application-name": "Grand Palace Hotel",
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
        
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ErrorBoundary>
          <Providers>
            <div className="flex min-h-screen flex-col">
            <HotelNavigation />
              <main id="main-content" role="main" className="flex-1">
            {children}
              </main>
            <ConditionalFooter />
            </div>
            <Toaster />
            <ClientScripts />
            <ChatWrapper />
            <WebVitalsTracker />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}