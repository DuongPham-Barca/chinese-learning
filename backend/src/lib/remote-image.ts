import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import {
  ImageUploadError,
  isImageContentType,
  isValidImage,
  type ImageContentType,
} from './cloudflare-r2'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_REDIRECTS = 3

function isPrivateIpv4(address: string) {
  const parts = address.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true
  const [a, b] = parts
  return a === 0
    || a === 10
    || a === 127
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && (b === 0 || b === 168))
    || (a === 198 && (b === 18 || b === 19 || b === 51))
    || (a === 203 && b === 0)
    || a >= 224
}

export function isPrivateNetworkAddress(address: string) {
  const normalized = address.toLowerCase().split('%')[0]
  const version = isIP(normalized)
  if (version === 4) return isPrivateIpv4(normalized)
  if (version !== 6) return true

  if (normalized.startsWith('::ffff:')) {
    const mapped = normalized.slice('::ffff:'.length)
    return isIP(mapped) !== 4 || isPrivateIpv4(mapped)
  }

  return normalized === '::'
    || normalized === '::1'
    || normalized.startsWith('fc')
    || normalized.startsWith('fd')
    || /^fe[89ab]/.test(normalized)
    || normalized.startsWith('2001:db8:')
}

async function assertPublicImageUrl(value: string) {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new ImageUploadError('Image source URL is invalid')
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new ImageUploadError('Image source must use HTTP or HTTPS')
  }
  const hostname = url.hostname.toLowerCase()
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    throw new ImageUploadError('Private image sources are not allowed')
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true })
  if (!addresses.length || addresses.some(({ address }) => isPrivateNetworkAddress(address))) {
    throw new ImageUploadError('Private image sources are not allowed')
  }
  return url
}

async function readLimitedBody(response: Response) {
  const declaredLength = Number(response.headers.get('content-length') || 0)
  if (declaredLength > MAX_IMAGE_BYTES) throw new ImageUploadError('Remote image is larger than 5MB')
  if (!response.body) throw new ImageUploadError('Remote image response is empty')

  const chunks: Buffer[] = []
  const reader = response.body.getReader()
  let total = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_IMAGE_BYTES) {
      await reader.cancel()
      throw new ImageUploadError('Remote image is larger than 5MB')
    }
    chunks.push(Buffer.from(value))
  }

  return Buffer.concat(chunks, total)
}

export async function downloadRemoteImage(source: string) {
  let current = await assertPublicImageUrl(source)

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await fetch(current, {
      redirect: 'manual',
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: 'image/jpeg,image/png,image/webp,image/gif' },
    })

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location')
      if (!location || redirectCount === MAX_REDIRECTS) {
        throw new ImageUploadError('Remote image redirected too many times')
      }
      current = await assertPublicImageUrl(new URL(location, current).toString())
      continue
    }

    if (!response.ok) throw new ImageUploadError(`Remote image returned HTTP ${response.status}`)
    const contentType = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() || ''
    if (!isImageContentType(contentType)) {
      throw new ImageUploadError('Remote source is not a supported image')
    }

    const buffer = await readLimitedBody(response)
    if (!isValidImage(buffer, contentType)) {
      throw new ImageUploadError('Remote image content does not match its type')
    }
    return { buffer, contentType: contentType as ImageContentType, sourceUrl: current.toString() }
  }

  throw new ImageUploadError('Remote image could not be downloaded')
}
