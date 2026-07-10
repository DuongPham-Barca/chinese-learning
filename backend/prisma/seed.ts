import { LevelType, PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

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

const levelSeeds: Array<{ id: string; type: LevelType; name: string; slug: string; description: string; order: number }> = [
  { id: 'level_hsk1', type: LevelType.HSK1, name: 'HSK 1', slug: 'hsk-1', description: 'Tu vung va mau cau co ban HSK 1', order: 1 },
  { id: 'level_hsk2', type: LevelType.HSK2, name: 'HSK 2', slug: 'hsk-2', description: 'Tu vung va mau cau co ban HSK 2', order: 2 },
  { id: 'level_hsk3', type: LevelType.HSK3, name: 'HSK 3', slug: 'hsk-3', description: 'Noi dung trung cap HSK 3', order: 3 },
  { id: 'level_hsk4', type: LevelType.HSK4, name: 'HSK 4', slug: 'hsk-4', description: 'Noi dung trung cap HSK 4', order: 4 },
  { id: 'level_hsk5', type: LevelType.HSK5, name: 'HSK 5', slug: 'hsk-5', description: 'Noi dung nang cao HSK 5', order: 5 },
  { id: 'level_hsk6', type: LevelType.HSK6, name: 'HSK 6', slug: 'hsk-6', description: 'Noi dung nang cao HSK 6', order: 6 },
]

function levelIdFor(type: LevelType): string {
  return levelSeeds.find((level) => level.type === type)?.id || 'level_hsk6'
}

function lessonSlug(order: number): string {
  return `bai-${order}`
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
  {
    levelType: LevelType.HSK3,
    lessonOrder: 1,
    title: 'Thời tiết & Mùa',
    words: [
      { hanzi: '天气', pinyin: 'tiānqì', meaningVi: 'Thời tiết' },
      { hanzi: '春天', pinyin: 'chūntiān', meaningVi: 'Mùa xuân' },
      { hanzi: '夏天', pinyin: 'xiàtiān', meaningVi: 'Mùa hè' },
      { hanzi: '秋天', pinyin: 'qiūtiān', meaningVi: 'Mùa thu' },
      { hanzi: '冬天', pinyin: 'dōngtiān', meaningVi: 'Mùa đông' },
      { hanzi: '冷', pinyin: 'lěng', meaningVi: 'Lạnh' },
      { hanzi: '热', pinyin: 'rè', meaningVi: 'Nóng' },
      { hanzi: '下雨', pinyin: 'xiàyǔ', meaningVi: 'Mưa (động từ)' },
    ],
    sentences: [
      { sentenceVi: 'Hôm nay thời tiết rất đẹp, không lạnh cũng không nóng.', sentenceZh: '今天天气很好，不冷也不热。' },
      { sentenceVi: 'Mùa đông ở Bắc Kinh rất lạnh, thường xuyên có tuyết.', sentenceZh: '北京的冬天很冷，经常下雪。' },
    ],
  },
  {
    levelType: LevelType.HSK3,
    lessonOrder: 2,
    title: 'Công việc hàng ngày',
    words: [
      { hanzi: '工作', pinyin: 'gōngzuò', meaningVi: 'Công việc, làm việc' },
      { hanzi: '公司', pinyin: 'gōngsī', meaningVi: 'Công ty' },
      { hanzi: '办公室', pinyin: 'bàngōngshì', meaningVi: 'Văn phòng' },
      { hanzi: '同事', pinyin: 'tóngshì', meaningVi: 'Đồng nghiệp' },
      { hanzi: '开会', pinyin: 'kāihuì', meaningVi: 'Họp, mở cuộc họp' },
      { hanzi: '讨论', pinyin: 'tǎolùn', meaningVi: 'Thảo luận' },
      { hanzi: '计划', pinyin: 'jìhuà', meaningVi: 'Kế hoạch' },
    ],
    sentences: [
      { sentenceVi: 'Chiều nay chúng tôi có cuộc họp để thảo luận kế hoạch mới.', sentenceZh: '今天下午我们开会讨论新计划。' },
      { sentenceVi: 'Đồng nghiệp của tôi làm việc ở văn phòng công ty.', sentenceZh: '我的同事在公司办公室工作。' },
    ],
  },
  {
    levelType: LevelType.HSK4,
    lessonOrder: 1,
    title: 'Mua sắm & Giá cả',
    words: [
      { hanzi: '便宜', pinyin: 'piányi', meaningVi: 'Rẻ' },
      { hanzi: '贵', pinyin: 'guì', meaningVi: 'Đắt' },
      { hanzi: '打折', pinyin: 'dǎzhé', meaningVi: 'Giảm giá' },
      { hanzi: '质量', pinyin: 'zhìliàng', meaningVi: 'Chất lượng' },
      { hanzi: '颜色', pinyin: 'yánsè', meaningVi: 'Màu sắc' },
      { hanzi: '大小', pinyin: 'dàxiǎo', meaningVi: 'Kích cỡ' },
      { hanzi: '信用卡', pinyin: 'xìnyòngkǎ', meaningVi: 'Thẻ tín dụng' },
      { hanzi: '网上购物', pinyin: 'wǎngshàng gòuwù', meaningVi: 'Mua sắm trực tuyến' },
    ],
    sentences: [
      { sentenceVi: 'Cái áo này màu đỏ rất đẹp, nhưng hơi đắt.', sentenceZh: '这件红颜色的衣服很好看，但是有点儿贵。' },
      { sentenceVi: 'Tôi thường mua sắm trực tuyến vì nó tiện lợi và rẻ hơn.', sentenceZh: '我经常网上购物，因为方便又便宜。' },
    ],
  },
  {
    levelType: LevelType.HSK4,
    lessonOrder: 2,
    title: 'Sức khỏe & Bệnh viện',
    words: [
      { hanzi: '健康', pinyin: 'jiànkāng', meaningVi: 'Sức khỏe, khỏe mạnh' },
      { hanzi: '感冒', pinyin: 'gǎnmào', meaningVi: 'Cảm cúm' },
      { hanzi: '发烧', pinyin: 'fāshāo', meaningVi: 'Sốt' },
      { hanzi: '吃药', pinyin: 'chīyào', meaningVi: 'Uống thuốc' },
      { hanzi: '休息', pinyin: 'xiūxi', meaningVi: 'Nghỉ ngơi' },
      { hanzi: '检查', pinyin: 'jiǎnchá', meaningVi: 'Kiểm tra, khám' },
      { hanzi: '锻炼', pinyin: 'duànliàn', meaningVi: 'Tập luyện, rèn luyện' },
    ],
    sentences: [
      { sentenceVi: 'Tôi bị cảm cúm, hơi sốt, cần phải uống thuốc và nghỉ ngơi.', sentenceZh: '我感冒了，有点儿发烧，需要吃药休息。' },
      { sentenceVi: 'Mỗi ngày tập thể dục một giờ rất tốt cho sức khỏe.', sentenceZh: '每天锻炼一个小时对健康很好。' },
    ],
  },
  {
    levelType: LevelType.HSK5,
    lessonOrder: 1,
    title: 'Môi trường & Bảo vệ',
    words: [
      { hanzi: '环境', pinyin: 'huánjìng', meaningVi: 'Môi trường' },
      { hanzi: '污染', pinyin: 'wūrǎn', meaningVi: 'Ô nhiễm' },
      { hanzi: '保护', pinyin: 'bǎohù', meaningVi: 'Bảo vệ' },
      { hanzi: '垃圾', pinyin: 'lājī', meaningVi: 'Rác thải' },
      { hanzi: '回收', pinyin: 'huíshōu', meaningVi: 'Tái chế, thu hồi' },
      { hanzi: '节约', pinyin: 'jiéyuē', meaningVi: 'Tiết kiệm' },
      { hanzi: '能源', pinyin: 'néngyuán', meaningVi: 'Năng lượng' },
      { hanzi: '减少', pinyin: 'jiǎnshǎo', meaningVi: 'Giảm bớt' },
    ],
    sentences: [
      { sentenceVi: 'Bảo vệ môi trường là trách nhiệm của mỗi người chúng ta.', sentenceZh: '保护环境是我们每个人的责任。' },
      { sentenceVi: 'Chúng ta nên phân loại rác và tái chế để giảm ô nhiễm.', sentenceZh: '我们应该把垃圾分类回收，减少污染。' },
    ],
  },
  {
    levelType: LevelType.HSK5,
    lessonOrder: 2,
    title: 'Công nghệ & Internet',
    words: [
      { hanzi: '网络', pinyin: 'wǎngluò', meaningVi: 'Mạng lưới, internet' },
      { hanzi: '信息', pinyin: 'xìnxī', meaningVi: 'Thông tin' },
      { hanzi: '数据', pinyin: 'shùjù', meaningVi: 'Dữ liệu' },
      { hanzi: '下载', pinyin: 'xiàzài', meaningVi: 'Tải xuống' },
      { hanzi: '软件', pinyin: 'ruǎnjiàn', meaningVi: 'Phần mềm' },
      { hanzi: '更新', pinyin: 'gēngxīn', meaningVi: 'Cập nhật' },
      { hanzi: '开发', pinyin: 'kāifā', meaningVi: 'Phát triển' },
      { hanzi: '人工智能', pinyin: 'réngōng zhìnéng', meaningVi: 'Trí tuệ nhân tạo' },
    ],
    sentences: [
      { sentenceVi: 'Trí tuệ nhân tạo đang thay đổi cách chúng ta sống và làm việc.', sentenceZh: '人工智能正在改变我们的生活和工作方式。' },
      { sentenceVi: 'Phần mềm này đã được cập nhật với nhiều tính năng mới.', sentenceZh: '这个软件已经更新了很多新功能。' },
    ],
  },
  {
    levelType: LevelType.HSK6,
    lessonOrder: 1,
    title: 'Kinh tế & Thị trường',
    words: [
      { hanzi: '经济', pinyin: 'jīngjì', meaningVi: 'Kinh tế' },
      { hanzi: '发展', pinyin: 'fāzhǎn', meaningVi: 'Phát triển' },
      { hanzi: '贸易', pinyin: 'màoyì', meaningVi: 'Mậu dịch, thương mại' },
      { hanzi: '投资', pinyin: 'tóuzī', meaningVi: 'Đầu tư' },
      { hanzi: '市场', pinyin: 'shìchǎng', meaningVi: 'Thị trường' },
      { hanzi: '竞争', pinyin: 'jìngzhēng', meaningVi: 'Cạnh tranh' },
      { hanzi: '合作', pinyin: 'hézuò', meaningVi: 'Hợp tác' },
      { hanzi: '全球化', pinyin: 'quánqiúhuà', meaningVi: 'Toàn cầu hóa' },
    ],
    sentences: [
      { sentenceVi: 'Với sự phát triển của toàn cầu hóa, hợp tác kinh tế giữa các nước ngày càng chặt chẽ.', sentenceZh: '随着全球化的发展，各国之间的经济合作越来越密切。' },
      { sentenceVi: 'Thị trường cạnh tranh rất khốc liệt, cần phải có chiến lược đầu tư hợp lý.', sentenceZh: '市场竞争非常激烈，需要有合理的投资策略。' },
    ],
  },
  {
    levelType: LevelType.HSK6,
    lessonOrder: 2,
    title: 'Văn hóa & Xã hội',
    words: [
      { hanzi: '传统', pinyin: 'chuántǒng', meaningVi: 'Truyền thống' },
      { hanzi: '风俗', pinyin: 'fēngsú', meaningVi: 'Phong tục' },
      { hanzi: '节日', pinyin: 'jiérì', meaningVi: 'Ngày lễ, tiết' },
      { hanzi: '春节', pinyin: 'chūnjié', meaningVi: 'Tết Nguyên Đán' },
      { hanzi: '婚礼', pinyin: 'hūnlǐ', meaningVi: 'Đám cưới' },
      { hanzi: '礼仪', pinyin: 'lǐyí', meaningVi: 'Lễ nghi, nghi thức' },
      { hanzi: '尊重', pinyin: 'zūnzhòng', meaningVi: 'Tôn trọng' },
    ],
    sentences: [
      { sentenceVi: 'Tết Nguyên Đán là lễ hội truyền thống quan trọng nhất của người Trung Quốc.', sentenceZh: '春节是中国人最重要的传统节日。' },
      { sentenceVi: 'Các nền văn hóa khác nhau có phong tục và lễ nghi khác nhau, chúng ta nên tôn trọng lẫn nhau.', sentenceZh: '不同的文化有不同的风俗和礼仪，我们应该互相尊重。' },
    ],
  },
]

async function seedAdmin() {
  const subscriptionUntil = new Date('2099-12-31T00:00:00.000Z')
  const passwordHash = await bcrypt.hash('123456', 12)

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      username: 'admin',
      passwordHash,
      role: Role.ADMIN,
      isPremium: true,
      subscriptionUntil,
    },
    create: {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash,
      role: Role.ADMIN,
      isPremium: true,
      subscriptionUntil,
    },
  })

  console.log('  ✓ Admin: admin@example.com')
}

