import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Use standalone output for better production performance and compatibility with Node.js servers (like cPanel Node.js App)
  output: 'standalone',
  // Enable trailing slashes for better SEO and compatibility with various web servers
  trailingSlash: true,
  images: {
    // Disable built-in image optimization for static/generic hosting compatibility
    // Many cPanel environments lack the necessary libraries for sharp/image-optimization
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
