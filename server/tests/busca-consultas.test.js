const request = require('supertest')
const ajuda = require('./ajuda')
const app = require('../src/app')

const { criarUsuario, tokenPara, criarMedico, criarHorario, amanha } = ajuda

beforeAll(ajuda.iniciarBanco)
afterEach(ajuda.limparBanco)
afterAll(ajuda.pararBanco)

function buscar(q, usuario) {
  return request(app)
    .get('/api/horarios/busca')
    .query({ q })
    .set('Authorization', `Bearer ${tokenPara(usuario)}`)
}

function formatarCpf(cpf) {
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`
}

// Ana tem uma consulta amanhã e uma que já passou; João tem uma amanhã; um horário livre
async function cenario() {
  const medico = await criarMedico('Cardiologia')
  const ana = await criarUsuario('paciente', { nome: 'Ana Lima', telefone: '95984443333' })
  const joao = await criarUsuario('paciente', { nome: 'João Souza', telefone: '95981112222' })
  const anteontem = amanha(8)
  anteontem.setDate(anteontem.getDate() - 3)
  await criarHorario(medico, amanha(9), ana)
  await criarHorario(medico, anteontem, ana)
  await criarHorario(medico, amanha(10), joao)
  await criarHorario(medico, amanha(11))
  const recepcionista = await criarUsuario('recepcionista')
  return { ana, joao, recepcionista }
}

test('busca por parte do nome traz as consultas do paciente, futuras e passadas', async () => {
  const { recepcionista } = await cenario()

  const res = await buscar('ana', recepcionista)

  expect(res.status).toBe(200)
  expect(res.body).toHaveLength(2)
  expect(res.body.every((consulta) => consulta.paciente.nome === 'Ana Lima')).toBe(true)
})

test('a resposta traz nome, telefone e convênio do paciente, mas não o CPF', async () => {
  const { recepcionista } = await cenario()

  const res = await buscar('João', recepcionista)

  expect(Object.keys(res.body[0].paciente).sort()).toEqual(['_id', 'convenio', 'nome', 'telefone'])
})

test('busca pelo telefone completo, com máscara, e por parte do telefone', async () => {
  const { recepcionista } = await cenario()

  const completo = await buscar('(95) 98444-3333', recepcionista)
  const parte = await buscar('1112', recepcionista)

  expect(completo.body).toHaveLength(2)
  expect(parte.body).toHaveLength(1)
  expect(parte.body[0].paciente.nome).toBe('João Souza')
})

test('busca pelo CPF completo encontra; CPF pela metade não', async () => {
  const { ana, recepcionista } = await cenario()

  const completo = await buscar(formatarCpf(ana.cpf), recepcionista)
  const metade = await buscar(ana.cpf.slice(0, 6), recepcionista)

  expect(completo.body).toHaveLength(2)
  expect(metade.body).toEqual([])
})

test('horários livres não aparecem na busca', async () => {
  const { recepcionista } = await cenario()

  const res = await buscar('Souza', recepcionista)

  expect(res.body).toHaveLength(1)
  expect(res.body[0].livre).toBe(false)
})

test('menos de 4 números dá 400', async () => {
  const { recepcionista } = await cenario()

  const res = await buscar('123', recepcionista)

  expect(res.status).toBe(400)
  expect(res.body.erro).toBe('Digite pelo menos 4 números do telefone ou o CPF completo')
})

test('caracteres especiais não quebram a busca', async () => {
  const { recepcionista } = await cenario()

  const res = await buscar('(.*', recepcionista)

  expect(res.status).toBe(200)
  expect(res.body).toEqual([])
})

test('filtra só pelo convênio', async () => {
  const medico = await criarMedico('Cardiologia')
  const sus = await criarUsuario('paciente', { convenio: 'SUS' })
  const unimed = await criarUsuario('paciente', { convenio: 'Unimed' })
  await criarHorario(medico, amanha(9), sus)
  await criarHorario(medico, amanha(10), unimed)

  const res = await buscar(undefined, await criarUsuario('recepcionista')).query({ convenio: 'SUS' })

  expect(res.status).toBe(200)
  expect(res.body).toHaveLength(1)
  expect(res.body[0].paciente.convenio).toBe('SUS')
})

test('combina nome e convênio', async () => {
  const medico = await criarMedico('Cardiologia')
  const anaSus = await criarUsuario('paciente', { nome: 'Ana Lima', convenio: 'SUS' })
  const anaUnimed = await criarUsuario('paciente', { nome: 'Ana Souza', convenio: 'Unimed' })
  await criarHorario(medico, amanha(9), anaSus)
  await criarHorario(medico, amanha(10), anaUnimed)

  const res = await buscar('ana', await criarUsuario('recepcionista')).query({ convenio: 'Unimed' })

  expect(res.body).toHaveLength(1)
  expect(res.body[0].paciente.nome).toBe('Ana Souza')
})

test('filtra pelo médico e traz só horários com consulta', async () => {
  const helena = await criarMedico('Cardiologia')
  const paulo = await criarMedico('Pediatria')
  await criarHorario(helena, amanha(9), await criarUsuario())
  await criarHorario(helena, amanha(10))
  await criarHorario(paulo, amanha(9), await criarUsuario())

  const res = await buscar(undefined, await criarUsuario('recepcionista')).query({
    medico: String(helena._id)
  })

  expect(res.body).toHaveLength(1)
  expect(res.body[0].medico.nome).toBe(helena.nome)
})

test('sem nome, convênio nem médico dá 400', async () => {
  const res = await buscar(undefined, await criarUsuario('recepcionista'))

  expect(res.status).toBe(400)
})

test('admin também busca e paciente não pode (403)', async () => {
  const { ana } = await cenario()

  const admin = await buscar('ana', await criarUsuario('admin'))
  const paciente = await buscar('ana', ana)

  expect(admin.status).toBe(200)
  expect(paciente.status).toBe(403)
})
