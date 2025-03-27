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
import { synonymDictionary } from "@/assets/data/synonymDictionary";
import { quranFacts } from "@/assets/data/quranFacts";

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
    const matchScore = calculateMatchScore(keywords, entry.keywords, false); // بدون کلمات مرتبط برای جستجوی دقیق
    if (matchScore > highestMatchScore && matchScore >= 0.7) { // کاهش آستانه به 0.7 برای استفاده از لِوِنشاین
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
    const matchScore = calculateMatchScore(keywords, entry.keywords, true); // با کلمات مرتبط
    if (matchScore >= 0.3) {
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
  const MAX_HISTORY_SIZE = 100;
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
      // محدود کردن chatHistory و questionHistory
      const limitedChatHistory = chatHistory.slice(-MAX_HISTORY_SIZE);
      const limitedQuestionHistory = questionHistory.slice(-MAX_HISTORY_SIZE);
  
      await AsyncStorage.setItem("dynamicDatabase", JSON.stringify(database));
      await AsyncStorage.setItem("chatHistory", JSON.stringify(limitedChatHistory));
      await AsyncStorage.setItem("questionHistory", JSON.stringify(limitedQuestionHistory));
      await AsyncStorage.setItem("newQuestions", JSON.stringify(newQuestions));
      await AsyncStorage.setItem("feedbackLog", JSON.stringify(feedbackLog));
      if (preferredStyle) {
        await AsyncStorage.setItem("preferredStyle", preferredStyle);
      }
    } catch (error) {
      console.error("Error saving data:", error);
      // اطلاع‌رسانی به کاربر
      setChatHistory(prev => [
        ...prev,
        {
          role: "assistant",
          content: "متأسفم، مشکلی در ذخیره‌سازی پیام‌ها پیش اومد. لطفاً دوباره امتحان کن.",
          timestamp: formatTime(),
        },
      ]);
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

  // تابع برای تشخیص سوال ریاضی
const isMathQuestion = (question: string): boolean => {
  const normalizedQuestion = normalizeText(question);

  // الگوهای عددی (مثل 2 + 3)
  const numericMathRegex = /(\d+\s*[\+\-\*\/]\s*\d+)/;
  // الگوهای حرفی (مثل "سه به توان دو" یا "دو جمع پنج")
  const verbalMathRegex = /(چند|حل|محاسبه|جواب|معادله|به توان|جمع|تفریق|ضرب|تقسیم|مسئله)/i;
  // الگوهای معادلات (مثل x + 5 = 10)
  const equationRegex = /[a-zA-Z]\s*[\+\-\*\/]\s*\d+\s*=\s*\d+/;

  return (
    numericMathRegex.test(normalizedQuestion) ||
    verbalMathRegex.test(normalizedQuestion) ||
    equationRegex.test(normalizedQuestion)
  );
};

// دیکشنری برای تبدیل اعداد حرفی به عددی
const numberWordsToDigits: { [key: string]: number } = {
  "صفر": 0,
  "یک": 1,
  "دو": 2,
  "سه": 3,
  "چهار": 4,
  "پنج": 5,
  "شش": 6,
  "هفت": 7,
  "هشت": 8,
  "نه": 9,
  "ده": 10,
};

// دیکشنری برای تبدیل عملیات حرفی به نمادها
const operationWordsToSymbols: { [key: string]: string } = {
  "جمع": "+",
  "به علاوه": "+", 
  "به اضافه": "+",
  "تفریق": "-",
  "منها": "-", 
  "ضرب": "*",
  "در": "*", 
  "تقسیم": "/",
  "بر": "/", 
  "به توان": "^",
  "توان": "^", 
};

// تابع برای تبدیل سوال حرفی به معادل عددی
// تابع برای تبدیل سوال حرفی به معادل عددی
const convertVerbalMathToNumeric = (question: string): string => {
  let converted = normalizeText(question);

  // تبدیل اعداد حرفی به عددی
  Object.keys(numberWordsToDigits).forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, "g"); // فقط کلمات مستقل رو جایگزین کن
    converted = converted.replace(regex, numberWordsToDigits[word].toString());
  });

  // تبدیل عملیات حرفی به نمادها
  let hasOperation = false;
  Object.keys(operationWordsToSymbols).forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, "g");
    if (regex.test(converted)) {
      hasOperation = true;
    }
    converted = converted.replace(regex, operationWordsToSymbols[word]);
  });

  // اگر هیچ عملگری پیدا نشد، خطا برگردون
  if (!hasOperation && !converted.match(/[\+\-\*\/\^]/)) {
    throw new Error("عملگر ریاضی پیدا نشد. لطفاً از کلماتی مثل 'جمع'، 'ضرب'، 'در'، 'تقسیم' یا 'به توان' استفاده کنید.");
  }

  return converted;
};

