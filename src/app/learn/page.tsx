'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'

// ===== DATA =====

type VocabularyCategory = {
  name: string
  icon: string
  words: { en: string; ar: string; example: string }[]
}

const vocabularyData: VocabularyCategory[] = [
  {
    name: 'التحيات',
    icon: '👋',
    words: [
      { en: 'Hello', ar: 'مرحبا', example: 'Hello, how are you?' },
      { en: 'Good morning', ar: 'صباح الخير', example: 'Good morning, everyone!' },
      { en: 'Good evening', ar: 'مساء الخير', example: 'Good evening, sir.' },
      { en: 'Goodbye', ar: 'مع السلامة', example: 'Goodbye, see you tomorrow!' },
      { en: 'Thank you', ar: 'شكرا لك', example: 'Thank you very much.' },
      { en: 'Please', ar: 'من فضلك', example: 'Please sit down.' },
      { en: 'Sorry', ar: 'آسف', example: 'Sorry, I am late.' },
      { en: 'Welcome', ar: 'أهلا وسهلا', example: 'Welcome to our home!' },
    ],
  },
  {
    name: 'الأرقام',
    icon: '🔢',
    words: [
      { en: 'One', ar: 'واحد', example: 'I have one book.' },
      { en: 'Two', ar: 'اثنان', example: 'There are two cats.' },
      { en: 'Three', ar: 'ثلاثة', example: 'Three people came.' },
      { en: 'Four', ar: 'أربعة', example: 'I need four chairs.' },
      { en: 'Five', ar: 'خمسة', example: 'Five minutes left.' },
      { en: 'Ten', ar: 'عشرة', example: 'I have ten fingers.' },
      { en: 'Twenty', ar: 'عشرون', example: 'She is twenty years old.' },
      { en: 'Hundred', ar: 'مائة', example: 'It costs one hundred dollars.' },
    ],
  },
  {
    name: 'الطعام',
    icon: '🍕',
    words: [
      { en: 'Water', ar: 'ماء', example: 'Can I have some water?' },
      { en: 'Bread', ar: 'خبز', example: 'I bought fresh bread.' },
      { en: 'Rice', ar: 'أرز', example: 'We eat rice every day.' },
      { en: 'Chicken', ar: 'دجاج', example: 'I like grilled chicken.' },
      { en: 'Coffee', ar: 'قهوة', example: 'I drink coffee every morning.' },
      { en: 'Tea', ar: 'شاي', example: 'Would you like some tea?' },
      { en: 'Fruit', ar: 'فاكهة', example: 'Eat more fruit.' },
      { en: 'Milk', ar: 'حليب', example: 'Children need milk.' },
    ],
  },
  {
    name: 'العائلة',
    icon: '👨‍👩‍👧‍👦',
    words: [
      { en: 'Father', ar: 'أب', example: 'My father is a teacher.' },
      { en: 'Mother', ar: 'أم', example: 'My mother cooks well.' },
      { en: 'Brother', ar: 'أخ', example: 'I have one brother.' },
      { en: 'Sister', ar: 'أخت', example: 'My sister is older than me.' },
      { en: 'Son', ar: 'ابن', example: 'He has a son.' },
      { en: 'Daughter', ar: 'ابنة', example: 'She has a daughter.' },
      { en: 'Husband', ar: 'زوج', example: 'Her husband is kind.' },
      { en: 'Wife', ar: 'زوجة', example: 'His wife is a doctor.' },
    ],
  },
  {
    name: 'الألوان',
    icon: '🎨',
    words: [
      { en: 'Red', ar: 'أحمر', example: 'The apple is red.' },
      { en: 'Blue', ar: 'أزرق', example: 'The sky is blue.' },
      { en: 'Green', ar: 'أخضر', example: 'The grass is green.' },
      { en: 'Yellow', ar: 'أصفر', example: 'The sun is yellow.' },
      { en: 'White', ar: 'أبيض', example: 'Snow is white.' },
      { en: 'Black', ar: 'أسود', example: 'The cat is black.' },
      { en: 'Orange', ar: 'برتقالي', example: 'I like the orange color.' },
      { en: 'Purple', ar: 'بنفسجي', example: 'She wore a purple dress.' },
    ],
  },
  {
    name: 'الأماكن',
    icon: '🏠',
    words: [
      { en: 'House', ar: 'منزل', example: 'This is my house.' },
      { en: 'School', ar: 'مدرسة', example: 'I go to school every day.' },
      { en: 'Hospital', ar: 'مستشفى', example: 'The hospital is nearby.' },
      { en: 'Market', ar: 'سوق', example: 'Let us go to the market.' },
      { en: 'Restaurant', ar: 'مطعم', example: 'We ate at a restaurant.' },
      { en: 'Airport', ar: 'مطار', example: 'The airport is far away.' },
      { en: 'Park', ar: 'حديقة', example: 'Children play in the park.' },
      { en: 'Library', ar: 'مكتبة', example: 'I study at the library.' },
    ],
  },
]

