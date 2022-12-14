/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  publicRuntimeConfig: {
    // Change this if you have a different server
    api_host: '',
    base: "/client",
  },
  basePath: "/client",
  assetPrefix: "/static",
}

module.exports = nextConfig
