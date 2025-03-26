import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  findNodeHandle,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/context/ThemeContext";
import { useSettings } from "@/context/SettingsContext";
import * as Animatable from "react-native-animatable";
import WalkthroughTooltip from "react-native-walkthrough-tooltip";

// وارد کردن فایل JSON قرآن
import { surahs } from "@/assets/data/surahs";
import { translatePersian } from "@/assets/data/translatePersian";

// وارد کردن دیتابیس سوالات و جواب‌ها
import { qaDatabase, QAEntry } from "@/assets/data/qaDatabase";

// تابع برای فرمت کردن زمان
const formatTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

// تابع برای تعیین بازه زمانی روز
const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning"; // صبح: ۵ صبح تا ۱۲ ظهر
  if (hour >= 12 && hour < 17) return "afternoon"; // ظهر: ۱۲ تا ۵ عصر
  if (hour >= 17 && hour < 21) return "evening"; // عصر: ۵ عصر تا ۹ شب
  return "night"; // شب: ۹ شب تا ۵ صبح
};

// تابع برای نرمال‌سازی متن (حذف علامت‌های نگارشی و حروف خاص)
const normalizeText = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[،؛؟!.\-]/g, "")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/[\u061F-\u0621]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

// تابع برای شمارش تعداد تکرار یک کلمه در قرآن
const countWordInQuran = (word: string) => {
  let count = 0;
  const normalizedWord = normalizeText(word);
  surahs.forEach(surah => {
    surah.ayahs.forEach(ayah => {
      const normalizedAyah = normalizeText(ayah.text);
      const matches = normalizedAyah.split(" ").filter(w => w.includes(normalizedWord)).length;
      count += matches;
    });
  });
  return count;
};

// تابع برای پیدا کردن معنی آیه از فایل translatePersian.ts
const getAyahTranslation = (surahNumber: number, ayahNumber: number) => {
  const surah = translatePersian.find(t => t.number === surahNumber);
  if (surah) {
    const translation = surah.translation.find(t => t.number === ayahNumber);
    if (translation) {
      return `معنی آیه ${ayahNumber} از سوره ${surah.name_fa} (${surah.name}): ${translation.text}`;
    }
  }
  return "متأسفم، نمی‌تونم معنی این آیه رو پیدا کنم. لطفاً شماره سوره یا آیه رو چک کن.";
};

// تابع برای تبدیل پاسخ به رشته (در صورتی که شیء باشد)
const convertAnswerToString = (
  answer: string | { timeBased: boolean; morning?: string; afternoon?: string; evening?: string; night?: string }
): string => {
  if (typeof answer === "string") {
    return answer;
  }
  const timeOfDay = getTimeOfDay();
  const timeBasedAnswer = answer as { timeBased: boolean; morning?: string; afternoon?: string; evening?: string; night?: string };
  return timeBasedAnswer[timeOfDay] || "پاسخ برای این زمان تعریف نشده است.";
};

// تابع برای تحلیل سبک پاسخ (ساده و اولیه)
const analyzeResponseStyle = (response: string) => {
  if (typeof response !== "string") {
    return "casual"; // مقدار پیش‌فرض در صورتی که ورودی رشته نباشد
  }
  const length = response.length;
  const words = response.split(" ").length;
  const hasFormalWords = response.includes("است") || response.includes("می‌باشد");

  if (length < 50 || words < 10) return "short";
  if (length > 100 || words > 20) return "detailed";
  if (hasFormalWords) return "formal";
  return "casual";
};

// تابع برای انتخاب رندوم جواب با در نظر گرفتن سبک ترجیحی
const getRandomAnswer = (
  answers: string[] | { timeBased: boolean; morning?: string; afternoon?: string; evening?: string; night?: string }[],
  preferredStyle: string | null
) => {
  const timeOfDay = getTimeOfDay();

  const firstAnswer = answers[0];
  if (typeof firstAnswer === "object" && firstAnswer.timeBased) {
    const timeBasedAnswer = firstAnswer as { timeBased: boolean; morning?: string; afternoon?: string; evening?: string; night?: string };
    const selectedAnswer = timeBasedAnswer[timeOfDay] || "پاسخ برای این زمان تعریف نشده است.";
    if (answers.length > 1) {
      const otherAnswers = answers.slice(1) as string[];
      const randomOtherAnswer = otherAnswers[Math.floor(Math.random() * otherAnswers.length)];
      return Math.random() > 0.5 ? selectedAnswer : randomOtherAnswer;
    }
    return selectedAnswer;
  }

  const stringAnswers = answers as string[];
  if (preferredStyle) {
    const matchingStyleAnswers = stringAnswers.filter(answer => analyzeResponseStyle(answer) === preferredStyle);
    if (matchingStyleAnswers.length > 0) {
      return matchingStyleAnswers[Math.floor(Math.random() * matchingStyleAnswers.length)];
    }
  }
  return stringAnswers[Math.floor(Math.random() * stringAnswers.length)];
};

// تابع برای استخراج کلمات کلیدی
const extractKeywords = (question: string) => {
  return normalizeText(question).split(" ").filter(word => word.length > 2);
};

// تابع برای پیدا کردن کلمات مرتبط (مترادف‌ها یا مفاهیم مشابه)
const findRelatedKeywords = (keyword: string): string[] => {
  const relatedWords: { [key: string]: string[] } = {
    "نماز": ["وضو", "قنوت", "سجده", "رکعت"],
    "صبح": ["فجر", "اذان", "طلوع"],
    "فقه": ["احکام", "حکم", "شرعی"],
    "تکنولوژی": ["هوش مصنوعی", "اینترنت", "دستگاه"],
  };
  return relatedWords[keyword] || [];
};

