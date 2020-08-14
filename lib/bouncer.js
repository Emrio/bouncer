const u = require('emrioutils')
const bouncy = require('bouncy')
const HostPool = require('./HostPool')
const config = require('../config/config.json')
const debug = u.debug('main')

const DEFAULTS = { HTTP: 80, HTTPS: 443 }
const pool = new HostPool()

async function getServersConfig (inputConfig) {
  const outputConfig = {}

  if (!inputConfig.http && !inputConfig.https) {
    throw new Error('Cannot disable both HTTP and HTTPS servers')
  }

  /* HTTPS */
  if (inputConfig.https) {
    outputConfig.https = { enabled: true }
    // ssl config
    if (inputConfig.https.cert && inputConfig.https.key) {
      outputConfig.https.cert = await u.fs.readFile(inputConfig.https.cert, 'utf8')
      outputConfig.https.key = await u.fs.readFile(inputConfig.https.key, 'utf8')
    } else {
      throw new Error('You must provide paths for the SSL certificate and private key in order to use https')
    }
    // port
    outputConfig.https.port = inputConfig.https.port || DEFAULTS.HTTPS
  } else {
    outputConfig.https = { enabled: false }
  }

  /* HTTP */
  if (inputConfig.http) {
    outputConfig.http = { enabled: true }
    // port
    outputConfig.http.port = inputConfig.http.port || inputConfig.http || DEFAULTS.HTTPS
  } else {
    outputConfig.http = { enabled: false }
  }

  /* 404 Handler */
  const contentType = inputConfig.fof ? inputConfig.fof.type : 'text/plain'
  let content = '404: Unknown host'
  if (inputConfig.fof && inputConfig.fof.content) {
    content = inputConfig.fof.content
  } else if (inputConfig.fof && inputConfig.fof.file) {
    content = await u.fs.readFile(inputConfig.fof.file, 'utf8')
  }
  outputConfig.fof = { contentType, content }

  return outputConfig
}

function buildOpts (req) {
  return { headers: { 'x-forwarded-for': req.headers['x-forwarded-for'] || req.connection.remoteAddress } }
}

function createBouncer (type, serverConfig, fofConfig) {
  const debug = u.debug(type)

  function requestHandler (req, res, bounce) {
    const hostname = req.headers.host
    debug('Requested host %o', hostname)

    const host = pool.getHost(hostname)
    if (!host) {
      debug('404: Not host found')
      res.writeHead(404, { 'Content-Type': fofConfig.contentType })
      return res.end(fofConfig.content)
    }

    // blocking HTTPS traffic if host does not allow it
    if (type === 'https' && !host.https) {
      debug('400: HTTPS is not enabled for this host')
      res.statusCode = 400
      return res.end('400: HTTPS is not authorized for this host')
    }

    // redirect traffic for one host another if host is configured as such
    if (host.redirectHost) {
      const protocol = host.forceHttps || req.connection.encrypted ? 'https' : 'http'
      res.writeHead(301, { Location: protocol + '://' + host.redirectHost + req.url })
      return res.end()
    }

    // redirect HTTP traffic to HTTPS if host is configured as such
    if (type === 'http' && host.forceHttps) {
      res.writeHead(301, { Location: 'https://' + host.hostname + req.url })
      return res.end()
    }

    bounce(host.port, buildOpts(req))
  }

  const args = [requestHandler]
  if (type === 'https') {
    args.unshift({ cert: serverConfig.cert, key: serverConfig.key })
  }

  bouncy(...args).listen(serverConfig.port, () => {
    debug('Listening %s on port %o', type.toUpperCase(), serverConfig.port)
  })
}

async function bouncer () {
  debug('Loading config...')
  const serversConfig = await getServersConfig(config)

  pool.registerHosts(config.hosts, serversConfig)

  if (serversConfig.http.enabled) {
    createBouncer('http', serversConfig.http, serversConfig.fof)
  }

  if (serversConfig.https.enabled) {
    createBouncer('https', serversConfig.https, serversConfig.fof)
  }
}

module.exports = bouncer
