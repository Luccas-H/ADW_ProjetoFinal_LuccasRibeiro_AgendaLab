const { rateLimit } = require('express-rate-limit')

// Só as tentativas que dão erro contam: depois de 5 senhas erradas, o IP fica bloqueado por 20 minutos
const limiteLogin = rateLimit({
  windowMs: 20 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas. Tente novamente em 20 minutos.' }
})

const limiteCadastro = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { erro: 'Muitos cadastros feitos daqui. Tente novamente mais tarde.' }
})

module.exports = { limiteLogin, limiteCadastro }
