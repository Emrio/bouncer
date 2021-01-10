const https = require('https')
const http = require('http')
const net = require('net')
const TimeoutManager = require('./TimeoutManager')
const middleStream = require('./middleStream')

// creates either a HTTP or HTTPS server depending on provided parameters
function makeServer (cert, key) {
  let server
  if (cert && key) {
    // HTTPS
    server = https.createServer({ cert, key })
    server.__connectionEvent = 'secureConnection'
  } else {
    // HTTP
    server = http.createServer()
    server.__connectionEvent = 'connection'
  }
  return server
}

module.exports.createServer = function createServer (opts) {
  if (!opts.handler) throw new Error('A request handler must be provided')
  if (!opts.debug) throw new Error('Please give me a debugger instance!')
  const { handler, debug } = opts

  const timeouts = new TimeoutManager(opts.timeout)
  const server = makeServer(opts.cert, opts.key)

  server.on(server.__connectionEvent, function (sock) {
    // data from client to local server will be sent *through* this dummy pipe
    sock.__mid = middleStream(sock.remoteAddress, server.__connectionEvent === 'connection' ? 'http' : 'https')
    sock.pipe(sock.__mid)
  })

  function requestHandler (req, res) {
    const t0 = Date.now()

    const mid = req.socket.__mid
    const ip = req.socket.remoteAddress
    const sock = req.socket

    debug('%o | Requested %o %o', ip, req.method, (req.socket.encrypted ? 'https' : 'http') + '://' + req.headers.host + req.url)

    // if the connection is kept alive and new requests come, the piping
    // would already be set up. No need to handle again.
    // If the request is answered at the proxy-level, keep-alive should be
    // discarded as the piping would not have been set up.
    if (mid.__hasBeenHandled) {
      // refreshing this socket's timeout
      timeouts.refreshSocketTimeout(req, res)
      // new request, we shall put proxy headers to this one as well
      mid.resetTransformer()
      return
    }
    mid.__hasBeenHandled = true

    // called once per socket, when the forwarding is set up
    // the stream piping looks as follows:
    //
    //  sock  =>  mid  =>  srv  =>  sock
    //
    // sock     client/bouncer stream
    // mid      dummy stream
    // srv      bouncer/server stream
    function forward (port) {
      if (res.headersSent) {
        debug.error('%o | Trying to open a new connection when headers are already sent!', ip)
        return
      }

      debug('%o | Opening new tunnel between client and server', ip)

      const srv = net.connect(port)

      // closes all streams, ends all connections
      function destroyAll (err) {
        if (err) {
          debug.error('%o | An error occured. Destroying sockets', ip)
          debug.error(err)
        } else {
          debug('%o | Destroying sockets', ip)
        }
        mid.destroy()
        srv.destroy()
        sock.destroy()
      }

      mid.on('error', destroyAll)
      srv.on('error', destroyAll)
      sock.on('finish', destroyAll)

      // first request using this tunnel, setting up the timeout
      timeouts.setSocketTimeout(req, res, destroyAll)

      srv.on('data', (data) => {
        if (data.toString().slice(0, 4) !== 'HTTP') return
        timeouts.clearSocketTimeout(req)

        // this is the beginning of an HTTP response, logging!
        // TODO: Log traffic
      })

      mid.pipe(srv).pipe(sock).on('close', () => {
        const t1 = Date.now()
        timeouts.clearSocketTimeout(req)
        timeouts.destroySocketState(req)
        debug('%o | Connection closed. Was used for %o ms', ip, t1 - t0)
      })
    }

    handler(req, res, forward)
  }

  // regular requests
  server.on('request', requestHandler)
  // when using keep-alive
  server.on('upgrade', requestHandler)

  return server
}