type GrammarLesson = {
  title: string
  titleEn: string
  explanation: string
  rules: { rule: string; example: string; translation: string }[]
}

const grammarLessons: GrammarLesson[] = [
  {
    title: 'الضمائر الشخصية',
    titleEn: 'Personal Pronouns',
    explanation: 'الضمائر تُستخدم بدلاً من الأسماء للإشارة إلى الأشخاص أو الأشياء.',
    rules: [
      { rule: 'I (أنا)', example: 'I am a student.', translation: 'أنا طالب.' },
      { rule: 'You (أنت/أنتِ)', example: 'You are smart.', translation: 'أنت ذكي.' },
      { rule: 'He (هو)', example: 'He is tall.', translation: 'هو طويل.' },
      { rule: 'She (هي)', example: 'She is kind.', translation: 'هي لطيفة.' },
      { rule: 'We (نحن)', example: 'We are friends.', translation: 'نحن أصدقاء.' },
      { rule: 'They (هم)', example: 'They are happy.', translation: 'هم سعداء.' },
    ],
  },
  {
    title: 'فعل يكون - To Be',
    titleEn: 'Verb: To Be',
    explanation: 'فعل "to be" هو أهم فعل في اللغة الإنجليزية. يتغير حسب الضمير.',
    rules: [
      { rule: 'I → am', example: 'I am happy.', translation: 'أنا سعيد.' },
      { rule: 'He/She/It → is', example: 'She is a doctor.', translation: 'هي طبيبة.' },
      { rule: 'You/We/They → are', example: 'They are students.', translation: 'هم طلاب.' },
      { rule: 'النفي: am not / is not / are not', example: 'I am not tired.', translation: 'أنا لست متعباً.' },
      { rule: 'السؤال: نقلب الفعل', example: 'Are you ready?', translation: 'هل أنت جاهز؟' },
    ],
  },
  {
    title: 'المضارع البسيط',
    titleEn: 'Simple Present',
    explanation: 'يُستخدم للعادات والحقائق العامة والأحداث المتكررة.',
    rules: [
      { rule: 'الفاعل + الفعل (مصدر)', example: 'I play football.', translation: 'أنا ألعب كرة القدم.' },
      { rule: 'He/She/It + فعل + s', example: 'He plays football.', translation: 'هو يلعب كرة القدم.' },
      { rule: 'النفي: do not / does not', example: 'I do not like coffee.', translation: 'أنا لا أحب القهوة.' },
      { rule: 'السؤال: Do/Does + فاعل + فعل', example: 'Do you speak English?', translation: 'هل تتحدث الإنجليزية؟' },
    ],
  },
  {
    title: 'الماضي البسيط',
    titleEn: 'Simple Past',
    explanation: 'يُستخدم للتحدث عن أحداث وقعت في الماضي وانتهت.',
    rules: [
      { rule: 'الأفعال المنتظمة: فعل + ed', example: 'I played yesterday.', translation: 'لعبت بالأمس.' },
      { rule: 'الأفعال الشاذة: تحفظ', example: 'I went to school.', translation: 'ذهبت إلى المدرسة.' },
      { rule: 'النفي: did not + فعل (مصدر)', example: 'I did not go.', translation: 'لم أذهب.' },
      { rule: 'السؤال: Did + فاعل + فعل', example: 'Did you eat?', translation: 'هل أكلت؟' },
    ],
  },
  {
    title: 'أدوات التعريف والتنكير',
    titleEn: 'Articles: A, An, The',
    explanation: 'أدوات التعريف والتنكير تُستخدم قبل الأسماء لتحديد ما إذا كان الشيء معرّفاً أم لا.',
    rules: [
      { rule: 'a → قبل الحرف الساكن', example: 'a book / a cat', translation: 'كتاب / قطة' },
      { rule: 'an → قبل حرف العلة', example: 'an apple / an egg', translation: 'تفاحة / بيضة' },
      { rule: 'the → للمعرفة (شيء محدد)', example: 'the sun / the book', translation: 'الشمس / الكتاب' },
      { rule: 'بدون أداة → أشياء عامة', example: 'I like music.', translation: 'أحب الموسيقى. (بشكل عام)' },
    ],
  },
]

