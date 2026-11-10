const { Router } = require('express')
const autenticar = require('../middlewares/autenticar')
const permitir = require('../middlewares/permitir')
const painelController = require('../controllers/painelController')

const router = Router()

router.get('/', autenticar, permitir('recepcionista', 'admin'), painelController.resumo)

module.exports = router
