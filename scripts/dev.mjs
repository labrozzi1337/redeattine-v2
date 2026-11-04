// npm run dev: sobe o site (Vite, http://localhost:5173) e o back-end (Next.js, http://localhost:3001) juntos.
// Ctrl+C desliga os dois. O site repassa /api para o back-end (proxy no vite.config.js).
import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const win = process.platform === 'win32'
if (!existsSync('server/node_modules')) {
  console.log('Instalando as dependências do back-end (server/)...')
  spawnSync('npm', ['install', '--prefix', 'server'], { stdio: 'inherit', shell: true })
}

const procs = []
let stopping = false

function run(name, color, args, cwd) {
  const p = spawn('npx', args, { cwd, shell: true, detached: !win, env: { ...process.env, FORCE_COLOR: '1' } })
  const tag = `\x1b[${color}m[${name}]\x1b[0m `
  const out = d => process.stdout.write(d.toString().replace(/^(?=.)/gm, tag))
  p.stdout.on('data', out)
  p.stderr.on('data', out)
  p.on('exit', code => { if (!stopping) { console.log(`${tag}parou (código ${code}). Desligando o resto.`); stop(code || 1) } })
  procs.push(p)
}

function stop(code = 0) {
  if (stopping) return
  stopping = true
  for (const p of procs) {
    try { win ? spawnSync('taskkill', ['/pid', String(p.pid), '/T', '/F'], { stdio: 'ignore' }) : process.kill(-p.pid, 'SIGTERM') } catch {}
  }
  setTimeout(() => process.exit(code), 300)
}
process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())

run('api ', 33, ['next', 'dev', '-p', '3001'], 'server')
run('site', 36, ['vite', '--port', '5173'], '.')
