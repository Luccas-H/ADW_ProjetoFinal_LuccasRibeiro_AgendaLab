const { Router } = require('express')
const autenticar = require('../middlewares/autenticar')
const permitir = require('../middlewares/permitir')
const validarId = require('../middlewares/validarId')
const { validar } = require('../middlewares/validar')
const {
  dadosPacienteSchema,
  recepcionistaSchema,
  filtroUsuariosSchema
} = require('../validators/usuario')
const usuarioController = require('../controllers/usuarioController')

const router = Router()

// Paciente: os próprios dados (declaradas antes de /:id)
router.get('/me', autenticar, permitir('paciente'), usuarioController.meusDados)
router.put(
  '/me',
  autenticar,
  permitir('paciente'),
  validar(dadosPacienteSchema),
  usuarioController.atualizarMeusDados
)

// Admin: gestão de todos os usuários
router.get(
  '/',
  autenticar,
  permitir('admin'),
  validar(filtroUsuariosSchema, 'query'),
  usuarioController.listar
)
router.get('/:id', autenticar, permitir('admin'), validarId, usuarioController.buscarPorId)
router.post(
  '/',
  autenticar,
  permitir('admin'),
  validar(recepcionistaSchema),
  usuarioController.criarRecepcionista
)
router.put('/:id', autenticar, permitir('admin'), validarId, usuarioController.atualizar)
router.delete('/:id', autenticar, permitir('admin'), validarId, usuarioController.excluir)

module.exports = router
