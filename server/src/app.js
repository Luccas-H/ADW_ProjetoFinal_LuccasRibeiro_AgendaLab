const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const { tratarErros, rotaNaoEncontrada } = require('./middlewares/erros')
const authRoutes = require('./routes/auth')
const especialidadeRoutes = require('./routes/especialidades')
const medicoRoutes = require('./routes/medicos')

const app = express()

// No Render a API fica atrás de um proxy; sem isso o limite de login usaria o IP do proxy
app.set('trust proxy', 1)

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json({ limit: '10kb' }))

app.get('/api/saude', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/especialidades', especialidadeRoutes)
app.use('/api/medicos', medicoRoutes)

app.use(rotaNaoEncontrada)
app.use(tratarErros)

module.exports = app