// تابع بهبودیافته برای محاسبه امتیاز تطابق با در نظر گرفتن کلمات مرتبط
const calculateMatchScore = (inputKeywords: string[], dbKeywords: string[], includeRelated: boolean = false) => {
  let allInputKeywords = [...inputKeywords];
  if (includeRelated) {
    inputKeywords.forEach(keyword => {
      const related = findRelatedKeywords(keyword);
      allInputKeywords = [...allInputKeywords, ...related];
    });
  }
  const matchedKeywords = allInputKeywords.filter(keyword => dbKeywords.includes(keyword));
  return matchedKeywords.length / allInputKeywords.length;
};

// تابع برای ترکیب پاسخ‌ها از چند منبع
const combineAnswers = (entries: QAEntry[]): string => {
  if (entries.length === 0) return "متأسفم، نمی‌تونم پاسخی پیدا کنم.";
  if (entries.length === 1) return convertAnswerToString(entries[0].answers[0]);

  const combinedAnswer = entries.map(entry => {
    const answer = convertAnswerToString(entry.answers[0]);
    return `**${entry.category} (${entry.source}):** ${answer}`;
  }).join("\n\n");

  return `با توجه به اطلاعات موجود:\n${combinedAnswer}`;
};

// لیست پیام‌های پایانی رندوم
const endingMessages = [
  "اگر سوال دیگری داشتی بپرس 😊",
  "خوشحال می‌شم بتونم سوالت رو جواب بدم!",
  "آیا می‌خوای یه چیز جدید راجب قرآن بدونی؟",
  "سوال دیگه‌ای داری؟ بگو تا کمکت کنم! 🌟",
  "دوست داری درباره موضوع دیگه‌ای صحبت کنیم؟",
  "هر سوالی داری ازم بپرس، با کمال میل جواب می‌دم! 😊",
  "اگه موضوع دیگه‌ای به ذهنت رسید، بگو تا باهم بررسی کنیم!",
  "من همیشه اینجام تا به سوالاتت جواب بدم، سوالی داری؟",
  "دوست داری درباره یه موضوع جذاب دیگه حرف بزنیم؟",
  "سوال دیگه‌ای داری؟ من آماده‌ام که کمکت کنم! 🚀",
];

