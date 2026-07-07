import { LevelType, PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

type WordSeed = {
  hanzi: string
  pinyin: string
  meaningVi: string
}

type SentenceSeed = {
  sentenceVi: string
  sentenceZh: string
}

type LessonSeed = {
  levelType: LevelType
  lessonOrder: number
  title: string
  words: WordSeed[]
  sentences: SentenceSeed[]
}

const lessons: LessonSeed[] = [
  {
    levelType: LevelType.HSK1,
    lessonOrder: 1,
    title: 'Chào hỏi cơ bản',
    words: [
      { hanzi: '你好', pinyin: 'nǐ hǎo', meaningVi: 'Xin chào' },
      { hanzi: '再见', pinyin: 'zàijiàn', meaningVi: 'Tạm biệt' },
      { hanzi: '谢谢', pinyin: 'xièxie', meaningVi: 'Cảm ơn' },
      { hanzi: '对不起', pinyin: 'duìbuqǐ', meaningVi: 'Xin lỗi' },
      { hanzi: '没关系', pinyin: 'méiguānxi', meaningVi: 'Không sao' },
      { hanzi: '请', pinyin: 'qǐng', meaningVi: 'Mời, làm ơn' },
      { hanzi: '是', pinyin: 'shì', meaningVi: 'Là, phải' },
      { hanzi: '不', pinyin: 'bù', meaningVi: 'Không' },
      { hanzi: '好', pinyin: 'hǎo', meaningVi: 'Tốt, được' },
      { hanzi: '吗', pinyin: 'ma', meaningVi: 'Trợ từ nghi vấn' },
    ],
    sentences: [
      { sentenceVi: 'Xin chào! Bạn khỏe không?', sentenceZh: '你好！你好吗？' },
      { sentenceVi: 'Tạm biệt, ngày mai gặp lại!', sentenceZh: '再见，明天见！' },
    ],
  },
  {
    levelType: LevelType.HSK1,
    lessonOrder: 2,
    title: 'Giới thiệu bản thân',
    words: [
      { hanzi: '我', pinyin: 'wǒ', meaningVi: 'Tôi' },
      { hanzi: '你', pinyin: 'nǐ', meaningVi: 'Bạn' },
      { hanzi: '他', pinyin: 'tā', meaningVi: 'Anh ấy' },
      { hanzi: '她', pinyin: 'tā', meaningVi: 'Cô ấy' },
      { hanzi: '名字', pinyin: 'míngzi', meaningVi: 'Tên' },
      { hanzi: '叫', pinyin: 'jiào', meaningVi: 'Gọi là' },
      { hanzi: '什么', pinyin: 'shénme', meaningVi: 'Gì, cái gì' },
      { hanzi: '人', pinyin: 'rén', meaningVi: 'Người' },
      { hanzi: '中国', pinyin: 'Zhōngguó', meaningVi: 'Trung Quốc' },
      { hanzi: '学生', pinyin: 'xuésheng', meaningVi: 'Học sinh' },
    ],
    sentences: [
      { sentenceVi: 'Tôi tên là Vương Minh.', sentenceZh: '我叫王明。' },
      { sentenceVi: 'Bạn là người nước nào?', sentenceZh: '你是哪国人？' },
    ],
  },
  {
    levelType: LevelType.HSK1,
    lessonOrder: 3,
    title: 'Số đếm',
    words: [
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
    ],
    sentences: [
      { sentenceVi: 'Tôi có một quyển sách.', sentenceZh: '我有一本书。' },
      { sentenceVi: 'Chúng tôi có ba người.', sentenceZh: '我们有三个人。' },
    ],
  },
  {
    levelType: LevelType.HSK1,
    lessonOrder: 4,
    title: 'HSK1 - Bài 4',
    words: [
      { hanzi: '今天', pinyin: 'jīntiān', meaningVi: 'Hôm nay' },
      { hanzi: '明天', pinyin: 'míngtiān', meaningVi: 'Ngày mai' },
      { hanzi: '昨天', pinyin: 'zuótiān', meaningVi: 'Hôm qua' },
      { hanzi: '星期', pinyin: 'xīngqī', meaningVi: 'Tuần, thứ' },
      { hanzi: '月', pinyin: 'yuè', meaningVi: 'Tháng' },
      { hanzi: '年', pinyin: 'nián', meaningVi: 'Năm' },
      { hanzi: '现在', pinyin: 'xiànzài', meaningVi: 'Bây giờ' },
      { hanzi: '时候', pinyin: 'shíhou', meaningVi: 'Lúc, thời điểm' },
    ],
    sentences: [
      { sentenceVi: 'Hôm nay là thứ Hai.', sentenceZh: '今天是星期一。' },
      { sentenceVi: 'Bây giờ là mấy giờ?', sentenceZh: '现在几点？' },
    ],
  },
  {
    levelType: LevelType.HSK1,
    lessonOrder: 5,
    title: 'HSK1 - Bài 5',
    words: [
      { hanzi: '吃', pinyin: 'chī', meaningVi: 'Ăn' },
      { hanzi: '喝', pinyin: 'hē', meaningVi: 'Uống' },
      { hanzi: '水', pinyin: 'shuǐ', meaningVi: 'Nước' },
      { hanzi: '茶', pinyin: 'chá', meaningVi: 'Trà' },
      { hanzi: '米饭', pinyin: 'mǐfàn', meaningVi: 'Cơm' },
      { hanzi: '菜', pinyin: 'cài', meaningVi: 'Món ăn, rau' },
      { hanzi: '水果', pinyin: 'shuǐguǒ', meaningVi: 'Trái cây' },
      { hanzi: '苹果', pinyin: 'píngguǒ', meaningVi: 'Táo' },
    ],
    sentences: [
      { sentenceVi: 'Tôi muốn uống trà.', sentenceZh: '我想喝茶。' },
      { sentenceVi: 'Bạn có ăn táo không?', sentenceZh: '你吃苹果吗？' },
    ],
  },
  {
    levelType: LevelType.HSK1,
    lessonOrder: 6,
    title: 'HSK1 - Bài 6',
    words: [
      { hanzi: '住', pinyin: 'zhù', meaningVi: 'Ở, cư trú' },
      { hanzi: '在', pinyin: 'zài', meaningVi: 'Ở, tại' },
      { hanzi: '家', pinyin: 'jiā', meaningVi: 'Nhà' },
      { hanzi: '学校', pinyin: 'xuéxiào', meaningVi: 'Trường học' },
      { hanzi: '商店', pinyin: 'shāngdiàn', meaningVi: 'Cửa hàng' },
      { hanzi: '医院', pinyin: 'yīyuàn', meaningVi: 'Bệnh viện' },
      { hanzi: '前面', pinyin: 'qiánmiàn', meaningVi: 'Phía trước' },
      { hanzi: '后面', pinyin: 'hòumiàn', meaningVi: 'Phía sau' },
    ],
    sentences: [
      { sentenceVi: 'Tôi sống ở phía sau trường học.', sentenceZh: '我住在学校后面。' },
      { sentenceVi: 'Cửa hàng ở phía trước bệnh viện.', sentenceZh: '商店在医院前面。' },
    ],
  },
  {
    levelType: LevelType.HSK2,
    lessonOrder: 1,
    title: 'HSK2 - Bài 1',
    words: [
      { hanzi: '觉得', pinyin: 'juéde', meaningVi: 'Cảm thấy, cho rằng' },
      { hanzi: '知道', pinyin: 'zhīdào', meaningVi: 'Biết' },
      { hanzi: '希望', pinyin: 'xīwàng', meaningVi: 'Hy vọng' },
      { hanzi: '可以', pinyin: 'kěyǐ', meaningVi: 'Có thể, được phép' },
      { hanzi: '要', pinyin: 'yào', meaningVi: 'Muốn, cần' },
      { hanzi: '可能', pinyin: 'kěnéng', meaningVi: 'Có thể, khả năng' },
      { hanzi: '因为', pinyin: 'yīnwèi', meaningVi: 'Bởi vì' },
      { hanzi: '所以', pinyin: 'suǒyǐ', meaningVi: 'Cho nên' },
    ],
    sentences: [
      { sentenceVi: 'Vì trời mưa nên tôi không thể đi.', sentenceZh: '因为下雨，所以我不能去。' },
      { sentenceVi: 'Tôi hy vọng ngày mai có thể gặp bạn.', sentenceZh: '我希望明天可以见到你。' },
    ],
  },
  {
    levelType: LevelType.HSK2,
    lessonOrder: 2,
    title: 'HSK2 - Bài 2',
    words: [
      { hanzi: '运动', pinyin: 'yùndòng', meaningVi: 'Vận động, thể thao' },
      { hanzi: '游泳', pinyin: 'yóuyǒng', meaningVi: 'Bơi' },
      { hanzi: '跑步', pinyin: 'pǎobù', meaningVi: 'Chạy bộ' },
      { hanzi: '旅游', pinyin: 'lǚyóu', meaningVi: 'Du lịch' },
      { hanzi: '休息', pinyin: 'xiūxi', meaningVi: 'Nghỉ ngơi' },
      { hanzi: '快乐', pinyin: 'kuàilè', meaningVi: 'Vui vẻ' },
      { hanzi: '忙', pinyin: 'máng', meaningVi: 'Bận' },
      { hanzi: '累', pinyin: 'lèi', meaningVi: 'Mệt' },
    ],
    sentences: [
      { sentenceVi: 'Tôi thích bơi và chạy bộ.', sentenceZh: '我喜欢游泳和跑步。' },
      { sentenceVi: 'Hôm nay tôi rất bận và mệt.', sentenceZh: '今天我很忙，也很累。' },
    ],
  },
  {
    levelType: LevelType.HSK2,
    lessonOrder: 3,
    title: 'HSK2 - Bài 3',
    words: [
      { hanzi: '生日', pinyin: 'shēngrì', meaningVi: 'Sinh nhật' },
      { hanzi: '时间', pinyin: 'shíjiān', meaningVi: 'Thời gian' },
      { hanzi: '问题', pinyin: 'wèntí', meaningVi: 'Vấn đề, câu hỏi' },
      { hanzi: '准备', pinyin: 'zhǔnbèi', meaningVi: 'Chuẩn bị' },
      { hanzi: '开始', pinyin: 'kāishǐ', meaningVi: 'Bắt đầu' },
      { hanzi: '结束', pinyin: 'jiéshù', meaningVi: 'Kết thúc' },
      { hanzi: '帮助', pinyin: 'bāngzhù', meaningVi: 'Giúp đỡ' },
      { hanzi: '介绍', pinyin: 'jièshào', meaningVi: 'Giới thiệu' },
    ],
    sentences: [
      { sentenceVi: 'Bữa tiệc sinh nhật bắt đầu lúc bảy giờ.', sentenceZh: '生日会七点开始。' },
      { sentenceVi: 'Cảm ơn bạn đã giúp tôi chuẩn bị.', sentenceZh: '谢谢你帮助我准备。' },
    ],
  },
]

async function seedAdmin() {
  const subscriptionUntil = new Date('2099-12-31T00:00:00.000Z')

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      username: 'Admin',
      role: Role.ADMIN,
      isPremium: true,
      subscriptionUntil,
    },
    create: {
      username: 'Admin',
      email: 'admin@example.com',
      role: Role.ADMIN,
      isPremium: true,
      subscriptionUntil,
    },
  })

  console.log('  ✓ Admin: admin@example.com')
}

