// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/test-utils'
  ],

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    }
  ],

  runtimeConfig: {
    public: {
      isDev: process.env.NODE_ENV === 'development'
    }
  },

  routeRules: {
    // Ensure API routes are not caught by page catch-all
    '/api/**': { ssr: false }
  }
})