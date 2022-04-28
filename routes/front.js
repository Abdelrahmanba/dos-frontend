const urlExist = require('url-exist')
var express = require('express')
var router = express.Router()
const url = require('url')
var proxy = require('express-http-proxy')

let lastUsedCat = 1
let lastUsedOrder = 1

let onlineCat
let onlineOrder
let infoCache = {}
let searchCache = {}

//to purge cache
router.get('/purgeCache', async (req, res) => {
  infoCache = {}
  searchCache = {}
  res.send('ok.')
})

router.get('/purgeInfo/:id', async (req, res) => {
  console.log('info cahce purged because of an update')
  delete infoCache[req.params.id]
  res.send('ok.')
})

router.get('/purgeSearch/:topic', async (req, res) => {
  console.log('search cahce purged because of an update')
  delete searchCache[req.params.topic]
  res.send('ok.')
})

router.get(
  '/purchase/:id',
  async function (req, res, next) {
    //load balancing part
    let server = process.env['ORDER_' + lastUsedOrder]
    const online = await urlExist(server)
    lastUsedOrder = (lastUsedOrder % 2) + 1
    if (online) {
      onlineOrder = server
    } else {
      onlineOrder = process.env['ORDER_' + lastUsedOrder]
    }
    next()
  },
  proxy(() => {
    console.log(onlineOrder)
    return onlineOrder
  })
)

//search with caching and load balancing
router.get(
  '/search',
  async function (req, res, next) {
    //load balancing part
    let server = process.env['CAT_' + lastUsedCat]
    const online = await urlExist(server)
    lastUsedCat = (lastUsedCat % 2) + 1
    if (online) {
      onlineCat = server
    } else {
      onlineCat = process.env['CAT_' + lastUsedCat]
    }
    next()
  },
  proxy(
    () => {
      console.log(onlineCat)
      return onlineCat
    },
    {
      //check cache part
      filter: function (req, res) {
        const topic = req.query.topic
        if (topic in searchCache) {
          res.send(searchCache[topic])
          console.log('sent from cache')
          return false
        }
        return true
      },
      userResDecorator: function (proxyRes, proxyResData, userReq, userRes) {
        //cahcing part
        console.log('sent from backend server ')
        data = JSON.parse(proxyResData.toString('utf8'))
        searchCache[userReq.query.topic] = data
        return JSON.stringify(data)
      },
    }
  )
)
//info with chaching and load balancing
router.get(
  '/info/:id*',
  async function (req, res, next) {
    //load balancing part
    let server = process.env['CAT_' + lastUsedCat]
    const online = await urlExist(server)
    lastUsedCat = (lastUsedCat % 2) + 1
    if (online) {
      onlineCat = server
    } else {
      onlineCat = process.env['CAT_' + lastUsedCat]
    }
    next()
  },
  proxy(
    () => {
      console.log(onlineCat)
      return onlineCat
    },
    {
      //check cache part
      filter: function (req, res) {
        const id = req.params.id
        if (id in infoCache) {
          res.send(infoCache[id])
          console.log('sent from cache')
          return false
        }
        return true
      },
      userResDecorator: function (proxyRes, proxyResData, userReq, userRes) {
        //cahcing part
        console.log('sent from backend server ')
        data = JSON.parse(proxyResData.toString('utf8'))
        infoCache[userReq.params.id] = data
        return JSON.stringify(data)
      },
    }
  )
)

module.exports = router