async function seedLesson(data: LessonSeed) {
  const existingLesson = await prisma.lesson.findFirst({
    where: {
      levelType: data.levelType,
      lessonOrder: data.lessonOrder,
    },
  })

  const lesson = existingLesson
    ? await prisma.lesson.update({
        where: { id: existingLesson.id },
        data: { title: data.title, isFree: true },
      })
    : await prisma.lesson.create({
        data: {
          levelType: data.levelType,
          lessonOrder: data.lessonOrder,
          title: data.title,
          isFree: true,
        },
      })

  for (const word of data.words) {
    const existingWord = await prisma.vocabulary.findFirst({
      where: { lessonId: lesson.id, hanzi: word.hanzi },
    })

    if (existingWord) {
      await prisma.vocabulary.update({ where: { id: existingWord.id }, data: word })
    } else {
      await prisma.vocabulary.create({ data: { lessonId: lesson.id, ...word } })
    }
  }

  for (const sentence of data.sentences) {
    const existingSentence = await prisma.sentence.findFirst({
      where: { lessonId: lesson.id, sentenceZh: sentence.sentenceZh },
    })

    if (existingSentence) {
      await prisma.sentence.update({
        where: { id: existingSentence.id },
        data: sentence,
      })
    } else {
      await prisma.sentence.create({ data: { lessonId: lesson.id, ...sentence } })
    }
  }

  console.log(`  ✓ ${data.levelType} Lesson ${lesson.lessonOrder}: ${lesson.title}`)
}

async function main() {
  console.log('Seeding...')
  await seedAdmin()

  for (const lesson of lessons) {
    await seedLesson(lesson)
  }

  console.log('Seed complete!')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
