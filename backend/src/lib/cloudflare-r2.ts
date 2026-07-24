import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const avatarContentTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const
const imageContentTypes = {
  ...avatarContentTypes,
  'image/gif': 'gif',
} as const

export type AvatarContentType = keyof typeof avatarContentTypes
export type ImageContentType = keyof typeof imageContentTypes

export class ImageUploadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageUploadError'
  }
}

export class AvatarUploadError extends ImageUploadError {
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

export function isValidImage(buffer: Buffer, contentType: ImageContentType): boolean {
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

  if (contentType === 'image/webp') {
    return buffer.length >= 12
      && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
      && buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  }

  if (contentType === 'image/gif') {
    const signature = buffer.subarray(0, 6).toString('ascii')
    return signature === 'GIF87a' || signature === 'GIF89a'
  }

  return false
}

export function isAvatarContentType(value: string): value is AvatarContentType {
  return value in avatarContentTypes
}

export function isImageContentType(value: string): value is ImageContentType {
  return value in imageContentTypes
}

export async function uploadImage(
  prefix: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  if (!isImageContentType(contentType) || !isValidImage(buffer, contentType)) {
    throw new ImageUploadError('File content must be a valid JPG, PNG, WebP, or GIF image')
  }

  const endpoint = requiredEnv('R2_ENDPOINT')
  const accessKeyId = requiredEnv('R2_ACCESS_KEY')
  const secretAccessKey = requiredEnv('R2_SECRET_KEY')
  const bucket = requiredEnv('R2_BUCKET')
  const publicUrl = requiredEnv('R2_PUBLIC_URL').replace(/\/$/, '')
  const ext = imageContentTypes[contentType]
  const key = `image/${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`
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