// لیست دانستنی‌های قرآنی
const quranFacts = [
  "آیا می‌دونستی که سوره بقره با 286 آیه، طولانی‌ترین سوره قرآن هست؟",
  "کلمه «الله» 2698 بار در قرآن تکرار شده، خیلی جالبه نه؟",
  "سوره کوثر با 3 آیه، کوتاه‌ترین سوره قرآن هست!",
  "آیا می‌دونستی که قرآن در مدت 23 سال بر پیامبر (ص) نازل شده؟",
  "سوره حمد که بهش «ام‌الکتاب» هم می‌گن، 7 آیه داره و در هر نماز واجب خونده می‌شه.",
  "کلمه «جنة» (بهشت) 77 بار در قرآن اومده، خیلی قشنگه نه؟",
  "سوره یس که بهش «قلب قرآن» می‌گن، در مدینه نازل شده.",
  "آیا می‌دونستی که 114 سوره در قرآن وجود داره و هر سوره با بسم‌الله شروع می‌شه، به جز سوره توبه؟",
  "کلمه «شیطان» 88 بار در قرآن ذکر شده، جالبه نه؟",
  "سوره ناس و فلق به «معوذتین» معروفن و برای محافظت از شر توصیه می‌شن.",
  "آیا می‌دونستی که سوره علق اولین سوره‌ای بود که بر پیامبر (ص) نازل شد؟",
  "کلمه «قرآن» 70 بار در خود قرآن به کار رفته، خیلی جالبه نه؟",
  "سوره توبه تنها سوره‌ایه که با بسم‌الله شروع نمی‌شه، چون درباره قطع رابطه با مشرکین صحبت می‌کنه.",
  "آیا می‌دونستی که سوره کهف در روز جمعه خوندنش ثواب زیادی داره؟",
  "کلمه «جهان» 115 بار در قرآن اومده و به معنای دنیا و آخرته.",
  "سوره مریم تنها سوره‌ایه که به نام یه زن (حضرت مریم) نام‌گذاری شده.",
  "آیا می‌دونستی که سوره فیل درباره لشکر ابرهه و حمله به کعبه‌ست؟",
  "کلمه «صبر» 102 بار در قرآن ذکر شده و به اهمیت صبر تأکید داره.",
  "سوره اخلاص معادل یک‌سوم قرآن ثواب داره، خیلی قشنگه نه؟",
  "آیا می‌دونستی که سوره ملک برای حفاظت از عذاب قبر توصیه شده؟",
  "کلمه «رحمن» 57 بار در قرآن اومده و یکی از اسم‌های زیبای خداست.",
  "سوره زلزال درباره زلزله روز قیامته و فقط 8 آیه داره.",
  "آیا می‌دونستی که سوره نساء درباره حقوق زنان و خانواده صحبت می‌کنه؟",
  "کلمه «علم» و مشتقاتش 854 بار در قرآن اومده و به اهمیت دانش اشاره داره.",
  "سوره قصص داستان حضرت موسی (ع) رو به زیبایی روایت می‌کنه.",
  "آیا می‌دونستی که سوره طه برای آرامش قلب خیلی توصیه شده؟",
  "کلمه «نور» 43 بار در قرآن ذکر شده و نماد هدایت الهی هست.",
  "سوره انفال درباره جنگ بدر و تقسیم غنایم صحبت می‌کنه.",
  "آیا می‌دونستی که سوره رحمن به «عروس قرآن» معروفه؟",
  "کلمه «حیاة» (زندگی) 145 بار در قرآن اومده و به زندگی دنیا و آخرت اشاره داره.",
  "سوره واقعه درباره روز قیامت و حالات انسان‌ها در اون روزه.",
  "آیا می‌دونستی که سوره مزمل درباره شب‌زنده‌داری پیامبر (ص) صحبت می‌کنه؟",
  "کلمه «موت» (مرگ) 145 بار در قرآن اومده، به اندازه کلمه «حیاة»!",
  "سوره لقمان شامل نصایح لقمان حکیم به پسرشه، خیلی آموزنده‌ست!",
  "آیا می‌دونستی که سوره انبیاء درباره داستان 16 پیامبر صحبت می‌کنه؟",
  "کلمه «ملائکه» (فرشتگان) 88 بار در قرآن ذکر شده، جالبه نه؟",
  "سوره حجر درباره قوم عاد و ثمود و سرنوشتشون صحبت می‌کنه.",
  "آیا می‌دونستی که سوره فجر درباره قیامت و سرنوشت انسان‌هاست؟",
  "کلمه «عدل» (عدالت) 28 بار در قرآن اومده و به اهمیت عدالت تأکید داره.",
  "سوره شمس با قسم‌های پیاپی به آفرینش خدا شروع می‌شه، خیلی زیباست!",
  "آیا می‌دونستی که سوره ابراهیم درباره دعای حضرت ابراهیم (ع) برای مکه‌ست؟",
  "کلمه «کتاب» 261 بار در قرآن اومده و به اهمیت کتاب‌های آسمانی اشاره داره.",
  "سوره حج درباره احکام حج و اهمیت این فریضه صحبت می‌کنه.",
  "آیا می‌دونستی که سوره قمر درباره معجزه شق‌القمر پیامبر (ص) هست؟",
  "کلمه «ایمان» 811 بار در قرآن ذکر شده و به اهمیت ایمان تأکید داره.",
  "سوره سجده درباره سجده کردن در برابر خدا و نشانه‌های اوست.",
  "آیا می‌دونستی که سوره غافر به «سوره مؤمن» هم معروفه؟",
  "کلمه «ذکر» 292 بار در قرآن اومده و به یاد خدا بودن رو یادآوری می‌کنه.",
  "سوره فصلت درباره قرآن و تأثیرش بر دل‌های پاکه.",
  "آیا می‌دونستی که سوره نمل داستان حضرت سلیمان (ع) و ملکه سبا رو روایت می‌کنه؟",
  "کلمه «شکر» 75 بار در قرآن ذکر شده و به اهمیت شکرگزاری اشاره داره.",
  "سوره هود داستان چند پیامبر مثل نوح، هود و صالح رو بیان می‌کنه.",
  "آیا می‌دونستی که سوره تکویر درباره نشانه‌های قیامت صحبت می‌کنه؟",
  "کلمه «رحمت» 339 بار در قرآن اومده و به رحمت بی‌پایان خدا اشاره داره.",
  "سوره انشراح برای گشایش قلب پیامبر (ص) نازل شده، خیلی قشنگه نه؟",
  "آیا می‌دونستی که سوره بلد درباره اهمیت کمک به نیازمندان صحبت می‌کنه؟",
  "کلمه «قلب» 132 بار در قرآن اومده و به نقش قلب در هدایت اشاره داره.",
  "سوره اعلی درباره تسبیح خدا و عظمت اوست.",
  "آیا می‌دونستی که سوره انسان درباره پاداش نیکوکاران در بهشته؟",
  "کلمه «هدی» (هدایت) 316 بار در قرآن ذکر شده، خیلی جالبه نه؟",
  "سوره مطففین درباره کم‌فروشی و اهمیت انصاف صحبت می‌کنه.",
  "آیا می‌دونستی که سوره مدثر دومین سوره‌ای بود که بر پیامبر (ص) نازل شد؟",
  "کلمه «نفس» 295 بار در قرآن اومده و به روح و طبیعت انسان اشاره داره.",
  "سوره تحریم درباره اهمیت اطاعت از خدا و پیامبر (ص) صحبت می‌کنه.",
  "آیا می‌دونستی که سوره قیامت درباره روز قیامت و حسابرسی انسانهاست؟",
  "کلمه «فضل» (فضیلت و برتری) 61 بار در قرآن اومده و به لطف خدا اشاره داره.",
  "سوره طارق با قسم به آسمان و ستاره‌ها شروع می‌شه، خیلی زیباست!",
  "آیا می‌دونستی که سوره مرسلات درباره فرستادگان الهی و قیامته؟",
  "کلمه «عقل» و مشتقاتش 49 بار در قرآن اومده و به اهمیت تعقل تأکید داره.",
  "سوره نبأ درباره خبر بزرگ قیامت و نشانه‌های خداست.",
];

// تابع برای انتخاب رندوم پیام پایانی
const getRandomEndingMessage = () => {
  return endingMessages[Math.floor(Math.random() * endingMessages.length)];
};

// تابع برای انتخاب رندوم دانستنی قرآنی
const getRandomQuranFact = () => {
  return quranFacts[Math.floor(Math.random() * quranFacts.length)];
};

