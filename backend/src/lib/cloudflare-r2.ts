import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const avatarContentTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const

export type AvatarContentType = keyof typeof avatarContentTypes

export class AvatarUploadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AvatarUploadError'
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function isValidImage(buffer: Buffer, contentType: AvatarContentType): boolean {
  if (contentType === 'image/jpeg') {
    return buffer.length >= 3
      && buffer[0] === 0xff
      && buffer[1] === 0xd8
      && buffer[2] === 0xff
  }

  if (contentType === 'image/png') {
    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    return buffer.length >= signature.length && buffer.subarray(0, signature.length).equals(signature)
  }

  return buffer.length >= 12
    && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
    && buffer.subarray(8, 12).toString('ascii') === 'WEBP'
}

export function isAvatarContentType(value: string): value is AvatarContentType {
  return value in avatarContentTypes
}

export async function uploadAvatar(
  userId: string,
  buffer: Buffer,
  contentType: AvatarContentType,
): Promise<string> {
  if (!isValidImage(buffer, contentType)) {
    throw new AvatarUploadError('Avatar content does not match its image type')
  }

  const endpoint = requiredEnv('R2_ENDPOINT')
  const accessKeyId = requiredEnv('R2_ACCESS_KEY')
  const secretAccessKey = requiredEnv('R2_SECRET_KEY')
  const bucket = requiredEnv('R2_BUCKET')
  const publicUrl = requiredEnv('R2_PUBLIC_URL').replace(/\/$/, '')
  const extension = avatarContentTypes[contentType]
  const key = `image/avatar-${userId}-${Date.now()}.${extension}`
  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  })

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }))

  return `${publicUrl}/${key}`
}
