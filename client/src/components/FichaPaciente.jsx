import { formatarDataNascimento, mascaraCep, mascaraCpf, mascaraTelefone } from '../utils/formatar'

// Todos os dados do paciente. Só o Admin chega a ver esta ficha.
function FichaPaciente({ paciente }) {
  const { endereco } = paciente
  const complemento = endereco.complemento ? `, ${endereco.complemento}` : ''

  return (
    <dl className="ficha">
      <dt>Nome</dt>
      <dd>{paciente.nome}</dd>
      <dt>Usuário</dt>
      <dd>{paciente.usuario}</dd>
      <dt>E-mail</dt>
      <dd>{paciente.email}</dd>
      <dt>CPF</dt>
      <dd>{mascaraCpf(paciente.cpf)}</dd>
      <dt>Nascimento</dt>
      <dd>{formatarDataNascimento(paciente.dataNascimento)}</dd>
      <dt>Sexo</dt>
      <dd>{paciente.sexo === 'Outro' ? paciente.sexoDescricao : paciente.sexo || 'Não informado'}</dd>
      <dt>Celular</dt>
      <dd>{mascaraTelefone(paciente.telefone)}</dd>
      <dt>Mãe ou pai</dt>
      <dd>{paciente.filiacao}</dd>
      <dt>Tipo sanguíneo</dt>
      <dd>{paciente.tipoSanguineo}</dd>
      <dt>Convênio</dt>
      <dd>{paciente.convenio}</dd>
      <dt>Endereço</dt>
      <dd>
        {endereco.rua}, {endereco.numero}
        {complemento}
        <br />
        {endereco.bairro}, {endereco.cidade}/{endereco.estado}
        <br />
        CEP {mascaraCep(endereco.cep)}
      </dd>
    </dl>
  )
}

export default FichaPaciente
