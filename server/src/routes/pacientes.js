const { Router } = require('express')
const autenticar = require('../middlewares/autenticar')
const permitir = require('../middlewares/permitir')
const { validar } = require('../middlewares/validar')
const { buscaPacienteSchema } = require('../validators/usuario')
const pacienteController = require('../controllers/pacienteController')

const router = Router()

router.get(
  '/busca',
  autenticar,
  permitir('recepcionista', 'admin'),
  validar(buscaPacienteSchema, 'query'),
  pacienteController.buscar
)

module.exports = router
