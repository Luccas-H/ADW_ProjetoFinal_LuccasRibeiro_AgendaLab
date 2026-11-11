import { useRef, useState } from 'react'
import Campo from './Campo'
import { SEXOS, TIPOS_SANGUINEOS, CONVENIOS, ESTADOS } from '../utils/listas'
import { validarPaciente } from '../utils/validacao'
import {
  apenasDigitos,
  dataParaIso,
  isoParaData,
  mascaraCep,
  mascaraCpf,
  mascaraData,
  mascaraTelefone
} from '../utils/formatar'

const VAZIO = {
  usuario: '',
  email: '',
  senha: '',
  confirmarSenha: '',
  nome: '',
  dataNascimento: '',
  sexo: '',
  sexoDescricao: '',
  cpf: '',
  telefone: '',
  filiacao: '',
  tipoSanguineo: '',
  convenio: '',
  endereco: { cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' }
}

// Converte o paciente que vem da API para o formato dos campos
function prepararInicial(inicial) {
  if (!inicial) return VAZIO
  return {
    ...VAZIO,
    ...inicial,
    senha: '',
    confirmarSenha: '',
    dataNascimento: isoParaData(inicial.dataNascimento),
    sexo: inicial.sexo || '',
    sexoDescricao: inicial.sexoDescricao || '',
    cpf: mascaraCpf(inicial.cpf || ''),
    telefone: mascaraTelefone(inicial.telefone || ''),
    endereco: {
      ...VAZIO.endereco,
      ...inicial.endereco,
      cep: mascaraCep(inicial.endereco?.cep || ''),
      complemento: inicial.endereco?.complemento || ''
    }
  }
}

// Usado no cadastro (modo "cadastro") e na edição dos dados (modo "edicao")
function FormularioPaciente({ modo, inicial, enviando, errosApi = {}, textoBotao, onEnviar }) {
  const [dados, setDados] = useState(() => prepararInicial(inicial))
  const [erros, setErros] = useState({})
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [avisoCep, setAvisoCep] = useState('')
  const ultimoCep = useRef(apenasDigitos(dados.endereco.cep))
  const cadastro = modo === 'cadastro'

  const erro = (campo) => erros[campo] || errosApi[campo]

  function alterar(campo, valor) {
    setDados((atual) => ({ ...atual, [campo]: valor }))
  }

  function alterarEndereco(campo, valor) {
    setDados((atual) => ({ ...atual, endereco: { ...atual.endereco, [campo]: valor } }))
  }

  // O fetch é direto (sem o axios da API) para o token não ser enviado para fora
  async function buscarCep(cep) {
    setBuscandoCep(true)
    setAvisoCep('')
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const endereco = await resposta.json()
      if (endereco.erro) {
        setAvisoCep('CEP não encontrado')
        return
      }
      setDados((atual) => ({
        ...atual,
        endereco: {
          ...atual.endereco,
          rua: endereco.logradouro || atual.endereco.rua,
          bairro: endereco.bairro || atual.endereco.bairro,
          cidade: endereco.localidade || atual.endereco.cidade,
          estado: endereco.uf || atual.endereco.estado
        }
      }))
    } catch {
      setAvisoCep('Não foi possível buscar o CEP. Preencha o endereço manualmente.')
    } finally {
      setBuscandoCep(false)
    }
  }

  function alterarCep(valor) {
    const cep = mascaraCep(valor)
    alterarEndereco('cep', cep)

    const digitos = apenasDigitos(cep)
    if (digitos.length === 8 && digitos !== ultimoCep.current) {
      ultimoCep.current = digitos
      buscarCep(digitos)
    }
  }

  function enviar(evento) {
    evento.preventDefault()
    const encontrados = validarPaciente(dados, modo)
    setErros(encontrados)
    if (Object.keys(encontrados).length > 0) {
      return
    }

    // A confirmação de senha só serve aqui na tela. Na edição, usuário, senha e CPF não vão.
    const envio = { ...dados, dataNascimento: dataParaIso(dados.dataNascimento) }
    delete envio.confirmarSenha
    if (envio.sexo !== 'Outro') {
      delete envio.sexoDescricao
    }
    if (!cadastro) {
      delete envio.usuario
      delete envio.senha
      delete envio.cpf
    }
    onEnviar(envio)
  }

  const temErros = Object.keys(erros).length > 0

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      {temErros && (
        <div className="alerta alerta-erro" role="alert">
          Confira os campos marcados em vermelho.
        </div>
      )}

      <fieldset>
        <legend>Acesso</legend>
        <div className="form-grade">
          <Campo
            id="usuario"
            rotulo="Nome de usuário"
            value={dados.usuario}
            onChange={(e) => alterar('usuario', e.target.value)}
            readOnly={!cadastro}
            autoComplete="username"
            erro={erro('usuario')}
          />
          <Campo
            id="email"
            rotulo="E-mail"
            type="email"
            value={dados.email}
            onChange={(e) => alterar('email', e.target.value)}
            autoComplete="email"
            erro={erro('email')}
          />
          {cadastro && (
            <>
              <Campo
                id="senha"
                rotulo="Senha"
                type="password"
                value={dados.senha}
                onChange={(e) => alterar('senha', e.target.value)}
                autoComplete="new-password"
                erro={erro('senha')}
              />
              <Campo
                id="confirmarSenha"
                rotulo="Confirme a senha"
                type="password"
                value={dados.confirmarSenha}
                onChange={(e) => alterar('confirmarSenha', e.target.value)}
                autoComplete="new-password"
                erro={erro('confirmarSenha')}
              />
            </>
          )}
        </div>
        {cadastro && (
          <p className="dica">A senha precisa ter pelo menos 8 caracteres, com letra e número.</p>
        )}
      </fieldset>

      <fieldset>
        <legend>Dados pessoais</legend>
        <div className="form-grade">
          <Campo
            id="nome"
            rotulo="Nome completo"
            className="largo"
            value={dados.nome}
            onChange={(e) => alterar('nome', e.target.value)}
            autoComplete="name"
            erro={erro('nome')}
          />
          <Campo
            id="dataNascimento"
            rotulo="Data de nascimento"
            inputMode="numeric"
            placeholder="dd/mm/aaaa"
            value={dados.dataNascimento}
            onChange={(e) => alterar('dataNascimento', mascaraData(e.target.value))}
            erro={erro('dataNascimento')}
          />
          <Campo
            id="cpf"
            rotulo="CPF"
            inputMode="numeric"
            value={dados.cpf}
            onChange={(e) => alterar('cpf', mascaraCpf(e.target.value))}
            readOnly={!cadastro}
            erro={erro('cpf')}
          />

          {/* Sexo ocupa a linha inteira; o campo de "Outro" aparece na mesma linha */}
          <div
            className={erro('sexo') || erro('sexoDescricao') ? 'campo campo-invalido largo' : 'campo largo'}
          >
            <span className="rotulo-campo" id="sexo-rotulo">
              Sexo
            </span>
            <div className="opcoes" role="radiogroup" aria-labelledby="sexo-rotulo">
              {SEXOS.map((sexo) => (
                <label key={sexo} className="opcao">
                  <input
                    type="radio"
                    name="sexo"
                    value={sexo}
                    checked={dados.sexo === sexo}
                    onChange={(e) => alterar('sexo', e.target.value)}
                  />
                  {sexo}
                </label>
              ))}
              {dados.sexo === 'Outro' && (
                <input
                  id="sexoDescricao"
                  className="opcao-texto"
                  placeholder="Como você se identifica?"
                  aria-label="Como você se identifica?"
                  value={dados.sexoDescricao}
                  onChange={(e) => alterar('sexoDescricao', e.target.value)}
                  maxLength={40}
                />
              )}
            </div>
            {erro('sexo') && <p className="erro-campo">{erro('sexo')}</p>}
            {erro('sexoDescricao') && (
              <p className="erro-campo">Escreva como você se identifica.</p>
            )}
          </div>
          <Campo
            id="telefone"
            rotulo="Celular com DDD"
            type="tel"
            value={dados.telefone}
            onChange={(e) => alterar('telefone', mascaraTelefone(e.target.value))}
            autoComplete="tel"
            erro={erro('telefone')}
          />
          <Campo
            id="filiacao"
            rotulo="Nome da mãe ou do pai"
            value={dados.filiacao}
            onChange={(e) => alterar('filiacao', e.target.value)}
            erro={erro('filiacao')}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>Saúde</legend>
        <div className="form-grade">
          <Campo id="tipoSanguineo" rotulo="Tipo sanguíneo" erro={erro('tipoSanguineo')}>
            <select
              id="tipoSanguineo"
              value={dados.tipoSanguineo}
              onChange={(e) => alterar('tipoSanguineo', e.target.value)}
            >
              <option value="">Escolha</option>
              {TIPOS_SANGUINEOS.map((tipo) => (
                <option key={tipo}>{tipo}</option>
              ))}
            </select>
          </Campo>
          <Campo id="convenio" rotulo="Convênio" erro={erro('convenio')}>
            <select
              id="convenio"
              value={dados.convenio}
              onChange={(e) => alterar('convenio', e.target.value)}
            >
              <option value="">Escolha</option>
              {CONVENIOS.map((convenio) => (
                <option key={convenio}>{convenio}</option>
              ))}
            </select>
          </Campo>
        </div>
      </fieldset>

      <fieldset>
        <legend>Endereço</legend>
        <div className="form-grade">
          <Campo
            id="cep"
            rotulo="CEP"
            inputMode="numeric"
            value={dados.endereco.cep}
            onChange={(e) => alterarCep(e.target.value)}
            autoComplete="postal-code"
            erro={erro('endereco.cep') || avisoCep}
          />
          <p className="dica dica-cep">
            {buscandoCep ? 'Buscando endereço...' : 'Digite o CEP para preencher o endereço.'}
          </p>
          <Campo
            id="rua"
            rotulo="Rua"
            className="largo"
            value={dados.endereco.rua}
            onChange={(e) => alterarEndereco('rua', e.target.value)}
            erro={erro('endereco.rua')}
          />
          <Campo
            id="numero"
            rotulo="Número"
            value={dados.endereco.numero}
            onChange={(e) => alterarEndereco('numero', e.target.value)}
            erro={erro('endereco.numero')}
          />
          <Campo
            id="complemento"
            rotulo="Complemento (opcional)"
            value={dados.endereco.complemento}
            onChange={(e) => alterarEndereco('complemento', e.target.value)}
            erro={erro('endereco.complemento')}
          />
          <Campo
            id="bairro"
            rotulo="Bairro"
            value={dados.endereco.bairro}
            onChange={(e) => alterarEndereco('bairro', e.target.value)}
            erro={erro('endereco.bairro')}
          />
          <Campo
            id="cidade"
            rotulo="Cidade"
            value={dados.endereco.cidade}
            onChange={(e) => alterarEndereco('cidade', e.target.value)}
            erro={erro('endereco.cidade')}
          />
          <Campo id="estado" rotulo="Estado" erro={erro('endereco.estado')}>
            <select
              id="estado"
              value={dados.endereco.estado}
              onChange={(e) => alterarEndereco('estado', e.target.value)}
            >
              <option value="">Escolha</option>
              {ESTADOS.map((estado) => (
                <option key={estado}>{estado}</option>
              ))}
            </select>
          </Campo>
        </div>
      </fieldset>

      <button type="submit" className="botao" disabled={enviando}>
        {enviando && <span className="spinner" aria-hidden="true" />}
        {enviando ? 'Salvando...' : textoBotao}
      </button>
    </form>
  )
}

export default FormularioPaciente
