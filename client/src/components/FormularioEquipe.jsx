import { useState } from 'react'
import Campo from './Campo'
import { validarEmail, validarNome, validarSenha, validarUsuario } from '../utils/validacao'

// Conta de recepcionista ou admin. No modo "nova" pede usuário e senha;
// no modo "edicao" só nome e e-mail podem mudar.
function FormularioEquipe({ modo, inicial, enviando, errosApi = {}, textoBotao, onEnviar }) {
  const nova = modo === 'nova'
  const [dados, setDados] = useState({
    nome: inicial?.nome || '',
    email: inicial?.email || '',
    usuario: '',
    senha: ''
  })
  const [erros, setErros] = useState({})

  const erro = (campo) => erros[campo] || errosApi[campo]

  function alterar(campo, valor) {
    setDados((atual) => ({ ...atual, [campo]: valor }))
  }

  function enviar(evento) {
    evento.preventDefault()

    const encontrados = {}
    const anotar = (campo, mensagem) => {
      if (mensagem) encontrados[campo] = mensagem
    }
    anotar('nome', validarNome(dados.nome))
    anotar('email', validarEmail(dados.email))
    if (nova) {
      anotar('usuario', validarUsuario(dados.usuario))
      anotar('senha', validarSenha(dados.senha))
    }

    setErros(encontrados)
    if (Object.keys(encontrados).length > 0) return

    onEnviar(nova ? dados : { nome: dados.nome, email: dados.email })
  }

  return (
    <form onSubmit={enviar} noValidate>
      <Campo
        id="equipe-nome"
        rotulo="Nome completo"
        value={dados.nome}
        onChange={(e) => alterar('nome', e.target.value)}
        erro={erro('nome')}
        autoFocus
      />
      <Campo
        id="equipe-email"
        rotulo="E-mail"
        type="email"
        value={dados.email}
        onChange={(e) => alterar('email', e.target.value)}
        erro={erro('email')}
      />
      {nova && (
        <>
          <Campo
            id="equipe-usuario"
            rotulo="Nome de usuário"
            value={dados.usuario}
            onChange={(e) => alterar('usuario', e.target.value)}
            autoComplete="off"
            erro={erro('usuario')}
          />
          <Campo
            id="equipe-senha"
            rotulo="Senha inicial"
            type="password"
            value={dados.senha}
            onChange={(e) => alterar('senha', e.target.value)}
            autoComplete="new-password"
            erro={erro('senha')}
          />
          <p className="dica">Passe a senha inicial para a recepcionista pessoalmente.</p>
        </>
      )}

      <button type="submit" className="botao" disabled={enviando}>
        {enviando && <span className="spinner" aria-hidden="true" />}
        {enviando ? 'Salvando...' : textoBotao}
      </button>
    </form>
  )
}

export default FormularioEquipe
