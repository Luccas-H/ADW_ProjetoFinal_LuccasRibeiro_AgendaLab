const { cpfValido, limparCpf } = require('../src/utils/cpf')

test('aceita CPF com dígitos verificadores corretos', () => {
  expect(cpfValido('52998224725')).toBe(true)
})

test('recusa CPF com dígito verificador errado', () => {
  expect(cpfValido('52998224724')).toBe(false)
})

test('recusa CPF com todos os dígitos iguais', () => {
  expect(cpfValido('11111111111')).toBe(false)
})

test('recusa CPF com tamanho errado', () => {
  expect(cpfValido('123')).toBe(false)
})

test('limparCpf deixa só os números', () => {
  expect(limparCpf('529.982.247-25 ')).toBe('52998224725')
})
