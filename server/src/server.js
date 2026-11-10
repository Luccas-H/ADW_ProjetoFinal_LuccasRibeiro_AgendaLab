require('dotenv').config({ quiet: true })
process.env.TZ = process.env.TZ || 'America/Boa_Vista'

const http = require('http')
const app = require('./app')
const { conectar } = require('./config/db')

const { MONGODB_URI, JWT_SECRET, PORT = 3001 } = process.env

if (!MONGODB_URI || !JWT_SECRET) {
  console.error('Defina MONGODB_URI e JWT_SECRET no arquivo .env')
  process.exit(1)
}

async function iniciar() {
  await conectar(MONGODB_URI)

  const servidor = http.createServer(app)
  servidor.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`)
  })
}

iniciar().catch((err) => {
  console.error('Não foi possível iniciar o servidor:', err.message)
  process.exit(1)
})
