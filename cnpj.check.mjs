// node cnpj.check.mjs
import assert from 'node:assert'
import { validCNPJ, maskCNPJ, maskPhone } from './src/cnpj.js'

assert(validCNPJ('11.222.333/0001-81'))
assert(validCNPJ('11222333000181'))
assert(!validCNPJ('11.222.333/0001-82'))
assert(!validCNPJ('11.111.111/1111-11'))
assert(!validCNPJ('123'))
assert.equal(maskCNPJ('11222333000181'), '11.222.333/0001-81')
assert.equal(maskPhone('63999998888'), '(63) 99999-8888')
console.log('ok')
