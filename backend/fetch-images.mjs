import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fetchImageUrls(query) {
  const url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
  })
  const html = await res.text()
  const vqdMatch = html.match(/vqd=([^"&]+)/)
  if (!vqdMatch) return []

  const apiUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&vqd=${vqdMatch[1]}&f=,,,&o=json`
  const apiRes = await fetch(apiUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  })
  const data = await apiRes.json()
  if (data.results) {
    return data.results.map(r => r.image).filter(Boolean)
  }
  return []
}

async function downloadAndUpload(query, attempt = 0) {
  const urls = await fetchImageUrls(query)
  if (!urls.length) return null

  for (let i = attempt; i < urls.length; i++) {
    try {
      const imgRes = await fetch(urls[i], { signal: AbortSignal.timeout(10000) })
      if (!imgRes.ok) continue
      const buffer = Buffer.from(await imgRes.arrayBuffer())
      const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
      if (buffer.length < 1024) continue

      const { PutObjectCommand, S3Client } = await import('@aws-sdk/client-s3')
      const s3 = new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT,
        credentials: { accessKeyId: process.env.R2_ACCESS_KEY, secretAccessKey: process.env.R2_SECRET_KEY },
      })
      const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
      const key = `image/vocab/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      await s3.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }))
      return `${process.env.R2_PUBLIC_URL}/${key}`
    } catch {
      continue
    }
  }
  return null
}

try {
  const lessons = await prisma.lesson.findMany({
    select: { id: true, title: true },
    orderBy: { lessonOrder: 'asc' },
  })
  console.log(`Found ${lessons.length} lessons`)

  let totalUpdated = 0
  let totalFailed = 0

  for (const lesson of lessons) {
    const missing = await prisma.vocabulary.findMany({
      where: { lessonId: lesson.id, imageUrl: null },
      orderBy: { order: 'asc' },
    })
    if (!missing.length) continue

    process.stdout.write(`[${lesson.title}] ${missing.length} vocab...`)

    let updated = 0
    for (let i = 0; i < missing.length; i++) {
      const vocab = missing[i]
      if (i > 0) process.stdout.write(', ')
      process.stdout.write(vocab.hanzi)
      const imageUrl = await downloadAndUpload(vocab.hanzi)
      if (imageUrl) {
        await prisma.vocabulary.update({ where: { id: vocab.id }, data: { imageUrl } })
        updated++
      }
    }

    console.log(` -> ${updated}/${missing.length} ok`)
    totalUpdated += updated
    totalFailed += missing.length - updated
  }

  console.log(`\nDone! ${totalUpdated} updated, ${totalFailed} failed`)
} finally {
  await prisma.$disconnect()
}
