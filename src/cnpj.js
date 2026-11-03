export function validCNPJ(v) {
  const d = String(v).replace(/\D/g, '')
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false
  const dv = n => {
    let s = 0, w = n - 7
    for (let i = 0; i < n; i++) { s += +d[i] * w--; if (w < 2) w = 9 }
    const r = s % 11
    return r < 2 ? 0 : 11 - r
  }
  return dv(12) === +d[12] && dv(13) === +d[13]
}

export const maskCNPJ = v => v.replace(/\D/g, '').slice(0, 14)
  .replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
  .replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2')

export const maskPhone = v => {
  const d = v.replace(/\D/g, '').slice(0, 11)
  return d.length > 10 ? d.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3') : d.replace(/^(\d{0,2})(\d{0,4})(\d{0,4})/, (m, a, b, c) => (a ? `(${a}` : '') + (a.length === 2 ? ') ' : '') + b + (c ? `-${c}` : ''))
}
