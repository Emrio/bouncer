const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const bouncy = require('bouncy')

const Host = require('./Host')

const DEFAULT_HTTP = 80
const DEFAULT_HTTPS = 443

module.exports = async function bouncer () {
  const config = await getConfig()

  config.default = null

  for (var hostname in config.hosts) {
    config.hosts[hostname] = new Host(hostname, config.hosts[hostname])

    if (config.hosts[hostname].default) {
      config.default = config.hosts[hostname]
    }
  }

  if (config.https && (!config.https.cert || !config.https.key)) throw new Error('You must provide paths for the SSL certificate and private key in order to use https.')

  if (config.https && !config.https.port) config.https.port = DEFAULT_HTTPS

  if (config.http === false && !config.https) throw new Error('Cannot disable HTTP when HTTPS is not active.')

  // If no HTTP but HTTPS, only load a HTTPS server
  if (config.http === false) {
    return httpsBouncer(config)
  }

  if (!config.http) config.http = { port: DEFAULT_HTTP }

  if (typeof config.http === 'number') config.http = { port: config.http }

  if (typeof config.http !== 'object') throw new Error('Http field in not recognised in the configuration. Please make sure it is a Number or a JSON Object.')

  if (!config.http.port) config.http.port = DEFAULT_HTTP

  // Load HTTP server
  httpBouncer(config)

  // If HTTPS is set, launch HTTPS server
  if (config.https) {
    httpsBouncer(config)
  }
}

function httpBouncer (config) {
  const fofcontenttype = config.fof ? config.fof.type : 'text/plain'
  const fofcontent = config.fof ? config.fof.content : '404: Unknown host'

  bouncy((req, res, bounce) => {
    const hostname = req.headers.host
    console.log('Request domain: ' + hostname)

    if (!config.hosts.hasOwnProperty(hostname)) {
      console.log('404: Unknown host')
      if (config.default) return bounce(config.default.port)
      res.writeHead(404, { 'Content-Type': fofcontenttype })
      return res.end(fofcontent)
    }

    const host = config.hosts[hostname]

    if (host.redirectHost) {
      const protocol = host.forceHttps ? 'https' : 'http'
      res.writeHead(301, { Location: protocol + '://' + host.redirectHost + req.url })
      res.end()
    }

    if (host.forceHttps && config.https) {
      res.writeHead(301, { Location: 'https://' + host.hostname + req.url })
      res.end()
    }

    bounce(host.port)
  }).listen(config.http.port, () => {
    console.log('Listening HTTP on port ' + config.http.port)
  })
}

function httpsBouncer (config) {
  const fofcontenttype = config.fof ? config.fof.type : 'text/plain'
  const fofcontent = config.fof ? config.fof.content : '404: Unknown host'
  const httpsOptions = {}

  try {
    httpsOptions.cert = fs.readFileSync(config.https.cert)
    httpsOptions.key = fs.readFileSync(config.https.key)
  } catch (e) {
    throw new Error("Could not read content of Certification and Private key files - HTTPS server won't be launched")
  }

  bouncy(httpsOptions, (req, res, bounce) => {
    const hostname = req.headers.host
    console.log('Request domain: ' + hostname)

    if (!config.hosts.hasOwnProperty(hostname)) {
      console.log('404: Unknown host')
      if (config.default) return bounce(config.default.port)
      res.writeHead(404, { 'Content-Type': fofcontenttype })
      return res.end(fofcontent)
    }

    const host = config.hosts[hostname]

    if (host.redirectHost) {
      return res.redirect('https://' + host.redirectHost + req.originalUrl)
    }

    if (!host.https) {
      console.log('400: HTTPS is not authorized for this host')
      if (config.default) return bounce(config.default.port)
      res.statusCode = 400
      return res.end('400: HTTPS is not authorized for this host')
    }

    bounce(host.port)
  }).listen(config.https.port, () => {
    console.log('Listening HTTPS on port ' + config.https.port)
  })
}

function getConfig () {
  return new Promise((resolve, reject) => {
    var config = {}

    fs.readdir(path.join(__dirname, '..', 'config'), (err, items) => {
      if (err) throw new Error('Error while reading in the config folder')

      for (var file of items) {
        if (!fs.lstatSync(path.join(__dirname, '..', 'config', file)).isDirectory() && file.endsWith('.json')) {
          config = _.merge(config, require(path.join(__dirname, '..', 'config', file)))
        }
      }

      if (!config.hosts || Object.keys(config.hosts).length === 0) throw new Error('No hosts found in config folder.')

      resolve(config)
    })
  })
}