type Phrase = { en: string; ar: string; category: string }

const commonPhrases: Phrase[] = [
  { en: 'How are you?', ar: 'كيف حالك؟', category: 'تحيات' },
  { en: 'I am fine, thank you.', ar: 'أنا بخير، شكراً لك.', category: 'تحيات' },
  { en: 'What is your name?', ar: 'ما اسمك؟', category: 'تحيات' },
  { en: 'My name is...', ar: 'اسمي هو...', category: 'تحيات' },
  { en: 'Nice to meet you.', ar: 'سعيد بلقائك.', category: 'تحيات' },
  { en: 'Where are you from?', ar: 'من أين أنت؟', category: 'تعارف' },
  { en: 'I am from Saudi Arabia.', ar: 'أنا من السعودية.', category: 'تعارف' },
  { en: 'How old are you?', ar: 'كم عمرك؟', category: 'تعارف' },
  { en: 'I am ... years old.', ar: 'عمري ... سنة.', category: 'تعارف' },
  { en: 'What do you do?', ar: 'ماذا تعمل؟', category: 'تعارف' },
  { en: 'Excuse me, where is the...?', ar: 'عفواً، أين يوجد...؟', category: 'سفر' },
  { en: 'How much does this cost?', ar: 'كم سعر هذا؟', category: 'تسوق' },
  { en: 'I would like to order...', ar: 'أريد أن أطلب...', category: 'مطعم' },
  { en: 'Can you help me, please?', ar: 'هل يمكنك مساعدتي من فضلك؟', category: 'مساعدة' },
  { en: 'I do not understand.', ar: 'لا أفهم.', category: 'مساعدة' },
  { en: 'Can you speak slowly?', ar: 'هل يمكنك التحدث ببطء؟', category: 'مساعدة' },
  { en: 'Where is the bathroom?', ar: 'أين الحمام؟', category: 'سفر' },
  { en: 'I need a taxi.', ar: 'أحتاج سيارة أجرة.', category: 'سفر' },
  { en: 'What time is it?', ar: 'كم الساعة؟', category: 'عامة' },
  { en: 'See you later!', ar: 'أراك لاحقاً!', category: 'تحيات' },
  { en: 'Have a nice day!', ar: 'أتمنى لك يوماً سعيداً!', category: 'تحيات' },
  { en: 'I am learning English.', ar: 'أنا أتعلم اللغة الإنجليزية.', category: 'عامة' },
  { en: 'Could you repeat that?', ar: 'هل يمكنك إعادة ذلك؟', category: 'مساعدة' },
  { en: 'I agree with you.', ar: 'أوافقك الرأي.', category: 'عامة' },
]

type QuizQuestion = {
  question: string
  options: string[]
  correct: number
  explanation: string
}

const quizQuestions: QuizQuestion[] = [
  {
    question: 'ما معنى كلمة "Apple"؟',
    options: ['برتقالة', 'تفاحة', 'موزة', 'عنب'],
    correct: 1,
    explanation: 'Apple تعني تفاحة 🍎',
  },
  {
    question: 'أي جملة صحيحة؟',
    options: ['He are a teacher.', 'He is a teacher.', 'He am a teacher.', 'He be a teacher.'],
    correct: 1,
    explanation: 'مع He نستخدم "is" وليس "are" أو "am".',
  },
  {
    question: 'ما ترجمة "كيف حالك؟" بالإنجليزية؟',
    options: ['What is your name?', 'Where are you?', 'How are you?', 'Who are you?'],
    correct: 2,
    explanation: '"How are you?" هي الترجمة الصحيحة لـ "كيف حالك؟"',
  },
  {
    question: 'أكمل: She ___ to school every day.',
    options: ['go', 'goes', 'going', 'gone'],
    correct: 1,
    explanation: 'مع She نضيف "s" للفعل في المضارع البسيط: goes.',
  },
  {
    question: 'ما هي أداة التنكير المناسبة: ___ orange',
    options: ['a', 'an', 'the', 'بدون أداة'],
    correct: 1,
    explanation: 'نستخدم "an" قبل الكلمات التي تبدأ بحرف علة مثل O.',
  },
  {
    question: 'ما معنى "Goodbye"؟',
    options: ['مرحبا', 'شكرا', 'مع السلامة', 'عفوا'],
    correct: 2,
    explanation: 'Goodbye تعني "مع السلامة".',
  },
  {
    question: 'أكمل: I ___ not like coffee.',
    options: ['does', 'do', 'am', 'is'],
    correct: 1,
    explanation: 'مع I نستخدم "do" في النفي: I do not like.',
  },
  {
    question: 'ما هو الماضي البسيط لـ "go"؟',
    options: ['goed', 'went', 'gone', 'going'],
    correct: 1,
    explanation: '"go" فعل شاذ، ماضيه "went".',
  },
  {
    question: 'ما معنى "Hospital"؟',
    options: ['فندق', 'مدرسة', 'مستشفى', 'مطعم'],
    correct: 2,
    explanation: 'Hospital تعني "مستشفى".',
  },
  {
    question: 'أي جملة تستخدم الماضي البسيط؟',
    options: ['I play football.', 'I played football yesterday.', 'I am playing football.', 'I will play football.'],
    correct: 1,
    explanation: '"played" هو الشكل الماضي للفعل "play".',
  },
  {
    question: 'ما معنى "Brother"؟',
    options: ['أب', 'أم', 'أخ', 'عم'],
    correct: 2,
    explanation: 'Brother تعني "أخ".',
  },
  {
    question: 'أكمل: ___ you speak Arabic?',
    options: ['Does', 'Do', 'Is', 'Are'],
    correct: 1,
    explanation: 'مع you نستخدم "Do" في بداية السؤال.',
  },
]

