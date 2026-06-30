import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import ErrorBoundary from "@/components/error-boundary"
import ClientScripts from "@/components/client-scripts"
import HotelNavigation from "@/components/hotel-navigation"
import ConditionalFooter from "@/components/conditional-footer"
import { ChatWrapper } from "@/components/live-chat/chat-wrapper"
import { Providers } from "@/components/providers"
import { WebVitalsTracker } from "@/components/web-vitals-tracker"
import HotelSchema from "@/components/seo/hotel-schema"
import { ServiceWorkerRegister } from "@/components/service-worker-register"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800"],
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://smart-hotel-2.vercel.app'),
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
    <html lang="en" className={`dark ${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.stripe.com" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />

        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
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
      <body className="min-h-screen bg-[#0a0a0a] text-foreground font-sans antialiased relative">
        {/* Global Luxury Gradient Background */}
        <div 
          className="fixed inset-0 z-[-1] pointer-events-none" 
          style={{ 
            backgroundColor: '#0a0a0a',
            backgroundImage: `
              radial-gradient(circle at 50% 0%, rgba(197, 160, 89, 0.25) 0%, transparent 60%),
              radial-gradient(circle at 85% 70%, rgba(197, 160, 89, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 15% 90%, rgba(197, 160, 89, 0.12) 0%, transparent 50%)
            `
          }} 
        />
        <ErrorBoundary>
          <Providers>
            <HotelSchema />
            <div className="flex min-h-screen flex-col relative z-10 bg-transparent">
              <HotelNavigation />
              <main id="main-content" role="main" className="flex-1 bg-transparent">
                {children}
              </main>
              <ConditionalFooter />
            </div>
            <Toaster />
            <ClientScripts />
            <ChatWrapper />
            <WebVitalsTracker />
            <ServiceWorkerRegister />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}