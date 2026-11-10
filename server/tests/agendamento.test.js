const request = require('supertest')
const ajuda = require('./ajuda')
const app = require('../src/app')
const Horario = require('../src/models/Horario')

const { criarUsuario, tokenPara, criarMedico, criarHorario, amanha } = ajuda

beforeAll(ajuda.iniciarBanco)
afterEach(ajuda.limparBanco)
afterAll(ajuda.pararBanco)

const ONTEM = () => new Date(Date.now() - 24 * 60 * 60 * 1000)

function agendar(horario, usuario, corpo = {}) {
  return request(app)
    .patch(`/api/horarios/${horario._id}/agendar`)
    .set('Authorization', `Bearer ${tokenPara(usuario)}`)
    .send(corpo)
}

function cancelar(horario, usuario) {
  return request(app)
    .patch(`/api/horarios/${horario._id}/cancelar`)
    .set('Authorization', `Bearer ${tokenPara(usuario)}`)
}

async function pacienteDoHorario(horario) {
  const atual = await Horario.findById(horario._id)
  return atual.paciente ? String(atual.paciente) : null
}

test('paciente marca horário livre', async () => {
  const horario = await criarHorario(await criarMedico())
  const paciente = await criarUsuario()

  const res = await agendar(horario, paciente)

  expect(res.status).toBe(200)
  expect(res.body.livre).toBe(false)
  expect(res.body.meu).toBe(true)
  expect(await pacienteDoHorario(horario)).toBe(String(paciente._id))
})

test('horário ocupado dá 409', async () => {
  const horario = await criarHorario(await criarMedico(), amanha(), await criarUsuario())

  const res = await agendar(horario, await criarUsuario())

  expect(res.status).toBe(409)
  expect(res.body.erro).toBe('Esse horário não está mais disponível')
})

test('horário que já passou dá 409', async () => {
  const horario = await criarHorario(await criarMedico(), ONTEM())

  const res = await agendar(horario, await criarUsuario())

  expect(res.status).toBe(409)
  expect(res.body.erro).toBe('Esse horário não está mais disponível')
})

test('pacienteId enviado por paciente é ignorado', async () => {
  const horario = await criarHorario(await criarMedico())
  const pacienteA = await criarUsuario()
  const pacienteB = await criarUsuario()

  const res = await agendar(horario, pacienteA, { pacienteId: String(pacienteB._id) })

  expect(res.status).toBe(200)
  expect(await pacienteDoHorario(horario)).toBe(String(pacienteA._id))
})

test('recepcionista marca para um paciente', async () => {
  const horario = await criarHorario(await criarMedico())
  const paciente = await criarUsuario()
  const recepcionista = await criarUsuario('recepcionista')

  const res = await agendar(horario, recepcionista, { pacienteId: String(paciente._id) })

  expect(res.status).toBe(200)
  expect(res.body.paciente.nome).toBe(paciente.nome)
  expect(await pacienteDoHorario(horario)).toBe(String(paciente._id))
})

test('recepcionista sem pacienteId dá 400', async () => {
  const horario = await criarHorario(await criarMedico())

  const res = await agendar(horario, await criarUsuario('recepcionista'))

  expect(res.status).toBe(400)
  expect(res.body.campos.pacienteId).toBe('Escolha o paciente')
})

test('pacienteId de uma recepcionista dá 400', async () => {
  const horario = await criarHorario(await criarMedico())
  const outraRecepcionista = await criarUsuario('recepcionista')

  const res = await agendar(horario, await criarUsuario('recepcionista'), {
    pacienteId: String(outraRecepcionista._id)
  })

  expect(res.status).toBe(400)
  expect(res.body.erro).toBe('Paciente não encontrado')
})

