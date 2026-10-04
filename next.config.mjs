/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zenlove.me',
      },
      {
        protocol: 'https',
        hostname: 'cdn-resource.zenlove.me',
      },
      {
        protocol: 'https',
        hostname: 'cdn.zenlove.me',
      },
      {
        protocol: 'https',
        hostname: 'pagedata.zenlove.me',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'content.pancake.vn',
      },
      {
        protocol: 'https',
        hostname: 'statics.pancake.vn',
      },
      {
        protocol: 'https',
        hostname: 'w.ladicdn.com',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
      },
      {
        protocol: 'https',
        hostname: 'img.vietqr.io',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
};

export default nextConfig;
