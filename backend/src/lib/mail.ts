import { lookup } from 'dns/promises'
import net from 'net'
import nodemailer from 'nodemailer'
import tls from 'tls'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value || undefined
}

function requiredEnv(name: string): string {
  const value = optionalEnv(name)
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function emailFrom() {
  return optionalEnv('EMAIL_FROM') || optionalEnv('SMTP_FROM') || optionalEnv('BREVO_SENDER_EMAIL') || requiredEnv('SMTP_USER')
}

function brevoSender() {
  return {
    email: optionalEnv('BREVO_SENDER_EMAIL') || emailFrom(),
    name: optionalEnv('BREVO_SENDER_NAME') || 'ChineseDict',
  }
}

let smtpTransporter: nodemailer.Transporter | null = null

function getSmtpTransporter() {
  if (smtpTransporter) return smtpTransporter

  const host = requiredEnv('SMTP_HOST')
  const port = Number(requiredEnv('SMTP_PORT'))
  if (!Number.isFinite(port)) throw new Error('SMTP_PORT is not configured')

  const transportOptions: SMTPTransport.Options = {
    host,
    port,
    secure: port === 465,
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
    getSocket(_options, callback) {
      void (async () => {
        const { address } = await lookup(host, { family: 4 })
        const socket = port === 465
          ? tls.connect({ host: address, port, servername: host })
          : net.connect({ host: address, port })

        const onError = (error: Error) => callback(error, false)
        socket.once('error', onError)
        socket.once('connect', () => {
          socket.off('error', onError)
          callback(null, {
            connection: socket,
            ...(port === 465 ? { secured: true } : {}),
          })
        })
      })().catch((error) => {
        callback(error instanceof Error ? error : new Error(String(error)), false)
      })
    },
  }

  smtpTransporter = nodemailer.createTransport(transportOptions)
  return smtpTransporter
}

async function sendWithResend(to: string, subject: string, html: string) {
  const apiKey = requiredEnv('RESEND_API_KEY')
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom(),
      to: [to],
      subject,
      html,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Resend email failed (${response.status}): ${body}`)
  }
}

async function sendWithBrevo(to: string, subject: string, html: string) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': requiredEnv('BREVO_API_KEY'),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: brevoSender(),
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Brevo email failed (${response.status}): ${body}`)
  }
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (optionalEnv('BREVO_API_KEY')) {
    await sendWithBrevo(to, subject, html)
    return
  }

  if (optionalEnv('RESEND_API_KEY')) {
    await sendWithResend(to, subject, html)
    return
  }

  await getSmtpTransporter().sendMail({
    from: emailFrom(),
    to,
    subject,
    html,
  })
}
