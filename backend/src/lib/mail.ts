import nodemailer from 'nodemailer'
import { lookup } from 'dns/promises'
import net from 'net'
import tls from 'tls'
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
      const socketOptions = { host: address, port, servername: host }

      const socket = port === 465
        ? tls.connect(socketOptions)
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

const transporter = nodemailer.createTransport(transportOptions)

export async function sendEmail(to: string, subject: string, html: string) {
  return transporter.sendMail({ from, to, subject, html })
}