// ===== COMPONENTS =====

type Tab = 'vocabulary' | 'grammar' | 'phrases' | 'quiz'

function FlashCard({ word }: { word: { en: string; ar: string; example: string } }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      onClick={() => setFlipped(!flipped)}
      className="cursor-pointer select-none"
    >
      <div
        className={`relative w-full h-44 rounded-xl shadow-md transition-all duration-500 ${
          flipped ? 'bg-primary-600 text-white' : 'bg-white text-gray-800'
        } hover:shadow-lg`}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          {!flipped ? (
            <>
              <p className="text-2xl font-bold mb-2">{word.en}</p>
              <p className="text-sm text-gray-400">اضغط لإظهار الترجمة</p>
            </>
          ) : (
            <>
              <p className="text-xl font-bold mb-1">{word.ar}</p>
              <p className="text-lg opacity-90 mb-2">{word.en}</p>
              <p className="text-sm opacity-75 text-center italic">
                &ldquo;{word.example}&rdquo;
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function VocabularySection() {
  const [selectedCategory, setSelectedCategory] = useState(0)

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">المفردات</h2>
      <p className="text-gray-500 mb-6">اضغط على البطاقة لإظهار الترجمة والمثال</p>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {vocabularyData.map((cat, i) => (
          <button
            key={cat.name}
            onClick={() => setSelectedCategory(i)}
            className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === i
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {vocabularyData[selectedCategory].words.map((word) => (
          <FlashCard key={word.en} word={word} />
        ))}
      </div>
    </div>
  )
}

function GrammarSection() {
  const [openLesson, setOpenLesson] = useState<number | null>(0)

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">القواعد</h2>
      <p className="text-gray-500 mb-6">تعلّم قواعد اللغة الإنجليزية بشكل مبسّط</p>

      <div className="space-y-3">
        {grammarLessons.map((lesson, i) => (
          <div key={lesson.title} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => setOpenLesson(openLesson === i ? null : i)}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
            >
              <div className="text-right">
                <h3 className="font-bold text-gray-800">{lesson.title}</h3>
                <p className="text-sm text-primary-600">{lesson.titleEn}</p>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  openLesson === i ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {openLesson === i && (
              <div className="px-5 pb-5 border-t border-gray-100 animate-fade-in">
                <p className="text-gray-600 my-4 bg-primary-50 p-3 rounded-lg">
                  {lesson.explanation}
                </p>
                <div className="space-y-3">
                  {lesson.rules.map((rule) => (
                    <div key={rule.rule} className="border border-gray-100 rounded-lg p-4">
                      <p className="font-semibold text-primary-700 mb-2">{rule.rule}</p>
                      <p className="text-gray-800 font-mono text-sm bg-gray-50 p-2 rounded mb-1">
                        {rule.example}
                      </p>
                      <p className="text-gray-500 text-sm">{rule.translation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function PhrasesSection() {
  const categories = Array.from(new Set(commonPhrases.map((p) => p.category)))
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [playing, setPlaying] = useState<string | null>(null)

  const filtered = selectedCat ? commonPhrases.filter((p) => p.category === selectedCat) : commonPhrases

  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.8
      setPlaying(text)
      utterance.onend = () => setPlaying(null)
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">عبارات شائعة</h2>
      <p className="text-gray-500 mb-6">عبارات مفيدة للمحادثات اليومية - اضغط على أيقونة الصوت للاستماع</p>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCat(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            !selectedCat ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          الكل
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCat === cat
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((phrase) => (
          <div
            key={phrase.en}
            className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <button
              onClick={() => speak(phrase.en)}
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                playing === phrase.en
                  ? 'bg-primary-600 text-white'
                  : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
              }`}
              title="استمع للنطق"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 text-lg">{phrase.en}</p>
              <p className="text-gray-500">{phrase.ar}</p>
            </div>
            <span className="flex-shrink-0 text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
              {phrase.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuizSection() {
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(0)
  const [showResult, setShowResult] = useState(false)

  const question = quizQuestions[currentQ]

  const handleSelect = (optionIndex: number) => {
    if (selected !== null) return
    setSelected(optionIndex)
    setAnswered(answered + 1)
    if (optionIndex === question.correct) {
      setScore(score + 1)
    }
  }

  const handleNext = () => {
    if (currentQ < quizQuestions.length - 1) {
      setCurrentQ(currentQ + 1)
      setSelected(null)
    } else {
      setShowResult(true)
    }
  }

  const handleRestart = () => {
    setCurrentQ(0)
    setSelected(null)
    setScore(0)
    setAnswered(0)
    setShowResult(false)
  }

  if (showResult) {
    const percentage = Math.round((score / quizQuestions.length) * 100)
    let message = ''
    if (percentage >= 90) message = 'ممتاز! أنت متقدم في الإنجليزية! 🌟'
    else if (percentage >= 70) message = 'جيد جداً! استمر في التعلم! 💪'
    else if (percentage >= 50) message = 'جيد! تحتاج مزيداً من الممارسة 📚'
    else message = 'لا تقلق! راجع الدروس وحاول مرة أخرى 🔄'

    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
          <div className="w-24 h-24 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl font-bold text-primary-600">{percentage}%</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">نتيجة الاختبار</h2>
          <p className="text-gray-600 mb-2">
            أجبت على {score} من {quizQuestions.length} بشكل صحيح
          </p>
          <p className="text-lg mb-6">{message}</p>
          <button
            onClick={handleRestart}
            className="bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors"
          >
            أعد الاختبار
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">اختبر نفسك</h2>
      <p className="text-gray-500 mb-6">اختبر معلوماتك في اللغة الإنجليزية</p>

      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-gray-500">
          السؤال {currentQ + 1} من {quizQuestions.length}
        </span>
        <span className="text-sm font-medium text-primary-600">
          النتيجة: {score}/{answered}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQ + 1) / quizQuestions.length) * 100}%` }}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">{question.question}</h3>
        <div className="space-y-3">
          {question.options.map((option, i) => {
            let style = 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
            if (selected !== null) {
              if (i === question.correct) {
                style = 'border-green-500 bg-green-50 text-green-800'
              } else if (i === selected && i !== question.correct) {
                style = 'border-red-500 bg-red-50 text-red-800'
              } else {
                style = 'border-gray-200 opacity-50'
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={selected !== null}
                className={`w-full text-right p-4 rounded-xl border-2 transition-all ${style}`}
              >
                <span className="font-medium">{option}</span>
              </button>
            )
          })}
        </div>

        {selected !== null && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl animate-fade-in">
            <p className="text-blue-800 text-sm">{question.explanation}</p>
          </div>
        )}
      </div>

      {selected !== null && (
        <button
          onClick={handleNext}
          className="w-full bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors"
        >
          {currentQ < quizQuestions.length - 1 ? 'السؤال التالي' : 'عرض النتيجة'}
        </button>
      )}
    </div>
  )
}

// ===== MAIN PAGE =====

export default function LearnEnglish() {
  const [activeTab, setActiveTab] = useState<Tab>('vocabulary')

  const tabs: { id: Tab; label: string; icon: JSX.Element }[] = [
    {
      id: 'vocabulary',
      label: 'المفردات',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      id: 'grammar',
      label: 'القواعد',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'phrases',
      label: 'عبارات',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
    {
      id: 'quiz',
      label: 'اختبار',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm">الرئيسية</span>
          </Link>
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800">تعلّم الإنجليزية</h1>
            <p className="text-xs text-gray-400">Learn English</p>
          </div>
          <div className="w-16" />
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b sticky top-[72px] z-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === 'vocabulary' && <VocabularySection />}
        {activeTab === 'grammar' && <GrammarSection />}
        {activeTab === 'phrases' && <PhrasesSection />}
        {activeTab === 'quiz' && <QuizSection />}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-400">
        تعلّم الإنجليزية خطوة بخطوة 📖
      </footer>
    </div>
  )
}
