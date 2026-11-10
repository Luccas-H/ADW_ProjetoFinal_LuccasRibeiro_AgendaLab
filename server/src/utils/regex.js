// Escapa os caracteres especiais para a busca tratar o texto digitado como texto,
// e não como uma expressão regular (ex.: "(.*" não pode virar "qualquer coisa")
function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

module.exports = { escaparRegex }
