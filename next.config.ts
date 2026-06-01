import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Supabase Storage — imágenes de productos y blog
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // Wix Static CDN — imágenes migradas desde Wix
        protocol: 'https',
        hostname: 'static.wixstatic.com',
      },
    ],
  },
};

export default nextConfig;
