const bouncer = require('./lib/bouncer')

bouncer().catch(err => {
  console.error('Fatal error during boot sequence')
  console.error(err)
  process.exit(1)
})
