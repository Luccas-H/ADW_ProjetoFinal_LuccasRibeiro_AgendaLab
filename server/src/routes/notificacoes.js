const { Router } = require('express')
const autenticar = require('../middlewares/autenticar')
const permitir = require('../middlewares/permitir')
const notificacaoController = require('../controllers/notificacaoController')

const router = Router()

router.get('/', autenticar, permitir('paciente'), notificacaoController.listar)
router.patch('/lidas', autenticar, permitir('paciente'), notificacaoController.marcarLidas)

module.exports = router
