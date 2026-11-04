import nodemailer from 'nodemailer'

// E-mail é opcional: sem SMTP_URL, o painel mostra o link para o administrador copiar e enviar.
export const mailOn = () => !!process.env.SMTP_URL

export async function sendMail(to, subject, text) {
  if (!mailOn()) return false
  const tx = nodemailer.createTransport(process.env.SMTP_URL)
  await tx.sendMail({ from: process.env.MAIL_FROM || 'Rede Attini <nao-responda@redeattini.com.br>', to, subject, text })
  return true
}

export const inviteText = (name, link) => `Olá, ${name}!

Você foi convidado(a) para o painel do blog da Rede Attini.
Crie sua senha por este link (vale por 7 dias):

${link}

Rede Attini`

export const resetText = (name, link) => `Olá, ${name}!

Para criar uma nova senha no painel do blog da Rede Attini, use este link (vale por 24 horas):

${link}

Se você não pediu, pode ignorar este e-mail.`
