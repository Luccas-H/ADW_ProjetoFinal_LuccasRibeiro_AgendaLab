const mongoose = require('mongoose')

// Aviso para o paciente quando a recepção mexe na consulta dele
const notificacaoSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    mensagem: { type: String, required: true },
    lida: { type: Boolean, default: false }
  },
  { timestamps: true }
)

notificacaoSchema.index({ usuario: 1, createdAt: -1 })

module.exports = mongoose.model('Notificacao', notificacaoSchema)
