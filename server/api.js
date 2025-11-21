const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = function (req, res, next) {
  // Only proxy requests that start with /api
  if (req.url.startsWith('/api')) {
    const proxy = createProxyMiddleware({
      target: 'https://www.apicountries.com',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '' // Remove /api prefix
      },
      secure: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        // Set proper headers
        proxyReq.setHeader('Accept', 'application/json')
        proxyReq.setHeader('Content-Type', 'application/json')
        console.log('Proxying request:', req.method, req.url, '->', 'https://www.apicountries.com' + req.url.replace('/api', ''))
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('Proxy response:', proxyRes.statusCode, req.url)
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err.message)
        if (!res.headersSent) {
          res.writeHead(500, {
            'Content-Type': 'application/json'
          })
          res.end(JSON.stringify({ error: 'Proxy error', message: err.message }))
        }
      }
    })
    return proxy(req, res, next)
  } else {
    next()
  }
}

