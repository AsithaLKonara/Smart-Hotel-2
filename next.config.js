/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration
  poweredByHeader: false,
  
  // Next.js 15 compatible configuration
  transpilePackages: ['lucide-react', 'framer-motion'],
  
  // Specify the correct workspace root
  outputFileTracingRoot: __dirname,
  
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