// لیست پیام‌های معرفی هوش مصنوعی
const introMessages = [
  "سلام! من Mh Ai هستم، یه هوش مصنوعی که توسط سید محمدحسین جلالی ساخته شده. خیلی خوشحال می‌شم که بتونم به سوالاتت جواب بدم! 😊",
  "درود! من Mh Ai هستم، ساخته‌شده توسط سید محمدحسین جلالی. از صحبت باهات خیلی خوشحال می‌شم، سوالت چیه؟ 🚀",
  "سلام دوست عزیز! من Mh Ai هستم، یه هوش مصنوعی که سید محمدحسین جلالی من رو خلق کرده. خیلی دوست دارم بتونم بهت کمک کنم! 🌟",
  "سلام! من Mh Ai هستم، یه هوش مصنوعی ساخته‌شده توسط سید محمدحسین جلالی. از اینکه باهات آشنا می‌شم خیلی خوشحال می‌شم، درباره چی دوست داری حرف بزنیم؟",
  "درود بر تو! من Mh Ai هستم، ساخته‌شده توسط سید محمدحسین جلالی. خیلی خوشحال می‌شم که بتونم به سوالاتت جواب بدم، سوالت چیه؟ 😊",
  "سلام! من Mh Ai هستم، یه هوش مصنوعی که توسط سید محمدحسین جلالی طراحی شده. از آشنایی باهات خوشحال می‌شم، درباره چی می‌خوای صحبت کنیم؟",
  "سلام دوست من! من Mh Ai هستم، ساخته‌شده توسط سید محمدحسین جلالی. خیلی دوست دارم بتونم بهت کمک کنم، سوالت چیه؟ 🌟",
  "درود! من Mh Ai هستم، یه هوش مصنوعی که سید محمدحسین جلالی من رو ساخته. از صحبت باهات خیلی خوشحال می‌شم، درباره چی دوست داری حرف بزنیم؟ 🚀",
];

// تابع برای انتخاب رندوم پیام معرفی
const getRandomIntroMessage = () => {
  return introMessages[Math.floor(Math.random() * introMessages.length)];
};

// تابع بهبودیافته برای جستجو در دیتابیس
const searchInDatabase = (inputQuestion: string) => {
  const keywords = extractKeywords(inputQuestion);
  let bestMatch: QAEntry | null = null;
  let highestMatchScore = 0;
  let relatedEntries: QAEntry[] = [];

  // مرحله 1: جستجوی دقیق (تطابق بالا)
  for (const entry of qaDatabase) {
    const matchScore = calculateMatchScore(keywords, entry.keywords);
    if (matchScore > highestMatchScore && matchScore > 0.8) {
      highestMatchScore = matchScore;
      bestMatch = entry;
    }
  }

  // اگر تطابق دقیق پیدا شد، مستقیماً برگردون
  if (bestMatch) {
    return { type: "exact", result: bestMatch };
  }

  // مرحله 2: جستجوی گسترده‌تر با کلمات مرتبط
  for (const entry of qaDatabase) {
    const matchScore = calculateMatchScore(keywords, entry.keywords, true);
    if (matchScore > 0.3) {
      relatedEntries.push(entry);
    }
  }

  // مرحله 3: ترکیب پاسخ‌ها یا ثبت سوال جدید
  if (relatedEntries.length > 0) {
    return { type: "combined", result: relatedEntries };
  }

  return { type: "not_found", result: null };
};

