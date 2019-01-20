# Bouncer

> A HTTP node.js server which distributes HTTP(S) requests to the different sub-hosts

### Dependencies

- [Bouncy](https://github.com/substack/bouncy)
- [Express](https://github.com/expressjs/express)
- [Lodash](https://github.com/lodash/lodash)

## Installation

```shell
$ git clone https://github.com/TheEmrio/bouncer.git
$ cd bouncer
$ npm run install
```

After configuration is done, do:

```shell
$ npm start
```

## How to configure

A configuration setup is available at `config/config.json.example`

### Hosts

Create a new `.json` file under `config/`. This will contain our bouncer configuration

You can create multiple configuration files, all of them will be merged.

**Note:** Using multiple configuration files exposes you to some configuration being overridden during execution and therefore not being used!

The most basic configuration file looks like this :
```json
{
  "hosts": {
    "example.com": 8080
  }
}
```

With this configuration, the bouncer will bounce all HTTP requests to the port `8080`

For each host, you can supply an Object instead of a number for deeper configuration:
```json
{
  "hosts": {
    "example.com": {
      "port": 8080,
      "allowHttps": true,
      "forceHttps": false,
      "default": true
    }
  }
}
```

- `port`: The port where the request will be bounced to. This property is **mandatory**
- `allowHttps`: Tells the bouncer if HTTPS requests for this domain can be bounced. This property only applies when HTTPS is configured. Default is `true`
- `forceHttps`: Tells the bouncer if the HTTP request should be redirected to HTTPS requests. This property only applies when HTTPS is configured. Default is `false`
- `default`: If a request doesn't match with any host, bounce the request to the last host with this property set to true. If no host is set as default, the bouncer will reply with `404: Unknown host`. Default is `false`

You can add multiple hosts like so:
```json
{
  "hosts": {
    "example.com": 8080,
    "hello.xyz": {
      "port": 8081,
      "forceHttps": true
    },
    "foo.org": 8082,
    "bar.foo.org": {
      "port": 8083,
      "default": true
    }
  }
}
```

**Note:** Multiple hosts can point to the same port. This is useful for servers with subdomains. For each subdomain, you must setup a different host. Wildcards are not supported

### HTTP and HTTPS

You can setup how HTTP and HTTPS works for the boucer.

#### HTTP

You can set the port of the HTTP server

```json
{
  "http": 80
}
```

or

```json
{
  "http": {
    "port": 80
  }
}
```

By default, HTTP server will be listening port `80`

You can also disable the HTTP server if you only accept HTTPS.

```json
{
  "http": false
}
```

**Note:** This is not recommended. You should allow HTTP request and set `forceHttps` to true for all hosts if you only want to deal with HTTPS requests in the server

#### HTTPS

By default, the bouncer will only listen to HTTP requests but you can also setup HTTPS redirection:

```json
{
  "http": {
    "cert": "/path/to/cert",
    "key": "/path/to/key",
    "port": 443
  }
}
```

- `cert` is a path to a valid SSL certification file. This property is **mandatory**
- `key` is a path to a valid SSL private key file. This property is **mandatory**
- `port` is the port the HTTPS server will be listening to. By default, it is `443`
