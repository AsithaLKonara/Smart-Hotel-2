import React from 'react'
import Script from 'next/script'

export default function HotelSchema() {
  const hotelData = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    "name": "SmartHotel Grand Palace",
    "description": "Luxury 5-Star Accommodation featuring award-winning dining, world-class spa, and bespoke concierge services.",
    "url": "https://smart-hotel-2.vercel.app",
    "telephone": "+1 (800) 555-HOTEL",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Grand Boulevard",
      "addressLocality": "City Center",
      "addressRegion": "Metropolitan Area",
      "postalCode": "10001",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 40.7589,
      "longitude": -73.9851
    },
    "starRating": {
      "@type": "Rating",
      "ratingValue": "5"
    },
    "priceRange": "$$$$",
    "amenityFeature": [
      { "@type": "LocationFeatureSpecification", "name": "Spa", "value": true },
      { "@type": "LocationFeatureSpecification", "name": "Fine Dining", "value": true },
      { "@type": "LocationFeatureSpecification", "name": "Rooftop Pool", "value": true },
      { "@type": "LocationFeatureSpecification", "name": "Free Wi-Fi", "value": true }
    ]
  }

  return (
    <Script
      id="hotel-schema"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelData) }}
    />
  )
}
