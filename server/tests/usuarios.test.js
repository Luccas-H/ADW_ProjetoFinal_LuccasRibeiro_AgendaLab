const request = require('supertest')
const ajuda = require('./ajuda')
const app = require('../src/app')
const Usuario = require('../src/models/Usuario')
const Horario = require('../src/models/Horario')

const { criarUsuario, tokenPara, criarMedico, criarHorario, amanha, DADOS_PACIENTE } = ajuda

beforeAll(ajuda.iniciarBanco)
afterEach(ajuda.limparBanco)
afterAll(ajuda.pararBanco)

function autorizacao(usuario) {
  return { Authorization: `Bearer ${tokenPara(usuario)}` }
}

// Dados que o paciente pode editar (sem usuário, senha e CPF)
const { usuario: _usuario, senha: _senha, cpf: _cpf, ...DADOS_EDITAVEIS } = DADOS_PACIENTE

function formatarCpf(cpf) {
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`
}

describe('dados do próprio paciente', () => {
  test('paciente vê todos os próprios dados, inclusive CPF', async () => {
    const paciente = await criarUsuario()

    const res = await request(app).get('/api/usuarios/me').set(autorizacao(paciente))

    expect(res.status).toBe(200)
    expect(res.body.cpf).toBe(paciente.cpf)
    expect(res.body.endereco.cidade).toBe('Boa Vista')
    expect(res.body.senha).toBeUndefined()
  })

  test('paciente edita os próprios dados mas não muda CPF, usuário, perfil nem senha', async () => {
    const paciente = await criarUsuario()

    const res = await request(app)
      .put('/api/usuarios/me')
      .set(autorizacao(paciente))
      .send({
        ...DADOS_EDITAVEIS,
        nome: 'Maria Souza',
        cpf: '11144477735',
        usuario: 'outro.usuario',
        perfil: 'admin',
        senha: 'novasenha1'
      })

    expect(res.status).toBe(200)
    expect(res.body.nome).toBe('Maria Souza')

    const salvo = await Usuario.findById(paciente._id).select('+senha')
    expect(salvo.cpf).toBe(paciente.cpf)
    expect(salvo.usuario).toBe(paciente.usuario)
    expect(salvo.perfil).toBe('paciente')
    expect(await salvo.compararSenha('senha1234')).toBe(true)
  })
})

describe('gestão de usuários pelo admin', () => {
  test('recepcionista não vê a ficha completa (403)', async () => {
    const paciente = await criarUsuario()
    const recepcionista = await criarUsuario('recepcionista')

    const res = await request(app).get(`/api/usuarios/${paciente._id}`).set(autorizacao(recepcionista))

    expect(res.status).toBe(403)
  })

  test('admin vê a ficha completa', async () => {
    const paciente = await criarUsuario()
    const admin = await criarUsuario('admin')

    const res = await request(app).get(`/api/usuarios/${paciente._id}`).set(autorizacao(admin))

    expect(res.status).toBe(200)
    expect(res.body.cpf).toBe(paciente.cpf)
    expect(res.body.tipoSanguineo).toBe('O+')
  })

  test('admin lista usuários filtrando por perfil e por nome', async () => {
    const admin = await criarUsuario('admin')
    await criarUsuario()
    await criarUsuario()
    await criarUsuario('recepcionista')

    const pacientes = await request(app).get('/api/usuarios?perfil=paciente').set(autorizacao(admin))
    const busca = await request(app).get('/api/usuarios?busca=recepcionista').set(autorizacao(admin))

    expect(pacientes.body).toHaveLength(2)
    expect(pacientes.body[0].cpf).toBeUndefined()
    expect(busca.body).toHaveLength(1)
    expect(busca.body[0].perfil).toBe('recepcionista')
  })

  test('paciente não lista usuários (403)', async () => {
    const paciente = await criarUsuario()

    const res = await request(app).get('/api/usuarios').set(autorizacao(paciente))

    expect(res.status).toBe(403)
  })

  test('admin cria recepcionista mesmo se mandar perfil admin', async () => {
    const admin = await criarUsuario('admin')

    const res = await request(app)
      .post('/api/usuarios')
      .set(autorizacao(admin))
      .send({
        nome: 'Joana Lima',
        usuario: 'joana',
        email: 'joana@agendalab.com',
        senha: 'senha1234',
        perfil: 'admin'
      })

    expect(res.status).toBe(201)
    expect(res.body.perfil).toBe('recepcionista')
    expect(res.body.senha).toBeUndefined()
  })

  test('admin edita recepcionista só com nome e e-mail', async () => {
    const admin = await criarUsuario('admin')
    const recepcionista = await criarUsuario('recepcionista')

    const res = await request(app)
      .put(`/api/usuarios/${recepcionista._id}`)
      .set(autorizacao(admin))
      .send({ nome: 'Joana Souza', email: 'joana.souza@agendalab.com' })

    expect(res.status).toBe(200)
    expect(res.body.nome).toBe('Joana Souza')
  })

  test('admin edita paciente e a validação continua valendo', async () => {
    const admin = await criarUsuario('admin')
    const paciente = await criarUsuario()

    const valido = await request(app)
      .put(`/api/usuarios/${paciente._id}`)
      .set(autorizacao(admin))
      .send({ ...DADOS_EDITAVEIS, convenio: 'SUS' })
    const invalido = await request(app)
      .put(`/api/usuarios/${paciente._id}`)
      .set(autorizacao(admin))
      .send({ ...DADOS_EDITAVEIS, telefone: '123' })

    expect(valido.status).toBe(200)
    expect(valido.body.convenio).toBe('SUS')
    expect(invalido.status).toBe(400)
    expect(invalido.body.campos.telefone).toBeDefined()
  })

  test('admin não exclui a própria conta', async () => {
    const admin = await criarUsuario('admin')

    const res = await request(app).delete(`/api/usuarios/${admin._id}`).set(autorizacao(admin))

    expect(res.status).toBe(409)
    expect(res.body.erro).toBe('Você não pode excluir a própria conta')
  })

  test('excluir paciente libera as consultas futuras dele', async () => {
    const admin = await criarUsuario('admin')
    const paciente = await criarUsuario()
    const horario = await criarHorario(await criarMedico(), amanha(), paciente)

    const res = await request(app).delete(`/api/usuarios/${paciente._id}`).set(autorizacao(admin))

    expect(res.status).toBe(204)
    expect(await Usuario.findById(paciente._id)).toBeNull()
    expect((await Horario.findById(horario._id)).paciente).toBeNull()
  })
})

describe('busca de pacientes pela equipe', () => {
  function buscar(q, usuario) {
    return request(app)
      .get('/api/pacientes/busca')
      .query({ q })
      .set(autorizacao(usuario))
  }

  test('devolve só nome, telefone e convênio', async () => {
    await criarUsuario()
    const recepcionista = await criarUsuario('recepcionista')

    const res = await buscar('Paciente', recepcionista)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(Object.keys(res.body[0]).sort()).toEqual(['_id', 'convenio', 'nome', 'telefone'])
  })

  test('não traz recepcionistas nem admins', async () => {
    const recepcionista = await criarUsuario('recepcionista')
    await criarUsuario('admin')

    const res = await buscar('a', recepcionista)
    const resNome = await buscar('Recepcionista', recepcionista)

    expect(res.status).toBe(400)
    expect(resNome.body).toEqual([])
  })

  test('busca por CPF completo encontra; CPF pela metade não', async () => {
    const paciente = await criarUsuario()
    const recepcionista = await criarUsuario('recepcionista')

    const completo = await buscar(formatarCpf(paciente.cpf), recepcionista)
    const metade = await buscar(paciente.cpf.slice(0, 6), recepcionista)

    expect(completo.body).toHaveLength(1)
    expect(completo.body[0].nome).toBe(paciente.nome)
    expect(metade.body).toEqual([])
  })

  test('busca com caracteres especiais não quebra', async () => {
    await criarUsuario()
    const recepcionista = await criarUsuario('recepcionista')

    const res = await buscar('(.*', recepcionista)

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  test('paciente não usa a busca (403)', async () => {
    const paciente = await criarUsuario()

    const res = await buscar('Paciente', paciente)

    expect(res.status).toBe(403)
  })
})
