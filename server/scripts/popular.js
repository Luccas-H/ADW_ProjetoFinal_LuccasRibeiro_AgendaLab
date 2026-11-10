// Preenche o banco com dados de exemplo para testar e apresentar o sistema.
// Uso: npm run popular (lê o MONGODB_URI do arquivo .env).
// Pode rodar mais de uma vez: o que já existe não é criado de novo.
const mongoose = require('mongoose')
const { conectar } = require('../src/config/db')
const Usuario = require('../src/models/Usuario')
const Especialidade = require('../src/models/Especialidade')
const Medico = require('../src/models/Medico')
const Horario = require('../src/models/Horario')

const ESPECIALIDADES = [
  { nome: 'Cardiologia', descricao: 'Coração e pressão arterial' },
  { nome: 'Pediatria', descricao: 'Crianças e adolescentes até 18 anos' },
  { nome: 'Ortopedia', descricao: 'Ossos, músculos e articulações' },
  { nome: 'Dermatologia', descricao: 'Pele, cabelo e unhas' },
  { nome: 'Clínica Geral', descricao: 'Consultas de rotina e encaminhamentos' },
  { nome: 'Oftalmologia', descricao: 'Olhos e visão' }
]

const MEDICOS = [
  { nome: 'Dra. Helena Prado', crm: '1001/RR', especialidade: 'Cardiologia' },
  { nome: 'Dr. Marcos Vieira', crm: '1002/RR', especialidade: 'Cardiologia' },
  { nome: 'Dr. Paulo Sena', crm: '1003/RR', especialidade: 'Pediatria' },
  { nome: 'Dra. Beatriz Nunes', crm: '1004/RR', especialidade: 'Pediatria' },
  { nome: 'Dr. Rui Tavares', crm: '1005/RR', especialidade: 'Ortopedia' },
  { nome: 'Dra. Lia Couto', crm: '1006/RR', especialidade: 'Dermatologia' },
  { nome: 'Dr. André Lopes', crm: '1007/RR', especialidade: 'Clínica Geral' },
  { nome: 'Dra. Camila Rocha', crm: '1008/RR', especialidade: 'Oftalmologia' }
]

function endereco(rua, numero) {
  return { cep: '69301110', rua, numero, complemento: '', bairro: 'Centro', cidade: 'Boa Vista', estado: 'RR' }
}

const PACIENTES = [
  {
    nome: 'Maria da Silva',
    usuario: 'maria.silva',
    email: 'maria@exemplo.com',
    cpf: '52998224725',
    dataNascimento: new Date('1990-05-20'),
    telefone: '95991234567',
    tipoSanguineo: 'O+',
    convenio: 'Unimed',
    filiacao: 'Ana da Silva',
    endereco: endereco('Avenida Major Williams', '250')
  },
  {
    nome: 'João Souza',
    usuario: 'joao.souza',
    email: 'joao@exemplo.com',
    cpf: '11144477735',
    dataNascimento: new Date('1985-09-02'),
    telefone: '95981112222',
    tipoSanguineo: 'A+',
    convenio: 'SUS',
    filiacao: 'Pedro Souza',
    endereco: endereco('Avenida Jaime Brasil', '120')
  },
  {
    nome: 'Ana Lima',
    usuario: 'ana.lima',
    email: 'ana@exemplo.com',
    cpf: '93541134780',
    dataNascimento: new Date('2001-12-11'),
    telefone: '95984443333',
    tipoSanguineo: 'B-',
    convenio: 'Particular',
    filiacao: 'Teresa Lima',
    endereco: endereco('Rua Floriano Peixoto', '78')
  }
]

const RECEPCIONISTA = {
  nome: 'Carla Mendes',
  usuario: 'recepcao',
  email: 'recepcao@agendalab.com',
  senha: 'recepcao123',
  perfil: 'recepcionista'
}

const SENHA_PACIENTES = 'paciente123'
const HORAS_DE_ATENDIMENTO = [8, 9, 10, 11, 14, 15]
const DIAS_A_FRENTE = 14

async function buscarOuCriarUsuario(dados) {
  const existente = await Usuario.findOne({ usuario: dados.usuario })
  if (existente) return existente

  try {
    return await Usuario.create(dados)
  } catch (erro) {
    // E-mail ou CPF já usados por outra conta criada no teste manual
    if (erro.code === 11000) {
      console.log(`Pulando ${dados.usuario}: e-mail ou CPF já usado por outra conta`)
      return null
    }
    throw erro
  }
}

// Hoje e os próximos dias, sem sábado e domingo
function diasUteis(agora) {
  const dias = []
  for (let i = 0; i <= DIAS_A_FRENTE; i++) {
    const dia = new Date(agora)
    dia.setDate(dia.getDate() + i)
    dia.setHours(0, 0, 0, 0)
    if (dia.getDay() !== 0 && dia.getDay() !== 6) {
      dias.push(dia)
    }
  }
  return dias
}

