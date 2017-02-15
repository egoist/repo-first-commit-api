const express = require('express')
const repo = require('repo-first-commit')
const LRU = require('lru-cache')

const app = express()

const cache = LRU({
  max: 1024 * 10,
  maxAge: 1000 * 60 * 24 * 365
})

app.get('/', (req, res) => {
  res.send(`GET /:owner/:repo/:sha?
<br><br>
Optional query: ?token=token
<br><br>
For example: <a href="/vuejs/vue">vuejs/vue</a>
`)
})

app.get('/:owner/:repo/:sha?', (req, res) => {
  const {token} = req.query
  const id = req.params.owner + '/' + req.params.repo + (req.params.sha || '')
  let cached
  if (cached = cache.get(id)) {
    console.log(`Using cache for ${id}`)
    return res.send(cached)
  }
  console.log('Sending request...')
  repo(Object.assign({token}, req.params))
    .then(commit => {
      cache.set(id, JSON.stringify(commit))
      res.send(commit)
    })
    .catch(err => {
      if (err.response) {
        console.log(err.response)
        res.send({
          error: true,
          message: err.response.statusText
        })
      } else {
        res.send({
          error: true,
          message: err.message
        })
      }
    })
})

app.listen(3000)
console.log(`> Open http://localhost:3000`)
