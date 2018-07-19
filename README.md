# Bouncer

> A HTTP node.js server which distributes HTTP request to the different sub-hosts

### Dependencies

- [Bouncy](https://github.com/substack/bouncy)
- [Express](https://github.com/expressjs/express)
- [Dotenv](https://github.com/motdotla/dotenv)

### How to setup

Create a `config/hosts.json` file at the root of the project<br>
Add your own hosts. The file should look like this :
```json
{
  "example.com": 8080,
  "www.example.com": 8080,
  "foo.org": 8081,
  "bar.xyz": 8082
}
```
And now, your requests to the server should be redirected to these ports

### Environment

There are 3 environment variables :
- `HTTP_PORT`: The main HTTP port (default: 80)
- `HTTPS_PORT`: The main HTTPS port (default: 443)
- `ALLOW_HTTPS`: If set to true, your server will also support HTTPS
