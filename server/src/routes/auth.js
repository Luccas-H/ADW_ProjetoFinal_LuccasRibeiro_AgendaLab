const { Router } = require('express')
const autenticar = require('../middlewares/autenticar')
const { validar } = require('../middlewares/validar')
const { limiteLogin, limiteCadastro } = require('../middlewares/limites')
const { cadastroSchema, loginSchema } = require('../validators/usuario')
const authController = require('../controllers/authController')

const router = Router()

router.post('/cadastro', limiteCadastro, validar(cadastroSchema), authController.cadastro)
router.post('/login', limiteLogin, validar(loginSchema), authController.login)
router.get('/me', autenticar, authController.me)

module.exports = router
