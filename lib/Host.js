module.exports = class Host {
  constructor (hostname, hostData) {
    this.hostname = hostname
    this.redirectHost = null
    this.https = false
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
      this.forceHttps = true
      // if https is forced, it should obviously be enabled as well
      this.https = true
    }

    if (hostData.default) {
      this.default = true
    }

    if (!this.port) throw new Error('You must specify at least the redirection port for hosts (No port found for ' + hostname + ')')
  }
}
