const mongoose = require('mongoose')

// Um horário aberto pela equipe. Ele vira consulta quando recebe um paciente.
const horarioSchema = new mongoose.Schema(
  {
    medico: { type: mongoose.Schema.Types.ObjectId, ref: 'Medico', required: true },
    // Copiada do médico ao criar, para buscar horários por especialidade sem consultar os médicos
    especialidade: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Especialidade',
      required: true
    },
    dataHora: { type: Date, required: true },
    paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null }
  },
  { timestamps: true }
)

horarioSchema.index({ medico: 1, dataHora: 1 }, { unique: true })
horarioSchema.index({ especialidade: 1, dataHora: 1 })

module.exports = mongoose.model('Horario', horarioSchema)
