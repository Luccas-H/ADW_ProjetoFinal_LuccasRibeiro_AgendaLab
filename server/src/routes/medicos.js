const { Router } = require('express')
const autenticar = require('../middlewares/autenticar')
const permitir = require('../middlewares/permitir')
const validarId = require('../middlewares/validarId')
const { validar } = require('../middlewares/validar')
const { medicoSchema, filtroMedicosSchema } = require('../validators/medico')
const medicoController = require('../controllers/medicoController')

const router = Router()

router.get('/', autenticar, validar(filtroMedicosSchema, 'query'), medicoController.listar)

router.post('/', autenticar, permitir('admin'), validar(medicoSchema), medicoController.criar)
router.put(
  '/:id',
  autenticar,
  permitir('admin'),
  validarId,
  validar(medicoSchema),
  medicoController.atualizar
)
router.delete('/:id', autenticar, permitir('admin'), validarId, medicoController.excluir)

module.exports = router
