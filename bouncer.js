if(process.env.NODE_ENV !== 'production') {
  require('dotenv').load()
}

const bouncy = require('bouncy')
const express = require('express')
const fs = require('fs')
const path = require('path')
const https = require('https')
const ports = {
  http: process.env.HTTP_PORT || 80,
  https: process.env.HTTPS_PORT || 443
}

const hosts = fs.readFileSync(path.join(__dirname, 'config', 'hosts.json'))


if(process.env.ALLOW_HTTPS === 'true') {

  /* HTTP */
  var http = express()
  http.get("*", (req, res) => {
    res.redirect("https://" + req.headers.host + req.url)
  })
  http.listen(ports.http, () => {
    console.log("Listening HTTP on port " + ports.http)
  })

  /* HTTPS */
  const httpsOptions = {
    cert: fs.readFileSync(path.join(__dirname, 'config', 'ssl', 'server.crt')),
    key: fs.readFileSync(path.join(__dirname, 'config', 'ssl', 'server.key'))
  }
  var bouncer = bouncy(httpsOptions, (req, res, bounce) => {
    console.log(req.headers.host)

    if(hosts.hasOwnProperty(req.headers.host)) {
      var port2bounce = hosts[req.headers.host]
      bounce(port2bounce)
    }
    else {
      console.log("Unknown host")
      res.statusCode = 404
      res.end("404: Unknow host")
    }

  })
  bouncer.listen(ports.https, () => {
    console.log("Listening HTTPS on port " + ports.https)
  })


}
else {

  var bouncer = bouncy((req, res, bounce) => {
    console.log(req.headers.host)

    if(hosts.hasOwnProperty(req.headers.host)) {
      var port2bounce = hosts[req.headers.host]
      bounce(port2bounce)
    }
    else {
      console.log("Unknown host")
      res.statusCode = 404
      res.end("404: Unknow host")
    }

  })

  bouncer.listen(ports.http, () => {
    console.log("Listening HTTP on port " + ports.http)
  })

}

// /* HTTP */
// /*
// var http = express()
// http.get("*", (req, res) => {
//   res.redirect("https://" + req.headers.host + req.url)
// })
// http.listen(ports.http, () => {
//   console.log("Listening HTTP on port " + ports.http)
// })
// */
//
// /* HTTPS */
// const httpsOptions = {
//   cert: fs.readFileSync(path.join(__dirname, 'config', 'ssl', 'server.crt')),
//   key: fs.readFileSync(path.join(__dirname, 'config', 'ssl', 'server.key'))
// }
// var bouncer = bouncy(/*httpsOptions, */(req, res, bounce) => {
//   if(req.headers.host.endsWith("emrio.fr")) {
//     bounce(8080)
//   } /*else if(req.headers.host.endsWith("localhost")) {
//     bounce(8081)
//   } */else {
//     console.log("Unknown host")
//     res.statusCode = 404
//     res.end("Unknown host" + process.env)
//   }
// })
// bouncer.listen(ports.http, () => {
//   console.log("Listening HTTP on port " + ports.http)
// })
// // bouncer.listen(ports.https, () => {
// //   console.log("Listening HTTPS on port " + ports.https)
// // })
