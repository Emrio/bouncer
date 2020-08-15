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
      if (hosts[hostname].default) {
        this.defaultHost = host
      }
    }
  }

  getHost (hostname) {
    const host = this.hosts[hostname.split(':')[0]]
    if (!host) debug.error('Host %o does not exist', hostname)
    return host || this.defaultHost
  }
}
