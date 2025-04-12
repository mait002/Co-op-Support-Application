/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/student/report',
        destination: '/student/report-submission',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
