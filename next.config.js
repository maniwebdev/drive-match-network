/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dentalsoftwarebucket.s3.ap-south-1.amazonaws.com',
      },
      // Add more patterns here if needed
    ],
  },
}

module.exports = nextConfig
