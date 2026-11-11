const Notificacao = require('../models/Notificacao')

async function listar(req, res) {
  const [notificacoes, naoLidas] = await Promise.all([
    Notificacao.find({ usuario: req.usuario._id }).sort({ createdAt: -1 }).limit(20),
    Notificacao.countDocuments({ usuario: req.usuario._id, lida: false })
  ])
  res.json({ naoLidas, notificacoes })
}

async function marcarLidas(req, res) {
  await Notificacao.updateMany({ usuario: req.usuario._id, lida: false }, { lida: true })
  res.status(204).end()
}

module.exports = { listar, marcarLidas }
