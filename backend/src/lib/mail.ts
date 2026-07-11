import nodemailer from 'nodemailer'

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

const port = Number(requiredEnv('SMTP_PORT'))
if (!Number.isFinite(port)) throw new Error('SMTP_PORT is not configured')

const from = requiredEnv('SMTP_FROM')

const transporter = nodemailer.createTransport({
  host: requiredEnv('SMTP_HOST'),
  port,
  secure: port === 465,
  auth: {
    user: requiredEnv('SMTP_USER'),
    pass: requiredEnv('SMTP_PASS'),
  },
})

export async function sendEmail(to: string, subject: string, html: string) {
  return transporter.sendMail({ from, to, subject, html })
}
