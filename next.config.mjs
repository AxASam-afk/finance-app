/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb', // pour l'import CSV
    },
  },
};

export default nextConfig;
