import React from 'react'

export default function HotelSchema() {
  const hotelData = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    "name": "SmartHotel Grand Palace",
    "description": "Luxury 5-Star Accommodation featuring award-winning dining, world-class spa, and bespoke concierge services.",
    "url": "https://smarthotel-demo.vercel.app",
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
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelData) }}
    />
  )
}
