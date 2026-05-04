/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration
  poweredByHeader: false,
  optimizeFonts: false,
  
  // Next.js 15 compatible configuration
  transpilePackages: ['lucide-react', 'framer-motion'],
  
  
  // Image optimization
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  
  // Skip CSP for debugging
  async headers() {
    return []
  }
}

module.exports = nextConfig