// تابع برای حل مسائل ریاضی
// تابع برای حل مسائل ریاضی
const solveMathProblem = (expression: string): { result: number | string; steps: string[] } => {
  try {
    let steps: string[] = [];

    // بررسی معادلات (مثل x + 5 = 10)
    const equationMatch = expression.match(/([a-zA-Z])\s*([\+\-\*\/])\s*(\d+)\s*=\s*(\d+)/);
    if (equationMatch) {
      const variable = equationMatch[1];
      const operator = equationMatch[2];
      const num1 = parseFloat(equationMatch[3]);
      const num2 = parseFloat(equationMatch[4]);

      let result: number;
      steps.push(`معادله: ${variable} ${operator} ${num1} = ${num2}`);

      switch (operator) {
        case "+":
          result = num2 - num1;
          steps.push(`برای حل ${variable}: ${variable} = ${num2} - ${num1}`);
          steps.push(`${variable} = ${result}`);
          break;
        case "-":
          result = num2 + num1;
          steps.push(`برای حل ${variable}: ${variable} = ${num2} + ${num1}`);
          steps.push(`${variable} = ${result}`);
          break;
        case "*":
          result = num2 / num1;
          steps.push(`برای حل ${variable}: ${variable} = ${num2} / ${num1}`);
          steps.push(`${variable} = ${result}`);
          break;
        case "/":
          result = num2 * num1;
          steps.push(`برای حل ${variable}: ${variable} = ${num2} * ${num1}`);
          steps.push(`${variable} = ${result}`);
          break;
        default:
          return { result: "عملگر ناشناخته", steps: [] };
      }

      return { result, steps };
    }

    // تبدیل سوال حرفی به عددی
    let convertedExpression = convertVerbalMathToNumeric(expression);

    // جایگزینی ^ با ** برای توان
    convertedExpression = convertedExpression.replace(/\^/g, "**");

    // بررسی ترتیب عملیات (اولویت ضرب و تقسیم، سپس جمع و تفریق)
    const tokens = convertedExpression.split(/\s+/);
    let currentExpression = tokens.join(" ");

    // حل مرحله به مرحله
    steps.push(`عبارت: ${currentExpression}`);

    // ابتدا ضرب و تقسیم
    let i = 0;
    while (i < tokens.length) {
      if (tokens[i] === "*" || tokens[i] === "/") {
        const left = parseFloat(tokens[i - 1]);
        const right = parseFloat(tokens[i + 1]);
        if (isNaN(left) || isNaN(right)) {
          throw new Error("یکی از مقادیر عددی نیست. لطفاً سوال را بررسی کنید.");
        }

        let result: number;
        if (tokens[i] === "*") {
          result = left * right;
          steps.push(`مرحله ${steps.length}: ${left} * ${right} = ${result}`);
        } else {
          if (right === 0) throw new Error("تقسیم بر صفر ممکن نیست");
          result = left / right;
          steps.push(`مرحله ${steps.length}: ${left} / ${right} = ${result}`);
        }

        tokens.splice(i - 1, 3, result.toString());
        currentExpression = tokens.join(" ");
        steps.push(`عبارت جدید: ${currentExpression}`);
        i = 0; // از ابتدا شروع کن
      } else {
        i++;
      }
    }

    // سپس جمع و تفریق
    i = 0;
    while (i < tokens.length) {
      if (tokens[i] === "+" || tokens[i] === "-") {
        const left = parseFloat(tokens[i - 1]);
        const right = parseFloat(tokens[i + 1]);
        if (isNaN(left) || isNaN(right)) {
          throw new Error("یکی از مقادیر عددی نیست. لطفاً سوال را بررسی کنید.");
        }

        let result: number;
        if (tokens[i] === "+") {
          result = left + right;
          steps.push(`مرحله ${steps.length}: ${left} + ${right} = ${result}`);
        } else {
          result = left - right;
          steps.push(`مرحله ${steps.length}: ${left} - ${right} = ${result}`);
        }

        tokens.splice(i - 1, 3, result.toString());
        currentExpression = tokens.join(" ");
        steps.push(`عبارت جدید: ${currentExpression}`);
        i = 0; // از ابتدا شروع کن
      } else {
        i++;
      }
    }

    // حل توان
    if (convertedExpression.includes("**")) {
      const result = eval(convertedExpression); // استفاده از eval برای توان (با احتیاط)
      if (isNaN(result)) {
        throw new Error("خطا در محاسبه توان. لطفاً سوال را بررسی کنید.");
      }
      steps.push(`حل توان: ${convertedExpression} = ${result}`);
      return { result, steps };
    }

    const finalResult = parseFloat(tokens[0]);
    if (isNaN(finalResult)) {
      throw new Error("نتیجه نهایی قابل محاسبه نیست. لطفاً سوال را بررسی کنید.");
    }
    steps.push(`جواب نهایی: ${finalResult}`);

    return { result: finalResult, steps };
  } catch (error) {
    return { result: `خطا: ${error.message}`, steps: [] };
  }
};

  // تغییر تابع generateAnswer برای حذف پیشنهاد سوال مرتبط
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
  
    // بررسی سوالات ریاضی
    if (isMathQuestion(userInput)) {
      const { result, steps } = solveMathProblem(userInput);
      const response = `**جواب:** ${result}\n\n**مراحل حل:**\n${steps.join("\n")}\n\nاز خدا بخواه کمکت کنه که مسائل رو بهتر بفهمی (سوره طه، آیه ۱۱۴).`;
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
        // بررسی اینکه آیا بخش ریاضی است
        if (isMathQuestion(part)) {
          const { result, steps } = solveMathProblem(part);
          const response = `**جواب:** ${result}\n\n**مراحل حل:**\n${steps.join("\n")}`;
          responses.push(`**پاسخ به بخش ${index + 1} (${part}):** ${response}`);
        } else {
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

  // تابع بهبودیافته برای پیدا کردن کلمات مرتبط
  const findRelatedKeywords = (keyword: string): string[] => {
    const related = synonymDictionary[keyword] || [];
    // اضافه کردن مترادف‌های خودکار برای کلمات مشابه
    const additionalRelated: string[] = [];
    Object.keys(synonymDictionary).forEach(key => {
      if (synonymDictionary[key].includes(keyword)) {
        additionalRelated.push(key, ...synonymDictionary[key]);
      }
    });
    return [...new Set([...related, ...additionalRelated])]; // حذف تکراری‌ها
  };

  // تابع محاسبه فاصله لِوِنشاین برای مقایسه شباهت دو رشته
  const levenshteinDistance = (a: string, b: string): number => {
    const matrix: number[][] = [];

    // مقداردهی اولیه ماتریس
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    // پر کردن ماتریس
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // جایگزینی
            matrix[i][j - 1] + 1,     // درج
            matrix[i - 1][j] + 1      // حذف
          );
        }
      }
    }

    return matrix[b.length][a.length];
  };

  // تابع بهبودیافته برای محاسبه امتیاز تطابق
  const calculateMatchScore = (inputKeywords: string[], dbKeywords: string[], includeRelated: boolean = false) => {
    let allInputKeywords = [...inputKeywords];
    if (includeRelated) {
      inputKeywords.forEach(keyword => {
        const related = findRelatedKeywords(keyword);
        allInputKeywords = [...allInputKeywords, ...related];
      });
    }

    let totalScore = 0;
    let matchedCount = 0;

    allInputKeywords.forEach(inputKeyword => {
      let bestMatchScore = 0;
      dbKeywords.forEach(dbKeyword => {
        // محاسبه فاصله لِوِنشاین
        const distance = levenshteinDistance(inputKeyword, dbKeyword);
        const maxLength = Math.max(inputKeyword.length, dbKeyword.length);
        const similarity = 1 - distance / maxLength; // شباهت بین 0 و 1
        if (similarity > bestMatchScore) {
          bestMatchScore = similarity;
        }
      });

      if (bestMatchScore > 0.7) { // آستانه شباهت
        matchedCount++;
        totalScore += bestMatchScore;
      }
    });

    return matchedCount > 0 ? totalScore / allInputKeywords.length : 0;
  };

  // تابع برای تقسیم سوال به بخش‌ها
  // تابع بهبودیافته برای تقسیم سوال به بخش‌ها
  const splitQuestion = (question: string): string[] => {
    const normalizedQuestion = normalizeText(question);
    // کلمات ربطی و عبارات جداکننده
    const separators = /(و|یا|ولی|اما|همچنین|به علاوه|از طرفی|در حالی که|چون|زیرا|اگر|تا|وقتی که)\s+/i;
    const parts = normalizedQuestion
      .split(separators)
      .map(part => part.trim())
      .filter(part => part.length > 0);

    // فیلتر کردن بخش‌هایی که خیلی کوتاه یا بی‌معنی هستند
    const meaningfulParts = parts.filter(part => {
      const words = part.split(" ");
      return words.length > 1 || (words.length === 1 && words[0].length > 3);
    });

    // اگر هیچ بخش معناداری پیدا نشد، کل سوال رو برگردون
    if (meaningfulParts.length === 0) {
      return [normalizedQuestion];
    }

    return meaningfulParts;
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