const AiScreen = () => {
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string; timestamp: string }[]>([]);
  const [questionHistory, setQuestionHistory] = useState<{ question: string; answer: string }[]>([]);
  const [database, setDatabase] = useState<QAEntry[]>(qaDatabase); // دیتابیس پویا
  const [newQuestions, setNewQuestions] = useState<{ question: string; status: string }[]>([]);
  const [feedbackLog, setFeedbackLog] = useState<{ question: string; response: string; feedback: string; style: string }[]>([]);
  const [preferredStyle, setPreferredStyle] = useState<string | null>(null); // سبک ترجیحی کاربر
  const [isFirstQuestion, setIsFirstQuestion] = useState(true); // برای ردیابی اولین سوال
  const [waitingForQuranFact, setWaitingForQuranFact] = useState(false); // برای ردیابی درخواست دانستنی قرآنی
  const { isDarkMode, toggleTheme } = useTheme();
  const { fontSize, fontType } = useSettings();
  const navigation = useNavigation();
  const { height: windowHeight } = useWindowDimensions();

  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const [userWantsTour, setUserWantsTour] = useState<boolean | null>(null);

  const headerRef = useRef<View>(null);
  const inputRef = useRef<View>(null);
  const chatContainerRef = useRef<View>(null);

  // لود دیتابیس و تاریخچه‌ها از AsyncStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedDatabase = await AsyncStorage.getItem("dynamicDatabase");
        if (savedDatabase) {
          setDatabase(JSON.parse(savedDatabase));
        }

        const savedChat = await AsyncStorage.getItem("chatHistory");
        if (savedChat) {
          const parsedChat = JSON.parse(savedChat).map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp || formatTime(),
          }));
          setChatHistory(parsedChat);
        }

        const savedQuestionHistory = await AsyncStorage.getItem("questionHistory");
        if (savedQuestionHistory) {
          setQuestionHistory(JSON.parse(savedQuestionHistory));
        }

        const savedNewQuestions = await AsyncStorage.getItem("newQuestions");
        if (savedNewQuestions) {
          setNewQuestions(JSON.parse(savedNewQuestions));
        }

        const savedFeedbackLog = await AsyncStorage.getItem("feedbackLog");
        if (savedFeedbackLog) {
          setFeedbackLog(JSON.parse(savedFeedbackLog));
        }

        const savedPreferredStyle = await AsyncStorage.getItem("preferredStyle");
        if (savedPreferredStyle) {
          setPreferredStyle(savedPreferredStyle);
        }

        const wantsTour = await AsyncStorage.getItem("userWantsTour");
        const seenTour = await AsyncStorage.getItem("hasSeenAiTour");
        if (wantsTour !== null) {
          setUserWantsTour(wantsTour === "true");
          if (seenTour === "true") {
            setHasSeenTour(true);
          } else if (wantsTour === "true") {
            setTourActive(true);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    loadData();
  }, []);

  // ذخیره دیتابیس و تاریخچه‌ها
  const saveData = async () => {
    try {
      await AsyncStorage.setItem("dynamicDatabase", JSON.stringify(database));
      await AsyncStorage.setItem("chatHistory", JSON.stringify(chatHistory));
      await AsyncStorage.setItem("questionHistory", JSON.stringify(questionHistory));
      await AsyncStorage.setItem("newQuestions", JSON.stringify(newQuestions));
      await AsyncStorage.setItem("feedbackLog", JSON.stringify(feedbackLog));
      if (preferredStyle) {
        await AsyncStorage.setItem("preferredStyle", preferredStyle);
      }
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  const markTourAsSeen = async () => {
    try {
      await AsyncStorage.setItem("hasSeenAiTour", "true");
      setHasSeenTour(true);
      setTourActive(false);
      setTourStep(0);
    } catch (error) {
      console.error("Error saving tour status:", error);
    }
  };

  // تابع برای تقسیم سوال به بخش‌ها
const splitQuestion = (question: string): string[] => {
  const normalizedQuestion = normalizeText(question);
  // تقسیم سوال با استفاده از علامت‌های نگارشی و کلمات ربطی
  const separators = /[،؛؟!.\-\s]+(و|یا|ولی|اما)\s+|[،؛؟!.\-\s]+/;
  const parts = normalizedQuestion
    .split(separators)
    .map(part => part.trim())
    .filter(part => part.length > 0);
  return parts;
};

  // تابع به‌روزرسانی دیتابیس با سوالات جدید
  const updateDatabaseWithNewQuestions = async () => {
    const updatedNewQuestions = [...newQuestions];
    for (let newQuestion of updatedNewQuestions) {
      if (newQuestion.status === "new") {
        const newAnswer = `پاسخ پیش‌فرض برای سوال جدید: ${newQuestion.question}`;
        const newEntry: QAEntry = {
          question: newQuestion.question,
          keywords: extractKeywords(newQuestion.question),
          answers: [newAnswer],
          category: "سوالات جدید",
          source: "کاربر یا منبع جدید",
        };
        setDatabase(prev => [...prev, newEntry]);
        newQuestion.status = "added";
      }
    }
    setNewQuestions(updatedNewQuestions);
    await saveData();
  };

  // تابع بهبود پاسخ‌ها بر اساس بازخوردها
  const improveResponsesBasedOnFeedback = async () => {
    const updatedDatabase = [...database];
    for (let feedback of feedbackLog) {
      if (feedback.feedback === "negative") {
        const betterAnswer = `پاسخ بهبودیافته برای سوال: ${feedback.question}`;
        const entry = updatedDatabase.find(item => item.question === feedback.question);
        if (entry) {
          entry.answers.push(betterAnswer);
        }
      }
    }
    setDatabase(updatedDatabase);
    await saveData();
  };

  // تابع اصلی برای یادگیری و پاسخ‌دهی
  const learnAndUpdate = (inputQuestion: string, userFeedback: string | null = null, isFeedbackOnly: boolean = false) => {
    const searchResult = searchInDatabase(inputQuestion);
    let response: string;

    if (!isFeedbackOnly) {
      if (searchResult.type === "exact") {
        const matchedQuestion = searchResult.result as QAEntry;
        response = getRandomAnswer(matchedQuestion.answers, preferredStyle);
        const timestamp = formatTime();
        const userMessage = { role: "user", content: inputQuestion, timestamp };
        const aiMessage = { role: "assistant", content: `${response}\n\n${getRandomEndingMessage()}`, timestamp };
        setChatHistory(prev => [...prev, userMessage, aiMessage]);
        setQuestionHistory(prev => [...prev, { question: inputQuestion, answer: response }]);
      } else if (searchResult.type === "combined") {
        const relatedEntries = searchResult.result as QAEntry[];
        response = combineAnswers(relatedEntries);
        const timestamp = formatTime();
        const userMessage = { role: "user", content: inputQuestion, timestamp };
        const aiMessage = { role: "assistant", content: `${response}\n\n${getRandomEndingMessage()}`, timestamp };
        setChatHistory(prev => [...prev, userMessage, aiMessage]);
        setQuestionHistory(prev => [...prev, { question: inputQuestion, answer: response }]);
      } else {
        setNewQuestions(prev => [...prev, { question: inputQuestion, status: "new" }]);
        const timestamp = formatTime();
        const userMessage = { role: "user", content: inputQuestion, timestamp };
        const aiMessage = {
          role: "assistant",
          content: `سوال شما ثبت شد و به‌زودی پاسخ داده می‌شه. فعلاً نمی‌تونم به این سوال جواب بدم.\n\n${getRandomEndingMessage()}`,
          timestamp,
        };
        setChatHistory(prev => [...prev, userMessage, aiMessage]);
      }

      // نمایش پیام معرفی بعد از اولین سوال
      if (isFirstQuestion) {
        const timestamp = formatTime();
        const introMessage = { role: "assistant", content: getRandomIntroMessage(), timestamp };
        setChatHistory(prev => [...prev, introMessage]);
        setIsFirstQuestion(false);
      }
    }

    if (userFeedback && (searchResult.type === "exact" || searchResult.type === "combined")) {
      response = searchResult.type === "exact"
        ? convertAnswerToString((searchResult.result as QAEntry).answers[0])
        : combineAnswers(searchResult.result as QAEntry[]);
      const style = analyzeResponseStyle(response);
      setFeedbackLog(prev => [...prev, { question: inputQuestion, response, feedback: userFeedback, style }]);
      if (userFeedback === "positive") {
        setPreferredStyle(style);
      } else if (userFeedback === "negative") {
        setNewQuestions(prev => [...prev, { question: inputQuestion, status: "needs_review" }]);
      }
    }

    if (newQuestions.length > 0) {
      updateDatabaseWithNewQuestions();
    }
    if (feedbackLog.length > 0) {
      improveResponsesBasedOnFeedback();
    }

    saveData();
  };

  // تابع بهبودیافته برای تولید جواب
// تابع بهبودیافته برای تولید جواب
const generateAnswer = (userInput: string) => {
  // بررسی درخواست دانستنی قرآنی
  if (waitingForQuranFact) {
    const normalizedInput = normalizeText(userInput);
    if (normalizedInput.includes("بله") || normalizedInput.includes("آره") || normalizedInput.includes("بلی")) {
      const fact = getRandomQuranFact();
      const timestamp = formatTime();
      const aiMessage = { role: "assistant", content: `${fact}\n\n${getRandomEndingMessage()}`, timestamp };
      setChatHistory(prev => [...prev, aiMessage]);
      setWaitingForQuranFact(false);
      saveData();
      return;
    } else {
      const timestamp = formatTime();
      const aiMessage = { role: "assistant", content: `باشه، هر وقت خواستی بگو تا یه دانستنی قرآنی برات بگم! 😊\n\n${getRandomEndingMessage()}`, timestamp };
      setChatHistory(prev => [...prev, aiMessage]);
      setWaitingForQuranFact(false);
      saveData();
      return;
    }
  }

  // بررسی سوالاتی که درباره تعداد تکرار کلمات در قرآن هستند
  const wordCountRegex = /(.*?)چند\s*بار\s*در\s*قرآن\s*تکرار\s*شده/;
  const wordCountMatch = userInput.match(wordCountRegex);
  if (wordCountMatch) {
    const word = wordCountMatch[1].trim();
    const count = countWordInQuran(word);
    const timestamp = formatTime();
    const userMessage = { role: "user", content: userInput, timestamp };
    const aiMessage = { role: "assistant", content: `کلمه «${word}» ${count} بار در قرآن تکرار شده است.\n\n${getRandomEndingMessage()}`, timestamp };
    setChatHistory(prev => [...prev, userMessage, aiMessage]);
    setQuestionHistory(prev => [...prev, { question: userInput, answer: aiMessage.content }]);

    // نمایش پیام معرفی بعد از اولین سوال
    if (isFirstQuestion) {
      const introTimestamp = formatTime();
      const introMessage = { role: "assistant", content: getRandomIntroMessage(), timestamp: introTimestamp };
      setChatHistory(prev => [...prev, introMessage]);
      setIsFirstQuestion(false);
    }

    saveData();
    return;
  }

  // بررسی سوالاتی که درباره معنی آیه هستند
  const ayahTranslationRegex = /آیه\s*(\d+)\s*در\s*سوره\s*(\d+)/;
  const ayahTranslationMatch = userInput.match(ayahTranslationRegex);
  if (ayahTranslationMatch) {
    const ayah = parseInt(ayahTranslationMatch[1], 10);
    const surah = parseInt(ayahTranslationMatch[2], 10);
    const response = getAyahTranslation(surah, ayah);
    const timestamp = formatTime();
    const userMessage = { role: "user", content: userInput, timestamp };
    const aiMessage = { role: "assistant", content: `${response}\n\n${getRandomEndingMessage()}`, timestamp };
    setChatHistory(prev => [...prev, userMessage, aiMessage]);
    setQuestionHistory(prev => [...prev, { question: userInput, answer: response }]);

    // نمایش پیام معرفی بعد از اولین سوال
    if (isFirstQuestion) {
      const introTimestamp = formatTime();
      const introMessage = { role: "assistant", content: getRandomIntroMessage(), timestamp: introTimestamp };
      setChatHistory(prev => [...prev, introMessage]);
      setIsFirstQuestion(false);
    }

    saveData();
    return;
  }

  // تقسیم سوال به بخش‌ها
  const questionParts = splitQuestion(userInput);
  if (questionParts.length > 1) {
    // سوال ترکیبی است، برای هر بخش پاسخ پیدا می‌کنیم
    const responses: string[] = [];
    questionParts.forEach((part, index) => {
      const searchResult = searchInDatabase(part);
      let response: string;

      if (searchResult.type === "exact") {
        const matchedQuestion = searchResult.result as QAEntry;
        response = getRandomAnswer(matchedQuestion.answers, preferredStyle);
        responses.push(`**پاسخ به بخش ${index + 1} (${part}):** ${response}`);
      } else if (searchResult.type === "combined") {
        const relatedEntries = searchResult.result as QAEntry[];
        response = combineAnswers(relatedEntries);
        responses.push(`**پاسخ به بخش ${index + 1} (${part}):** ${response}`);
      } else {
        setNewQuestions(prev => [...prev, { question: part, status: "new" }]);
        responses.push(`**پاسخ به بخش ${index + 1} (${part}):** سوال شما ثبت شد و به‌زودی پاسخ داده می‌شه. فعلاً نمی‌تونم به این سوال جواب بدم.`);
      }
    });

    // ترکیب پاسخ‌ها
    const timestamp = formatTime();
    const userMessage = { role: "user", content: userInput, timestamp };
    const combinedResponse = responses.join("\n\n");
    const aiMessage = { role: "assistant", content: `${combinedResponse}\n\n${getRandomEndingMessage()}`, timestamp };
    setChatHistory(prev => [...prev, userMessage, aiMessage]);
    setQuestionHistory(prev => [...prev, { question: userInput, answer: combinedResponse }]);

    // نمایش پیام معرفی بعد از اولین سوال
    if (isFirstQuestion) {
      const introTimestamp = formatTime();
      const introMessage = { role: "assistant", content: getRandomIntroMessage(), timestamp: introTimestamp };
      setChatHistory(prev => [...prev, introMessage]);
      setIsFirstQuestion(false);
    }

    saveData();
    return;
  }

  // اگر سوال ترکیبی نباشد، طبق روال قبلی عمل می‌کنیم
  learnAndUpdate(userInput);
};

  const handleSend = () => {
    if (!input.trim()) return;
    setInput("");

    // بررسی اینکه آیا پیام قبلی درخواست دانستنی قرآنی بوده
    const lastMessage = chatHistory[chatHistory.length - 1];
    if (lastMessage && lastMessage.role === "assistant" && lastMessage.content.includes("آیا می‌خوای یه چیز جدید راجب قرآن بدونی؟")) {
      setWaitingForQuranFact(true);
    }

    generateAnswer(input);
  };

  const handleFeedback = (message: { role: string; content: string; timestamp: string }, feedback: string) => {
    if (message.role === "assistant") {
      const relatedQuestion = questionHistory.find(q => q.answer === message.content)?.question;
      if (relatedQuestion) {
        learnAndUpdate(relatedQuestion, feedback, true);
      }
    }
  };

  const renderMessage = ({ item }: { item: { role: string; content: string; timestamp: string } }) => (
    <Animatable.View
      animation={item.role === "user" ? "fadeInRight" : "fadeInLeft"}
      duration={500}
      style={[
        styles.chatBubble,
        item.role === "user" ? styles.userBubble : styles.aiBubble,
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.chatText}>{item.content}</Text>
        <Text style={styles.timeText}>{item.timestamp}</Text>
      </View>
      {item.role === "assistant" && (
        <View style={styles.feedbackContainer}>
          <TouchableOpacity onPress={() => handleFeedback(item, "positive")}>
            <Feather name="thumbs-up" size={16} color="#fff" style={{ marginHorizontal: 5 }} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleFeedback(item, "negative")}>
            <Feather name="thumbs-down" size={16} color="#fff" style={{ marginHorizontal: 5 }} />
          </TouchableOpacity>
        </View>
      )}
    </Animatable.View>
  );

  const renderEmptyChat = () => (
    <View style={styles.emptyChatContainer}>
      <Image
        style={styles.emptyChatImage}
        source={require("../../assets/images/chat_empty.png")}
        resizeMode="contain"
      />
      <Text style={styles.emptyChatText}>هنوز چتی وجود ندارد</Text>
    </View>
  );

  const colors = isDarkMode
    ? {
        background: ["#251663", "#060817"],
        buttonText: "#FFFFFF",
        buttonBackground: "#08326B",
        headerBackground: "rgba(255, 255, 255, 0.25)",
        text: "#E0E0E0",
      }
    : {
        background: ["#7253EF", "#192163"],
        buttonText: "#fff",
        buttonBackground: "rgba(255, 255, 255, 0.2)",
        headerBackground: "rgba(255, 255, 255, 0.25)",
        text: "#333",
      };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      backgroundColor: colors.headerBackground,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 15,
      marginBottom: 10,
      alignSelf: "center",
      borderRadius: 15,
      marginTop: 20,
      height: 70,
      width: "92%",
    },
    headerText: {
      fontSize: fontSize ? parseInt(fontSize) : 22,
      color: colors.buttonText,
      fontWeight: "bold",
      fontFamily: fontType,
    },
    backButton: {
      padding: 8,
    },
    chatContainer: {
      flex: 1,
      paddingHorizontal: 10,
    },
    chatScrollContainer: {
      flex: 1,
      paddingBottom: 600,
    },
    chatBubble: {
      padding: 12,
      borderRadius: 12,
      marginVertical: 4,
      maxWidth: "75%",
      flexDirection: "row",
      alignItems: "flex-end",
    },
    userBubble: {
      alignSelf: "flex-end",
      backgroundColor: "#3A8BF5",
      gap: 15,
    },
    aiBubble: {
      alignSelf: "flex-start",
      backgroundColor: "#08326B",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    chatText: {
      color: "#fff",
      fontSize: fontSize ? parseInt(fontSize) - 2 : 14,
      fontFamily: fontType,
    },
    timeText: {
      color: "#FFFFFF",
      fontSize: 10,
      marginLeft: -5,
      fontFamily: fontType,
    },
    feedbackContainer: {
      flexDirection: "row",
      marginLeft: 10,
    },
    inputContainer: {
      position: "absolute",
      bottom: 20,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      width: "95%",
      paddingVertical: 5,
      backgroundColor: colors.buttonBackground,
      borderRadius: 20,
      marginBottom: 15,
      zIndex: 10,
    },
    input: {
      flex: 1,
      height: 40,
      paddingHorizontal: 12,
      color: colors.buttonText,
      fontFamily: fontType,
    },
    sendButton: {
      marginLeft: 10,
      backgroundColor: "#3A8BF5",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 15,
    },
    sendButtonText: {
      color: "#fff",
      fontSize: 14,
      fontFamily: fontType,
    },
    themeToggleButton: {
      position: "absolute",
      top: 15,
      right: 150,
      width: 35,
      height: 35,
      borderRadius: 17.5,
      backgroundColor: "rgba(217, 217, 217, 0.3)",
      justifyContent: "center",
      alignItems: "center",
    },
    darkImg: {
      width: 25,
      height: 25,
    },
    nextButton: {
      backgroundColor: "#4CAF50",
      padding: 6,
      borderRadius: 5,
      marginTop: 8,
      alignItems: "center",
    },
    nextButtonText: {
      color: "#fff",
      fontSize: 12,
      fontFamily: fontType,
    },
    tooltipText: {
      color: "#000",
      fontSize: 14,
      fontFamily: fontType,
      textAlign: "center",
      padding: 5,
    },
    tooltipContainer: {
      padding: 10,
      maxWidth: 180,
      backgroundColor: "#fff",
      borderRadius: 10,
    },
    messageListContainer: {
      flex: 1,
    },
    emptyChatContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyChatImage: {
      width: 150,
      height: 150,
      marginBottom: 15,
    },
    emptyChatText: {
      fontSize: fontSize ? parseInt(fontSize) : 18,
      color: "rgba(217, 217, 217, 0.9)",
      fontFamily: fontType,
      textAlign: "center",
    },
  }), [isDarkMode, fontSize, fontType]);

  const tourSteps = [
    {
      target: headerRef,
      content: "به صفحه‌ی هوش مصنوعی خوش اومدی!",
      position: "bottom",
    },
    {
      target: chatContainerRef,
      content: "اینجا می‌تونی تاریخچه‌ی چت رو ببینی!",
      position: "top",
    },
    {
      target: inputRef,
      content: "سوال دینی خودت رو اینجا بنویس و ارسال کن!",
      position: "top",
    },
  ];

  return (
    <LinearGradient colors={colors.background} style={styles.container}>
      <View style={styles.messageListContainer}>
        <WalkthroughTooltip
          isVisible={tourActive && !hasSeenTour && userWantsTour && tourStep === 0}
          content={
            <View style={styles.tooltipContainer}>
              <Text style={styles.tooltipText}>{tourSteps[0].content}</Text>
              <TouchableOpacity style={styles.nextButton} onPress={() => setTourStep(1)}>
                <Text style={styles.nextButtonText}>رفتن به راهنمای بعدی</Text>
              </TouchableOpacity>
            </View>
          }
          placement={tourSteps[0].position}
          onClose={() => setTourStep(1)}
          showChildInTooltip={false}
          tooltipStyle={{ backgroundColor: colors.headerBackground }}
          target={headerRef.current ? findNodeHandle(headerRef.current) : undefined}
        >
          <View style={styles.header} ref={headerRef}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={22} color={colors.buttonText} />
            </TouchableOpacity>
            <Text style={styles.headerText}>هوش مصنوعی</Text>
            <Animatable.View animation="bounceIn" duration={1000} style={styles.themeToggleButton}>
              <TouchableOpacity onPress={toggleTheme}>
                {isDarkMode ? (
                  <Image style={styles.darkImg} source={require("../../assets/images/icons8-sun-100.png")} />
                ) : (
                  <Image style={styles.darkImg} source={require("../../assets/images/icons8-moon-100.png")} />
                )}
              </TouchableOpacity>
            </Animatable.View>
          </View>
        </WalkthroughTooltip>

        <WalkthroughTooltip
          isVisible={tourActive && !hasSeenTour && userWantsTour && tourStep === 1}
          content={
            <View style={styles.tooltipContainer}>
              <Text style={styles.tooltipText}>{tourSteps[1].content}</Text>
              <TouchableOpacity style={styles.nextButton} onPress={() => setTourStep(2)}>
                <Text style={styles.nextButtonText}>رفتن به راهنمای بعدی</Text>
              </TouchableOpacity>
            </View>
          }
          placement={tourSteps[1].position}
          onClose={() => setTourStep(2)}
          showChildInTooltip={false}
          tooltipStyle={{ backgroundColor: colors.headerBackground }}
          target={chatContainerRef.current ? findNodeHandle(chatContainerRef.current) : undefined}
        >
          <View style={styles.chatContainer} ref={chatContainerRef}>
            <ScrollView style={styles.chatScrollContainer}>
              {chatHistory.length === 0 ? (
                renderEmptyChat()
              ) : (
                <FlatList
                  data={chatHistory}
                  renderItem={renderMessage}
                  keyExtractor={(item, index) => index.toString()}
                  inverted
                  ListEmptyComponent={renderEmptyChat}
                />
              )}
            </ScrollView>
          </View>
        </WalkthroughTooltip>
      </View>

      <WalkthroughTooltip
        isVisible={tourActive && !hasSeenTour && userWantsTour && tourStep === 2}
        content={
          <View style={styles.tooltipContainer}>
            <Text style={styles.tooltipText}>{tourSteps[2].content}</Text>
            <TouchableOpacity style={styles.nextButton} onPress={markTourAsSeen}>
              <Text style={styles.nextButtonText}>اتمام راهنما</Text>
            </TouchableOpacity>
          </View>
        }
        placement={tourSteps[2].position}
        onClose={markTourAsSeen}
        showChildInTooltip={false}
        tooltipStyle={{ backgroundColor: colors.headerBackground }}
        target={inputRef.current ? findNodeHandle(inputRef.current) : undefined}
      >
        <Animatable.View
          animation="fadeInUp"
          duration={1000}
          style={styles.inputContainer}
          ref={inputRef}
        >
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="سوال دینی خود را بپرسید..."
            placeholderTextColor={colors.buttonText}
          />
          <Animatable.View animation="pulse" iterationCount="infinite" duration={1500}>
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Text style={styles.sendButtonText}>ارسال</Text>
            </TouchableOpacity>
          </Animatable.View>
        </Animatable.View>
      </WalkthroughTooltip>
    </LinearGradient>
  );
};

export default AiScreen;