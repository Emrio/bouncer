const u = require('emrioutils')
const debug = u.debug('timeouts')

// Upstream servers may sometimes be unresponsive
// If this happens, the connection must be automatically closed after a
// certain period of time and a 504 response be sent
// This may mean that the upstream is buggy or very slow
// TODO: Log gateway timeouts to ASMR
module.exports = class TimeoutManager {
  constructor (timeout = 3 * 1000) {
    this.sockets = new Map()
    this.timeout = timeout
  }

  setSocketTimeout (req, res, destroyAll) {
    this.sockets.set(req.socket, { destroyAll, timeout: null, req: null })

    this.refreshSocketTimeout(req, res)
  }

  refreshSocketTimeout (req, res) {
    if (!this.sockets.has(req.socket)) throw new Error('Socket does not exist')

    const state = this.sockets.get(req.socket)

    clearTimeout(state.timeout)

    state.req = req
    state.timeout = setTimeout(() => {
      if (res.headersSent) return
      debug('Request to local server timed out %o', req.socket.remoteAddress)
      res.statusCode = 504
      res.end('Boucer | Gateway timeout')
      state.destroyAll()
    }, this.timeout)
  }

  clearSocketTimeout (req) {
    if (!this.sockets.has(req.socket)) throw new Error('Socket does not exist')

    clearTimeout(this.sockets.get(req.socket).timeout)
  }

  destroySocketState (req) {
    this.sockets.delete(req.socket)
  }

  // sockets may have multiple request objects attached to them
  // this method returns the last one currently attached to the socket
  getCurrentRequest (req) {
    if (!this.sockets.has(req.socket)) throw new Error('Socket does not exist')
    return this.sockets.get(req.socket).req
  }
}