async function seedLevels() {
  for (const level of levelSeeds) {
    await prisma.level.upsert({
      where: { slug: level.slug },
      update: {
        type: level.type,
        name: level.name,
        description: level.description,
        order: level.order,
        isPublished: true,
      },
      create: {
        id: level.id,
        type: level.type,
        name: level.name,
        slug: level.slug,
        description: level.description,
        order: level.order,
        isPublished: true,
      },
    })
  }

  console.log('  Levels seeded')
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
        data: {
          levelId: levelIdFor(data.levelType),
          title: data.title,
          slug: lessonSlug(data.lessonOrder),
          isFree: true,
          isPublished: true,
          expReward: 10,
        },
      })
    : await prisma.lesson.create({
        data: {
          levelId: levelIdFor(data.levelType),
          levelType: data.levelType,
          lessonOrder: data.lessonOrder,
          title: data.title,
          slug: lessonSlug(data.lessonOrder),
          isFree: true,
          isPublished: true,
          expReward: 10,
        },
      })

  for (const [index, word] of data.words.entries()) {
    const existingWord = await prisma.vocabulary.findFirst({
      where: { lessonId: lesson.id, hanzi: word.hanzi },
    })

    if (existingWord) {
      await prisma.vocabulary.update({ where: { id: existingWord.id }, data: { ...word, order: index + 1 } })
    } else {
      await prisma.vocabulary.create({ data: { lessonId: lesson.id, ...word, order: index + 1 } })
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
  await seedLevels()

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
