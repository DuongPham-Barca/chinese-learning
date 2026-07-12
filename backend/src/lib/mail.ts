import nodemailer from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

const port = Number(requiredEnv('SMTP_PORT'))
if (!Number.isFinite(port)) throw new Error('SMTP_PORT is not configured')

const from = requiredEnv('SMTP_FROM')
const host = requiredEnv('SMTP_HOST')

const transportOptions: SMTPTransport.Options & { family: 4 } = {
  host,
  port,
  secure: port === 465,
  family: 4,
  connectionTimeout: 15_000,
  greetingTimeout: 15_000,
  socketTimeout: 30_000,
  auth: {
    user: requiredEnv('SMTP_USER'),
    pass: requiredEnv('SMTP_PASS'),
  },
  tls: {
    servername: host,
  },
}

const transporter = nodemailer.createTransport(transportOptions)

export async function sendEmail(to: string, subject: string, html: string) {
  return transporter.sendMail({ from, to, subject, html })
}
