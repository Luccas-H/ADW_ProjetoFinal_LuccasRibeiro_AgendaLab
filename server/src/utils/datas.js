// "11/11 às 08:00", no fuso do servidor (TZ=America/Boa_Vista)
function formatarDiaHora(data) {
  const dia = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${dia} às ${hora}`
}

module.exports = { formatarDiaHora }
