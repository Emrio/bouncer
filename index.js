const bouncer = require('./lib/bouncer')

bouncer().catch(err => {
  console.error('Fatal error during boot sequence')
  console.error(err)
  process.exit(1)
})

process.on('uncaughtException', (err, origin) => {
  console.error('Fatal uncaught exception:', origin)
  console.error(err)
  process.exit(1)
})