function naHora(dia, hora) {
  const data = new Date(dia)
  data.setHours(hora, 0, 0, 0)
  return data
}

// Marca só se o paciente ainda não tem consulta futura nessa especialidade e o horário está livre
async function marcarConsulta(paciente, medico, dataHora) {
  if (!paciente || !dataHora) return

  const jaTem = await Horario.exists({
    paciente: paciente._id,
    especialidade: medico.especialidade,
    dataHora: mongoose.trusted({ $gt: new Date() })
  })
  if (jaTem) return

  await Horario.updateOne({ medico: medico._id, dataHora, paciente: null }, { paciente: paciente._id })
}

async function popular() {
  const especialidades = {}
  for (const dados of ESPECIALIDADES) {
    const existente = await Especialidade.findOne({ nome: dados.nome }).collation({
      locale: 'pt',
      strength: 2
    })
    especialidades[dados.nome] = existente || (await Especialidade.create(dados))
  }

  const medicos = {}
  for (const dados of MEDICOS) {
    const existente = await Medico.findOne({ crm: dados.crm })
    medicos[dados.nome] =
      existente ||
      (await Medico.create({ ...dados, especialidade: especialidades[dados.especialidade]._id }))
  }

  await buscarOuCriarUsuario(RECEPCIONISTA)
  const pacientes = []
  for (const dados of PACIENTES) {
    pacientes.push(await buscarOuCriarUsuario({ ...dados, senha: SENHA_PACIENTES, perfil: 'paciente' }))
  }

  // Abre os horários de todos os médicos. O upsert não repete o que já existe.
  const agora = new Date()
  const dias = diasUteis(agora)
  const operacoes = []
  for (const dia of dias) {
    for (const hora of HORAS_DE_ATENDIMENTO) {
      const dataHora = naHora(dia, hora)
      if (dataHora <= agora) continue
      for (const medico of Object.values(medicos)) {
        operacoes.push({
          updateOne: {
            filter: { medico: medico._id, dataHora },
            update: { $setOnInsert: { especialidade: medico.especialidade, paciente: null } },
            upsert: true
          }
        })
      }
    }
  }
  if (operacoes.length > 0) {
    await Horario.bulkWrite(operacoes)
  }

  // Algumas consultas marcadas para o painel e "Minhas consultas" não começarem vazios
  const [maria, joao, ana] = pacientes
  const proximoDiaUtil = dias.find((dia) => dia.getDate() !== agora.getDate()) || dias[0]
  await marcarConsulta(maria, medicos['Dra. Helena Prado'], naHora(proximoDiaUtil, 9))
  await marcarConsulta(joao, medicos['Dr. Paulo Sena'], naHora(proximoDiaUtil, 10))

  const fimDeHoje = new Date(agora)
  fimDeHoje.setHours(23, 59, 59, 999)
  const livreHoje = await Horario.findOne({
    medico: medicos['Dr. André Lopes']._id,
    paciente: null,
    dataHora: mongoose.trusted({ $gt: agora, $lte: fimDeHoje })
  }).sort({ dataHora: 1 })
  await marcarConsulta(
    ana,
    medicos['Dr. André Lopes'],
    livreHoje ? livreHoje.dataHora : naHora(proximoDiaUtil, 14)
  )

  const idsPacientes = pacientes.filter(Boolean).map((paciente) => paciente._id)
  return {
    especialidades: Object.keys(especialidades).length,
    medicos: Object.keys(medicos).length,
    horarios: await Horario.countDocuments({ dataHora: mongoose.trusted({ $gt: agora }) }),
    consultas: await Horario.countDocuments({ paciente: mongoose.trusted({ $in: idsPacientes }) })
  }
}

async function main() {
  require('dotenv').config({ quiet: true })
  process.env.TZ = process.env.TZ || 'America/Boa_Vista'

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Os dados de exemplo não podem ser criados em produção')
  }
  if (!process.env.MONGODB_URI) {
    throw new Error('Defina MONGODB_URI no arquivo .env')
  }

  await conectar(process.env.MONGODB_URI)
  const resumo = await popular()

  console.log('Dados de exemplo prontos:')
  console.log(
    `  ${resumo.especialidades} especialidades, ${resumo.medicos} médicos, ` +
      `${resumo.horarios} horários futuros, ${resumo.consultas} consultas marcadas`
  )
  console.log('Contas para testar:')
  console.log(`  recepcionista: ${RECEPCIONISTA.usuario} / ${RECEPCIONISTA.senha}`)
  console.log(`  pacientes: maria.silva, joao.souza e ana.lima, com a senha ${SENHA_PACIENTES}`)
  console.log('  admin: o que foi criado com npm run criar-admin')
}

if (require.main === module) {
  main()
    .catch((erro) => {
      console.error('Erro ao criar os dados de exemplo:', erro.message)
      process.exitCode = 1
    })
    .finally(() => mongoose.disconnect())
}

module.exports = { popular }
