import { useEffect, useState } from 'react'
import { validCNPJ, maskCNPJ, maskPhone } from './cnpj'
import { WHATS, TRADE } from './data'

const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ')
const FAT = ['Até R$ 100 mil/mês', 'R$ 100 a 300 mil/mês', 'R$ 300 mil a 1 mi/mês', 'Acima de R$ 1 mi/mês']
const INTERESTS = TRADE.map(o => o.t)
const ENDPOINT = import.meta.env.VITE_LEAD_ENDPOINT

export default function LeadForm({ tab, setTab, preset }) {
  const [data, setData] = useState({ interesses: [] })
  const [err, setErr] = useState({})
  const [sent, setSent] = useState(false)

  useEffect(() => { setErr({}); setSent(false) }, [tab])
  // "Quero esta cota" no catálogo já marca o interesse
  useEffect(() => {
    if (preset) setData(d => ({ ...d, interesses: d.interesses.includes(preset.v) ? d.interesses : [...d.interesses, preset.v] }))
  }, [preset])

  const set = (k, mask) => e => setData(d => ({ ...d, [k]: mask ? mask(e.target.value) : e.target.value }))
  const toggle = i => setData(d => ({ ...d, interesses: d.interesses.includes(i) ? d.interesses.filter(x => x !== i) : [...d.interesses, i] }))

  const validate = () => {
    const e = {}, req = tab === 'lojista' ? ['loja', 'cnpj', 'cidade', 'uf', 'faturamento', 'whatsapp'] : ['empresa', 'nome', 'cargo', 'email', 'whatsapp']
    req.forEach(k => !String(data[k] || '').trim() && (e[k] = 'Obrigatório'))
    if (tab === 'lojista' && data.cnpj && !validCNPJ(data.cnpj)) e.cnpj = 'CNPJ inválido'
    if (tab === 'industria' && data.email && !/^\S+@\S+\.\S+$/.test(data.email)) e.email = 'E-mail inválido'
    if (data.whatsapp && data.whatsapp.replace(/\D/g, '').length < 10) e.whatsapp = 'Informe DDD + número'
    if (!data.lgpd) e.lgpd = 'Precisamos do seu aceite'
    setErr(e)
    return !Object.keys(e).length
  }

  const submit = async ev => {
    ev.preventDefault()
    if (!validate()) return
    const lead = { tipo: tab, origem: 'site-home', ...data, enviadoEm: new Date().toISOString() }
    let ok = false
    if (ENDPOINT) ok = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) }).then(r => r.ok).catch(() => false)
    if (!ok) {
      const lines = tab === 'lojista'
        ? [`Quero ser Attini!`, `Loja: ${data.loja}`, `CNPJ: ${data.cnpj}`, `Cidade: ${data.cidade}/${data.uf}`, `Faturamento: ${data.faturamento}`, `WhatsApp: ${data.whatsapp}`]
        : [`Sou indústria e quero falar com a Attini.`, `Empresa: ${data.empresa}`, `Contato: ${data.nome} (${data.cargo})`, `E-mail: ${data.email}`, `WhatsApp: ${data.whatsapp}`, data.interesses.length ? `Interesse: ${data.interesses.join(', ')}` : '', data.msg ? `Mensagem: ${data.msg}` : '']
      window.open(`https://wa.me/${WHATS}?text=${encodeURIComponent(lines.filter(Boolean).join('\n'))}`, '_blank', 'noopener')
    }
    setSent(true)
  }

  const F = ({ k, label, type = 'text', mask, ...p }) => (
    <label className={`field ${err[k] ? 'bad' : ''}`}>
      <input type={type} value={data[k] || ''} onChange={set(k, mask)} placeholder=" " name={k} {...p} />
      <span>{label}</span>
      {err[k] && <em>{err[k]}</em>}
    </label>
  )
  const S = ({ k, label, opts }) => (
    <label className={`field ${err[k] ? 'bad' : ''}`}>
      <select value={data[k] || ''} onChange={set(k)} name={k} className={data[k] ? 'has' : ''}>
        <option value="" disabled hidden />
        {opts.map(o => <option key={o}>{o}</option>)}
      </select>
      <span>{label}</span>
      {err[k] && <em>{err[k]}</em>}
    </label>
  )

  return (
    <section className="contact" id="contato">
      <div className="wrap contact-grid">
        <div className="contact-copy">
          <p className="eyebrow">Fale com a Attini</p>
          <h2 className="h2 split">{(tab === 'lojista' ? ['Vem pra', 'Rede Attini.'] : ['Leve sua marca', 'para a rede.']).map(l => <span className="line" key={l}><span>{l}</span></span>)}</h2>
          <p className="lead reveal-up">
            {tab === 'industria'
              ? 'Conte quem é sua marca. Nosso time comercial responde com o tamanho da rede na sua categoria e os espaços disponíveis.'
              : 'Leva dois minutos. Um consultor da rede liga para entender sua loja e mostrar quanto ela pode ganhar comprando em rede.'}
          </p>
          <figure className="contact-photo reveal-up">
            <img src="/img/tina.webp" alt="Atendente da Rede Attini" loading="lazy" />
            <figcaption>Resposta em até 1 dia útil<br /><span>ou agora mesmo pelo WhatsApp</span></figcaption>
          </figure>
        </div>

        <div className="form-card">
          <div className="tabs" role="tablist">
            {[['lojista', 'Sou lojista'], ['industria', 'Sou indústria']].map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
            ))}
            <i style={{ transform: `translateX(${tab === 'industria' ? 100 : 0}%)` }} />
          </div>

          {sent ? (
            <div className="sent">
              <div className="sent-mark">✓</div>
              <h3>Recebemos. Você já faz parte da conversa.</h3>
              <p>{ENDPOINT ? 'Nosso time entra em contato em até 1 dia útil.' : 'Abrimos o WhatsApp com seus dados. É só enviar a mensagem.'}</p>
              <button className="btn btn-o" onClick={() => setSent(false)}>Enviar outro</button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate key={tab}>
              {tab === 'lojista' ? (
                <div className="fields">
                  {F({ k: 'loja', label: 'Nome da loja', autoComplete: 'organization' })}
                  {F({ k: 'cnpj', label: 'CNPJ', mask: maskCNPJ, inputMode: 'numeric' })}
                  <div className="row">{F({ k: 'cidade', label: 'Cidade', autoComplete: 'address-level2' })}{S({ k: 'uf', label: 'UF', opts: UFS })}</div>
                  {S({ k: 'faturamento', label: 'Faturamento aproximado', opts: FAT })}
                  {F({ k: 'whatsapp', label: 'WhatsApp', type: 'tel', mask: maskPhone, autoComplete: 'tel' })}
                </div>
              ) : (
                <div className="fields">
                  {F({ k: 'empresa', label: 'Indústria / marca', autoComplete: 'organization' })}
                  <div className="row">{F({ k: 'nome', label: 'Seu nome', autoComplete: 'name' })}{F({ k: 'cargo', label: 'Cargo', autoComplete: 'organization-title' })}</div>
                  <div className="row">{F({ k: 'email', label: 'E-mail corporativo', type: 'email', autoComplete: 'email' })}{F({ k: 'whatsapp', label: 'WhatsApp', type: 'tel', mask: maskPhone, autoComplete: 'tel' })}</div>
                  <fieldset className="chips">
                    <legend>O que te interessa?</legend>
                    {INTERESTS.map(i => <button type="button" key={i} aria-pressed={data.interesses.includes(i)} onClick={() => toggle(i)}>{i}</button>)}
                  </fieldset>
                  <label className="field"><textarea rows="2" value={data.msg || ''} onChange={set('msg')} placeholder=" " /><span>Mensagem (opcional)</span></label>
                </div>
              )}
              <label className={`lgpd ${err.lgpd ? 'bad' : ''}`}>
                <input type="checkbox" checked={!!data.lgpd} onChange={e => setData(d => ({ ...d, lgpd: e.target.checked }))} />
                <span>Autorizo a Rede Attini a usar estes dados para entrar em contato, conforme a LGPD.</span>
              </label>
              <button className="btn btn-y btn-big magnetic" type="submit">
                {tab === 'lojista' ? 'Quero ser Attini' : 'Quero vender para a rede'} <span aria-hidden="true">→</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
