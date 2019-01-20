module.exports = class Host {
  constructor (hostname, hostData) {
    this.hostname = hostname
    this.redirectHost = null
    this.https = true
    this.forceHttps = false
    this.default = false

    if (typeof hostData === 'number') {
      this.port = hostData
      return
    }

    if (hostData.port) {
      this.port = hostData.port
    }

    if (hostData.hostReplaceWith) {
      this.redirectHost = hostData.hostReplaceWith
    }

    this.https = !!hostData.allowHttps

    if (hostData.forceHttps) {
      this.forceHttps = hostData.forceHttps
    }

    if (hostData.default) {
      this.default = hostData.default
    }

    if (!this.port) throw new Error('You must specify at least the redirection port for hosts (No port found for ' + hostname + ')')
  }
}
