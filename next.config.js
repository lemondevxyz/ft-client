/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  publicRuntimeConfig: {
    // Change this if you have a different server
    host: 'localhost:8080',
  },
}

module.exports = nextConfig
