const { Router } = require('express')
const autenticar = require('../middlewares/autenticar')
const permitir = require('../middlewares/permitir')
const validarId = require('../middlewares/validarId')
const { validar } = require('../middlewares/validar')
const { especialidadeSchema } = require('../validators/especialidade')
const especialidadeController = require('../controllers/especialidadeController')

const router = Router()

// A lista é pública porque aparece na homepage
router.get('/', especialidadeController.listar)

router.post(
  '/',
  autenticar,
  permitir('admin'),
  validar(especialidadeSchema),
  especialidadeController.criar
)
router.put(
  '/:id',
  autenticar,
  permitir('admin'),
  validarId,
  validar(especialidadeSchema),
  especialidadeController.atualizar
)
router.delete('/:id', autenticar, permitir('admin'), validarId, especialidadeController.excluir)

module.exports = router
