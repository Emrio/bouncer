const u = require('emrioutils')
const Host = require('./Host')
const debug = u.debug('hostpool')

module.exports = class HostPool {
  constructor () {
    this.hosts = {}
    this.defaultHost = null
  }

  registerHosts (hosts, serversConfig) {
    if (!Object.keys(hosts).length) throw new Error('You need to register at least one host')

    for (const hostname in hosts) {
      const host = new Host(hostname, hosts[hostname])
      this.hosts[hostname] = host

      if (serversConfig.http.enabled) {
        hosts[hostname + serversConfig.http.port] = host
      }
      if (serversConfig.https.enabled) {
        hosts[hostname + serversConfig.https.port] = host
      }

      if (hosts[hostname].default) {
        this.defaultHost = host
      }
    }
  }

  getHost (hostname) {
    const host = this.hosts[hostname]
    if (!host) debug.error('Host %o does not exist')
    return host || this.defaultHost
  }
}
