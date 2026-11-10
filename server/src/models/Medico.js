const mongoose = require('mongoose')

const medicoSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    crm: { type: String, required: true, unique: true, uppercase: true, trim: true },
    especialidade: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Especialidade',
      required: true
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Medico', medicoSchema)