// "11/11" do dia de amanhã, como aparece nas mensagens
function diaMes(data) {
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

test('não marca duas consultas na mesma especialidade e diz qual já existe', async () => {
  const medico = await criarMedico('Cardiologia')
  const primeiro = await criarHorario(medico, amanha(9))
  const segundo = await criarHorario(medico, amanha(10))
  const paciente = await criarUsuario()
  await agendar(primeiro, paciente)

  const res = await agendar(segundo, paciente)

  expect(res.status).toBe(409)
  expect(res.body.erro).toBe(
    `Você já tem uma consulta de Cardiologia marcada com ${medico.nome} em ${diaMes(amanha())} às 09:00. ` +
      'Para trocar, desmarque essa consulta primeiro.'
  )
})

test('não marca dois horários no mesmo dia e hora e diz qual consulta ocupa o horário', async () => {
  const cardiologista = await criarMedico('Cardiologia')
  const cardiologia = await criarHorario(cardiologista, amanha(9))
  const pediatria = await criarHorario(await criarMedico('Pediatria'), amanha(9))
  const paciente = await criarUsuario()
  await agendar(cardiologia, paciente)

  const res = await agendar(pediatria, paciente)

  expect(res.status).toBe(409)
  expect(res.body.erro).toBe(
    `Você já tem uma consulta de Cardiologia com ${cardiologista.nome} nesse mesmo horário ` +
      `(${diaMes(amanha())} às 09:00).`
  )
})

test('retorno: depois que a consulta passou, a recepção marca outra com o mesmo médico no mesmo horário em outro dia', async () => {
  const medico = await criarMedico('Cardiologia')
  const paciente = await criarUsuario()
  const ontemAs8 = amanha(8)
  ontemAs8.setDate(ontemAs8.getDate() - 2)
  await criarHorario(medico, ontemAs8, paciente)
  const retorno = await criarHorario(medico, amanha(8))

  const res = await agendar(retorno, await criarUsuario('recepcionista'), {
    pacienteId: String(paciente._id)
  })

  expect(res.status).toBe(200)
  expect(await pacienteDoHorario(retorno)).toBe(String(paciente._id))
})

test('retorno marcado logo depois da consulta, no mesmo dia, também é aceito', async () => {
  const medico = await criarMedico('Cardiologia')
  const paciente = await criarUsuario()
  await criarHorario(medico, new Date(Date.now() - 60 * 60 * 1000), paciente)
  const retorno = await criarHorario(medico, amanha(8))

  const res = await agendar(retorno, await criarUsuario('recepcionista'), {
    pacienteId: String(paciente._id)
  })

  expect(res.status).toBe(200)
})

test('conflito de especialidade aparece antes do conflito de horário', async () => {
  // Caso do teste manual: Cardiologia às 08:00 e Clínica Geral às 14:00;
  // tentar Cardiologia às 14:00 tem que falar da Cardiologia, não da Clínica Geral
  const cardiologista = await criarMedico('Cardiologia')
  const clinico = await criarMedico('Clínica Geral')
  const paciente = await criarUsuario()
  await criarHorario(cardiologista, amanha(8), paciente)
  await criarHorario(clinico, amanha(14), paciente)
  const tentativa = await criarHorario(cardiologista, amanha(14))

  const res = await agendar(tentativa, await criarUsuario('recepcionista'), {
    pacienteId: String(paciente._id)
  })

  expect(res.status).toBe(409)
  expect(res.body.erro).toBe(
    `${paciente.nome} já tem uma consulta de Cardiologia marcada com ${cardiologista.nome} ` +
      `em ${diaMes(amanha())} às 08:00. Para trocar, desmarque essa consulta primeiro.`
  )
})

test('dois pacientes ao mesmo tempo: só um consegue', async () => {
  const horario = await criarHorario(await criarMedico())
  const pacienteA = await criarUsuario()
  const pacienteB = await criarUsuario()

  const [r1, r2] = await Promise.all([agendar(horario, pacienteA), agendar(horario, pacienteB)])

  expect([r1.status, r2.status].sort()).toEqual([200, 409])
})

test('paciente desmarca a própria consulta e o horário volta a ficar livre', async () => {
  const paciente = await criarUsuario()
  const horario = await criarHorario(await criarMedico(), amanha(), paciente)

  const res = await cancelar(horario, paciente)

  expect(res.status).toBe(200)
  expect(res.body.livre).toBe(true)
  expect(await pacienteDoHorario(horario)).toBeNull()
})

test('paciente não desmarca consulta de outro (403)', async () => {
  const horario = await criarHorario(await criarMedico(), amanha(), await criarUsuario())

  const res = await cancelar(horario, await criarUsuario())

  expect(res.status).toBe(403)
})

test('recepcionista desmarca qualquer consulta', async () => {
  const horario = await criarHorario(await criarMedico(), amanha(), await criarUsuario())

  const res = await cancelar(horario, await criarUsuario('recepcionista'))

  expect(res.status).toBe(200)
  expect(await pacienteDoHorario(horario)).toBeNull()
})

test('não desmarca consulta que já passou', async () => {
  const paciente = await criarUsuario()
  const horario = await criarHorario(await criarMedico(), ONTEM(), paciente)

  const res = await cancelar(horario, paciente)

  expect(res.status).toBe(409)
  expect(res.body.erro).toBe('Não é possível desmarcar uma consulta que já passou')
})

test('desmarcar horário livre dá 409', async () => {
  const horario = await criarHorario(await criarMedico())

  const res = await cancelar(horario, await criarUsuario('recepcionista'))

  expect(res.status).toBe(409)
  expect(res.body.erro).toBe('Esse horário não tem consulta marcada')
})

test('GET /horarios/meus devolve só as consultas do paciente', async () => {
  const medico = await criarMedico()
  const pacienteA = await criarUsuario()
  const pacienteB = await criarUsuario()
  await criarHorario(medico, amanha(9), pacienteA)
  await criarHorario(medico, amanha(10), pacienteB)

  const res = await request(app)
    .get('/api/horarios/meus')
    .set('Authorization', `Bearer ${tokenPara(pacienteA)}`)

  expect(res.status).toBe(200)
  expect(res.body).toHaveLength(1)
  expect(res.body[0].meu).toBe(true)
})

test('sem token dá 401', async () => {
  const horario = await criarHorario(await criarMedico())

  const res = await request(app).patch(`/api/horarios/${horario._id}/agendar`)

  expect(res.status).toBe(401)
})
