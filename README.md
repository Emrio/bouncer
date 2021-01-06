# Bouncer

> A nodeJS web proxy

## Table of content
- [Installation](#installation)
- [How to configure](#configuration)
  - [Hosts](#configuration-hosts)
  - [HTTP](#configuration-http)
  - [HTTPS](#configuration-https)
  - [404 Handler](#configuration-fof)

<a name="installation"></a>
## Installation

```shell
$ git clone https://github.com/TheEmrio/bouncer.git
$ cd bouncer/
$ npm install
```

After configuration is done, do:

```shell
$ npm start
```

You may also want to set the following environment variables as such:
```
DEBUG=bouncer:*
EMRIOUTILS_LOG_PREFIX=bouncer
EMRIOUTILS_LOG_PATH=/path/to/logs/dir/
```

<a name="configuration"></a>
## How to configure

A configuration setup is available at `config/config.json.example`

<a name="configuration-hosts"></a>
### Hosts

Create a new `config.json` file under `config/`. This will contain our bouncer configuration

**NOTE:** On prior versions, you could create multiple `.json` configuration files and all of them would be merged. As of version 2.1.0, only the file `config/config.json` will be loaded!

**NOTE:** Using multiple configuration files exposes you to some configuration being overridden during execution and therefore not being used!

The most basic configuration file looks like this :
```json
{
  "hosts": {
    "example.com": 8080
  }
}
```

With this configuration, the bouncer will bounce all HTTP requests for `example.com` to the port `8080`

For each host, you can supply an object instead of a number for deeper configuration:
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
- `allowHttps`: Tells the bouncer if HTTPS requests for this domain can be bounced. This property only applies when HTTPS is configured. Default is `false`
- `forceHttps`: Tells the bouncer if HTTP requests should be redirected to HTTPS requests. This property only applies when HTTPS is configured. Defaults to `false`
- `default`: If a request doesn't match with any host, bounce the request to the last host with this property set to `true`. If no host is set as default, the bouncer will reply with a 404 response. Default is `false`

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

**Note:** Multiple hosts can point to the same port. This is useful for servers with subdomains. For each subdomain, you must setup a different host. Wildcards are not supported.

<a name="configuration-http"></a>
### HTTP

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

**NOTE:** This is not recommended. If you want to secure your connections, you should rather allow HTTP request and set `forceHttps` to `true` for all hosts.

<a name="configuration-https"></a>
### HTTPS

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

<a name="configuration-fof"></a>
### 404 Handler

You can setup a custom 404 response if you don't setup a default host.

You can send text
```json
{
  "fof": {
    "type": "text/plain",
    "content": "Oh no, something went wrong here!"
  }
}
```

or send a file

```json
{
  "fof": {
    "type": "text/html",
    "file": "/path/to/some/file.html"
  }
}
```

- `type` is the content type to send to the client. Defaults to `text/plain`

One of the following property should be set:
- `content` is a plain string of text
- `file` is a path to a file on the server

By default, the bouncer will send the text `404: Unknown host`.

**NOTE:** If you want a more powerful 404 handler, you should setup a default host.
