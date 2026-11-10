const { Router } = require('express')
const { validar } = require('../middlewares/validar')
const { cadastroSchema } = require('../validators/usuario')
const authController = require('../controllers/authController')

const router = Router()

router.post('/cadastro', validar(cadastroSchema), authController.cadastro)

module.exports = router
