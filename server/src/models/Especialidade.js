const mongoose = require('mongoose')

const especialidadeSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    descricao: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
)

// Nome único sem diferenciar maiúsculas de minúsculas ("Cardiologia" = "cardiologia")
especialidadeSchema.index({ nome: 1 }, { unique: true, collation: { locale: 'pt', strength: 2 } })

module.exports = mongoose.model('Especialidade', especialidadeSchema)
