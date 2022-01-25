module.exports = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/trade',
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/trade',
        destination: '/trade',
      },
      {
        source: '/trade/:contract',
        destination: '/trade/:contract',
      },
    ]
  },
  exportPathMap: async function () {
    return {
      '/trade/:contract': {
        page: '/trade/:contract',
      },
    }
  },
}
