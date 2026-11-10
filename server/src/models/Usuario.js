const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const enderecoSchema = new mongoose.Schema(
  {
    cep: String,
    rua: String,
    numero: String,
    complemento: String,
    bairro: String,
    cidade: String,
    estado: String
  },
  { _id: false }
)

const usuarioSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    usuario: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    senha: { type: String, required: true, select: false },
    perfil: {
      type: String,
      enum: ['paciente', 'recepcionista', 'admin'],
      default: 'paciente'
    },

    // Campos usados só por pacientes
    dataNascimento: Date,
    cpf: { type: String, unique: true, sparse: true },
    telefone: String,
    tipoSanguineo: String,
    convenio: String,
    filiacao: String,
    endereco: enderecoSchema
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.senha
        delete ret.__v
        return ret
      }
    }
  }
)

usuarioSchema.pre('save', async function () {
  if (this.isModified('senha')) {
    this.senha = await bcrypt.hash(this.senha, 10)
  }
})

usuarioSchema.methods.compararSenha = function (senha) {
  return bcrypt.compare(senha, this.senha)
}

module.exports = mongoose.model('Usuario', usuarioSchema)
