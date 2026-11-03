import { useState } from 'react'
import { TRADE } from './data'

const Detail = ({ o }) => (
  <>
    <p className="of-d">{o.d}</p>
    <div className="of-cols">
      <div>
        <p className="of-k">O que inclui</p>
        <ul className="of-list">{o.inclui.map(x => <li key={x}>{x}</li>)}</ul>
      </div>
      <div className="of-meta">
        <p className="of-k">Formato</p><p>{o.formato}</p>
        <p className="of-k">Ideal para</p><p>{o.ideal}</p>
      </div>
    </div>
    <a href="#contato" data-tab="industria" data-interest={o.t} className="btn btn-y magnetic">Quero esta cota →</a>
  </>
)

export default function Offers() {
  const [i, setI] = useState(0)
  const o = TRADE[i]
  return (
    <section className="offers wrap" id="ofertas" aria-labelledby="of-t">
      <div className="of-head">
        <p className="eyebrow">O que a rede oferece à indústria</p>
        <h2 className="h2 split" id="of-t"><span className="line"><span>{TRADE.length} formas de</span></span><span className="line"><span>entrar na colônia.</span></span></h2>
        <p className="lead reveal-up">Da negociação de tabela ao consumidor final. Escolha uma frente ou monte um plano anual com várias.</p>
      </div>

      <div className="of-grid">
        <ol className="of-menu">
          {TRADE.map((x, k) => (
            <li key={x.t} className={k === i ? 'on' : ''}>
              <button onClick={() => setI(k)} onMouseEnter={() => matchMedia('(min-width: 1000px)').matches && setI(k)} aria-expanded={k === i}>
                <span className="of-n">{String(k + 1).padStart(2, '0')}</span>
                <span className="of-t">{x.t}</span>
                <span className="of-tag">{x.tag}</span>
              </button>
              <div className="of-inline"><img src={x.img} alt="" loading="lazy" /><Detail o={x} /></div>
            </li>
          ))}
        </ol>

        <div className="of-panel" aria-live="polite">
          <div className="of-img">
            {TRADE.map((x, k) => <img key={x.t} src={x.img} alt={k === i ? x.t : ''} className={k === i ? 'on' : ''} loading="lazy" />)}
            <span className="of-badge">{o.tag}</span>
          </div>
          <div className="of-body" key={i}>
            <h3>{o.t}</h3>
            <Detail o={o} />
          </div>
        </div>
      </div>
    </section>
  )
}
