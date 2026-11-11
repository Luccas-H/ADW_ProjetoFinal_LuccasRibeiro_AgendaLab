const { Router } = require('express')
const autenticar = require('../middlewares/autenticar')
const permitir = require('../middlewares/permitir')
const validarId = require('../middlewares/validarId')
const { validar } = require('../middlewares/validar')
const {
  criarHorarioSchema,
  filtroHorariosSchema,
  agendarSchema,
  remarcarSchema,
  buscaConsultasSchema
} = require('../validators/horario')
const horarioController = require('../controllers/horarioController')

const router = Router()

router.get('/', autenticar, validar(filtroHorariosSchema, 'query'), horarioController.listar)
router.get('/meus', autenticar, permitir('paciente'), horarioController.meus)
router.get(
  '/busca',
  autenticar,
  permitir('recepcionista', 'admin'),
  validar(buscaConsultasSchema, 'query'),
  horarioController.buscarConsultas
)

router.post(
  '/',
  autenticar,
  permitir('recepcionista', 'admin'),
  validar(criarHorarioSchema),
  horarioController.criar
)
router.delete(
  '/:id',
  autenticar,
  permitir('recepcionista', 'admin'),
  validarId,
  horarioController.excluir
)

router.patch('/:id/agendar', autenticar, validarId, validar(agendarSchema), horarioController.agendar)
router.patch('/:id/cancelar', autenticar, validarId, horarioController.cancelar)
router.patch(
  '/:id/remarcar',
  autenticar,
  permitir('recepcionista', 'admin'),
  validarId,
  validar(remarcarSchema),
  horarioController.remarcar
)

module.exports = router
