/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure CSS modules work correctly
  webpack: (config) => {
    return config;
  },
  // Optimize CSS loading
  optimizeFonts: true,
  compiler: {
    // Remove unused CSS in production
    removeConsole: false,
  },
  images: {
    domains: ['healthdatalex.s3.us-east-1.amazonaws.com'],
  },
}

module.exports = nextConfig
