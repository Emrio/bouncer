const u = require('emrioutils')
const { Transform } = require('stream')
const debug = u.debug('middleStream')

// this function returns a transform stream
// it is used between the client and the server
// this stream will add X-Forwarded-For and X-Forwarded-Proto headers to resquests
module.exports = function middleStream (clientIp, protocol) {
  let step = 0
  let currentBuf = Buffer.from('') // empty buffer

  function processBuffer (buf) {
    switch (step) {
      case 0:
        if (!buf.toString().includes('\n')) {
          // the chunk is too short, saving for when we'll get more
          // this shouldn't happen tho, except for *very* slow connections
          // or slow larris attacks
          currentBuf = buf
        } else {
          let i = 0
          let line = ''

          while (buf[i] !== 0xa) {
            line += String.fromCharCode(buf[i])
            i++
          }

          line += '\n'
          this.push(Buffer.from(line))

          step = 1
          processBuffer.call(this, buf.slice(i + 1))
        }
        break
      case 1:
        // while there are complete headers, consume them!
        // Complete header looks like "Some-Header: Some Value\r\n" where \r is optional
        // if the buffer starts with \r\n, it must mean we have reached body part
        while (buf.toString().includes('\n') && !(/^(\r?\n)/.test(buf.toString()))) {
          let i = 0
          let headerData = ''

          while (buf[i] !== 0xa) {
            headerData += String.fromCharCode(buf[i])
            i++
          }

          headerData += '\n'
          i++

          buf = buf.slice(i)
          i = 0

          // discard headers starting with X-Forwarded as there are intented to
          // only be used by the proxy (me!)
          if (headerData.toLowerCase().startsWith('x-forwarded')) continue

          this.push(Buffer.from(headerData))
        }
        // start of body, let's first add our headers
        if ((/^(\r?\n)/.test(buf.toString()))) {
          currentBuf = Buffer.from('') // empty buffer for current buffer
          step = 2
          processBuffer.call(this, buf)
        } else {
          // saving yet-malformed headers for the next round of data
          currentBuf = buf
        }
        break
      case 2:
        this.push(Buffer.from(`X-Forwarded-For: ${clientIp}\r\nX-Forwarded-Proto: ${protocol}\r\n`))

        step = 3
        processBuffer.call(this, buf)
        break
      case 3:
        this.push(buf)
        break
      default:
        throw new Error(`Middle stream: Unknown step ${step}`)
    }
  }

  const stream = new Transform({
    transform (chunk, enc, callback) {
      processBuffer.call(this, Buffer.concat([currentBuf, chunk]))

      callback()
    }
  })

  stream.resetTransformer = function () {
    if (currentBuf.length) { // the stream still had data, the socket is in an undefined state and should be destroyed
      debug('----\nUndefined state\nStep: %o\n%O\n%O\n----', step, currentBuf, currentBuf.toString())

      stream.destroy(new Error('Middle stream: Undefined state reached'))
    }

    // this is as if the stream is waiting for a new http request
    step = 0
  }

  return stream
}
