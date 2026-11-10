const request = require('supertest')
const app = require('../src/app')

test('GET /api/saude responde ok', async () => {
  const res = await request(app).get('/api/saude')
  expect(res.status).toBe(200)
  expect(res.body).toEqual({ status: 'ok' })
})

test('rota inexistente responde 404 em JSON', async () => {
  const res = await request(app).get('/api/nada')
  expect(res.status).toBe(404)
  expect(res.body.erro).toBe('Rota não encontrada')
})

test('JSON maior que 10kb é recusado', async () => {
  const res = await request(app).post('/api/saude').send({ texto: 'a'.repeat(11000) })
  expect(res.status).toBe(413)
  expect(res.body.erro).toBe('Requisição muito grande')
})

test('JSON malformado responde 400', async () => {
  const res = await request(app)
    .post('/api/saude')
    .set('Content-Type', 'application/json')
    .send('{"a":')
  expect(res.status).toBe(400)
  expect(res.body.erro).toBe('JSON inválido')
})
