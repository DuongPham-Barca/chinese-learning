import { PrismaClient, LevelType } from '@prisma/client'

const prisma = new PrismaClient()

const hsk1Lessons = [
  { title: 'Chào hỏi cơ bản', words: [
    { hanzi: '你好', pinyin: 'nǐ hǎo', meaningVi: 'Xin chào' },
    { hanzi: '再见', pinyin: 'zàijiàn', meaningVi: 'Tạm biệt' },
    { hanzi: '谢谢', pinyin: 'xièxie', meaningVi: 'Cảm ơn' },
    { hanzi: '对不起', pinyin: 'duìbuqǐ', meaningVi: 'Xin lỗi' },
    { hanzi: '没关系', pinyin: 'méiguānxì', meaningVi: 'Không sao' },
    { hanzi: '请', pinyin: 'qǐng', meaningVi: 'Mời, làm ơn' },
    { hanzi: '是', pinyin: 'shì', meaningVi: 'Là, phải' },
    { hanzi: '不', pinyin: 'bù', meaningVi: 'Không' },
    { hanzi: '好', pinyin: 'hǎo', meaningVi: 'Tốt, được' },
    { hanzi: '吗', pinyin: 'ma', meaningVi: '(Từ hỏi)' },
  ], sentences: [
    { sentenceVi: 'Xin chào! Bạn khỏe không?', sentenceZh: '你好！你好吗？' },
    { sentenceVi: 'Tạm biệt, hẹn gặp lại!', sentenceZh: '再见，明天见！' },
  ]},
  { title: 'Giới thiệu bản thân', words: [
    { hanzi: '我', pinyin: 'wǒ', meaningVi: 'Tôi' },
    { hanzi: '你', pinyin: 'nǐ', meaningVi: 'Bạn' },
    { hanzi: '他', pinyin: 'tā', meaningVi: 'Anh ấy' },
    { hanzi: '她', pinyin: 'tā', meaningVi: 'Cô ấy' },
    { hanzi: '名字', pinyin: 'míngzì', meaningVi: 'Tên' },
    { hanzi: '叫', pinyin: 'jiào', meaningVi: 'Gọi là' },
    { hanzi: '什么', pinyin: 'shénme', meaningVi: 'Gì, cái gì' },
    { hanzi: '人', pinyin: 'rén', meaningVi: 'Người' },
    { hanzi: '中国', pinyin: 'Zhōngguó', meaningVi: 'Trung Quốc' },
    { hanzi: '学生', pinyin: 'xuéshēng', meaningVi: 'Học sinh' },
  ], sentences: [
    { sentenceVi: 'Tôi tên là Vương Minh.', sentenceZh: '我叫王明。' },
    { sentenceVi: 'Bạn là người nước nào?', sentenceZh: '你是哪国人？' },
  ]},
  { title: 'Số đếm', words: [
    { hanzi: '一', pinyin: 'yī', meaningVi: 'Một' },
    { hanzi: '二', pinyin: 'èr', meaningVi: 'Hai' },
    { hanzi: '三', pinyin: 'sān', meaningVi: 'Ba' },
    { hanzi: '四', pinyin: 'sì', meaningVi: 'Bốn' },
    { hanzi: '五', pinyin: 'wǔ', meaningVi: 'Năm' },
    { hanzi: '六', pinyin: 'liù', meaningVi: 'Sáu' },
    { hanzi: '七', pinyin: 'qī', meaningVi: 'Bảy' },
    { hanzi: '八', pinyin: 'bā', meaningVi: 'Tám' },
    { hanzi: '九', pinyin: 'jiǔ', meaningVi: 'Chín' },
    { hanzi: '十', pinyin: 'shí', meaningVi: 'Mười' },
  ], sentences: [
    { sentenceVi: 'Tôi có một cuốn sách.', sentenceZh: '我有一本书。' },
    { sentenceVi: 'Chúng tôi có ba người.', sentenceZh: '我们有三个人。' },
  ]},
]

async function main() {
  console.log('Seeding...')

  for (let i = 0; i < hsk1Lessons.length; i++) {
    const lessonData = hsk1Lessons[i]
    const lessonOrder = i + 1
    const existingLesson = await prisma.lesson.findFirst({
      where: { levelType: LevelType.HSK1, lessonOrder },
    })

    const lesson = existingLesson
      ? await prisma.lesson.update({
          where: { id: existingLesson.id },
          data: {
            title: lessonData.title,
            isFree: i < 3,
            vocabulary: {
              deleteMany: {},
              create: lessonData.words,
            },
            sentences: {
              deleteMany: {},
              create: lessonData.sentences,
            },
          },
        })
      : await prisma.lesson.create({
          data: {
            levelType: LevelType.HSK1,
            lessonOrder,
            title: lessonData.title,
            isFree: i < 3,
            vocabulary: { create: lessonData.words },
            sentences: { create: lessonData.sentences },
          },
        })

    console.log(`  ✓ Lesson ${lesson.lessonOrder}: ${lesson.title}`)
  }

  console.log('Seed complete!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
