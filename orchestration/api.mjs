import express from 'express'
import { ServiceManager } from './api_services.mjs'
import { Router } from './api_routes.mjs' // import the routes
import Web3 from './common/web3.mjs'
import { EncryptedDataEventListener } from './encrypted-data-listener.mjs'

let listener

function gracefulshutdown () {
  console.log('Shutting down')
  listener.close(() => {
    console.log('HTTP server closed.')
    process.exit(0)
  })
}

process.on('SIGTERM', gracefulshutdown)
process.on('SIGINT', gracefulshutdown)

const app = express()
app.use(express.json())

const web3 = Web3.connection()
const serviceMgr = new ServiceManager(web3)
serviceMgr.init().then(async () => {
  const eventListener = new EncryptedDataEventListener(web3)
  await eventListener.start()

  const router = new Router(serviceMgr)
  const r = router.addRoutes()
  app.use('/', r)
  app.use(express.static('orchestration/public'))
  listener = app.listen(process.env.PORT || 3000, () => {
    console.log('************************************************************')
    console.log('************************************************************')
    console.log('XW - Your app is listening on port ' + listener.address().port)
    console.log('************************************************************')
    console.log('************************************************************')
  })
})
