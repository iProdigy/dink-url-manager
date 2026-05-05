import app from './dist/dink_url_manager/worker.js'

async function test() {
  try {
    const res = await app.request('/')
    const html = await res.text()
    console.log(html)
  } catch (e) {
    console.error('Error:', e)
  }
}

test()
