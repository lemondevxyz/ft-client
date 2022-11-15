/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  publicRuntimeConfig: {
    // Change this if you have a different server
    api_host: 'http://localhost:8080',
    base: "/",
  },
}

module.exports = nextConfig
