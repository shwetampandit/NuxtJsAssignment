export default {
  mode: 'spa',
  // target: 'static' - removed to allow proxy in dev mode
  // Use 'nuxt generate' for static builds
  head: {
    title: 'Country Explorer',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'Explore countries around the world' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },
  css: [],
  plugins: [],
  components: true,
  buildModules: [],
  modules: [
    '@nuxtjs/axios'
  ],
  serverMiddleware: [
    '~/server/api.js'
  ],
  axios: {
    baseURL: '/api',
    credentials: false,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  },
  build: {
    extend(config, ctx) {}
  }
}

