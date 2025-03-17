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
  Dimensions,
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
import { surahs } from "@/assets/data/surahs"; // مسیر فایل surahs.ts
import { translatePersian } from "@/assets/data/translatePersian"; // مسیر فایل translatePersian.ts

// دیتابیس سوالات و جواب‌ها
const qaDatabase = [
  {
    question: "نماز صبح چند رکعت است؟",
    keywords: ["نماز صبح", "رکعت", "صبح"],
    answer: "نماز صبح دو رکعت است.",
  },
  {
    question: "وضو چگونه انجام می‌شود؟",
    keywords: ["وضو", "انجام", "چگونه"],
    answer: "برای وضو ابتدا نیت کنید، سپس دست‌ها را بشویید، دهان و بینی را شستشو دهید، صورت را بشویید، دست‌ها را تا آرنج بشویید، سر را مسح کنید و در نهایت پاها را تا مچ بشویید.",
  },
  {
    question: "حجاب در اسلام چیست؟",
    keywords: ["حجاب", "اسلام"],
    answer: "حجاب در اسلام به معنای پوشاندن بدن و موها برای زنان و رعایت پوشش مناسب برای مردان است.",
  },
  {
    question: "روزه چه فوایدی دارد؟",
    keywords: ["روزه", "فواید"],
    answer: "روزه فواید زیادی دارد، از جمله تقویت اراده، پاکسازی بدن و افزایش تقوا.",
  },
  {
    question: "غسل چیست؟",
    keywords: ["غسل"],
    answer: "غسل شستشوی کامل بدن است که در شرایطی مثل جنابت یا برای عبادات خاص انجام می‌شود.",
  },
  {
    question: "نمازهای یومیه چند تاست؟",
    keywords: ["نمازهای یومیه", "چند"],
    answer: "نمازهای یومیه پنج تاست: صبح، ظهر، عصر، مغرب و عشا.",
  },
  {
    question: "حکم زکات چیست؟",
    keywords: ["حکم", "زکات"],
    answer: "زکات بر افراد دارای نصاب مالی واجب است و به فقرا و نیازمندان داده می‌شود.",
  },
  {
    question: "حج چه زمانی واجب می‌شود؟",
    keywords: ["حج", "واجب"],
    answer: "حج برای کسی که استطاعت مالی و جسمی دارد، یک بار در عمر واجب است.",
  },
  {
    question: "خمس چیست؟",
    keywords: ["خمس"],
    answer: "خمس واجب مالی است که بر درآمدهای اضافی و برخی اموال تعلق می‌گیرد.",
  },
  {
    question: "ماه رمضان چه اهمیتی دارد؟",
    keywords: ["ماه رمضان", "اهمیت"],
    answer: "ماه رمضان ماه روزه‌داری و نزول قرآن است و شب قدر در آن قرار دارد.",
  },
  {
    question: "تیمم چیست؟",
    keywords: ["تیمم"],
    answer: "تیمم جایگزین وضو یا غسل است که با خاک و در نبود آب انجام می‌شود.",
  },
  {
    question: "نماز جماعت چه ثوابی دارد؟",
    keywords: ["نماز جماعت", "ثواب"],
    answer: "نماز جماعت ثواب بیشتری دارد و وحدت مسلمانان را تقویت می‌کند.",
  },
  {
    question: "حکم خوردن گوشت خوک چیست؟",
    keywords: ["حکم", "گوشت خوک"],
    answer: "خوردن گوشت خوک در اسلام حرام است.",
  },
  {
    question: "شب قدر چیست؟",
    keywords: ["شب قدر"],
    answer: "شب قدر شبی در ماه رمضان است که قرآن نازل شده و عبادت در آن ثواب زیاد دارد.",
  },
  {
    question: "جهاد چیست?",
    keywords: ["جهاد"],
    answer: "جهاد تلاش در راه خدا است و شامل جهاد با نفس و مالی می‌شود.",
  },
  {
    question: "سلام",
    keywords: ["سلام"],
    answer: "سلام دوست عزیز! خوش اومدی، امیدوارم راضی باشی.",
  },
  {
    question: "نماز ظهر چند رکعت است?",
    keywords: ["نماز ظهر", "رکعت"],
    answer: "نماز ظهر چهار رکعت است.",
  },
  {
    question: "نماز مغرب چند رکعت است?",
    keywords: ["نماز مغرب", "رکعت"],
    answer: "نماز مغرب سه رکعت است.",
  },
  {
    question: "نماز عشا چند رکعت است?",
    keywords: ["نماز عشا", "رکعت"],
    answer: "نماز عشا چهار رکعت است.",
  },
  {
    question: "قرآن چه زمانی نازل شد?",
    keywords: ["قرآن", "نازل"],
    answer: "قرآن در ماه رمضان و طی ۲۳ سال بر پیامبر نازل شد.",
  },
  {
    question: "عید فطر چیست?",
    keywords: ["عید فطر"],
    answer: "عید فطر پایان ماه رمضان است و با زکات فطره جشن گرفته می‌شود.",
  },
  {
    question: "عید قربان چیست?",
    keywords: ["عید قربان"],
    answer: "عید قربان در ذی‌الحجه برگزار می‌شود و یادآور قربانی حضرت ابراهیم است.",
  },
  {
    question: "حکم ربا چیست?",
    keywords: ["حکم", "ربا"],
    answer: "ربا در اسلام حرام است و گرفتن یا دادن سود اضافی در قرض‌ها ممنوع می‌باشد.",
  },
  {
    question: "نماز جمعه چیست?",
    keywords: ["نماز جمعه"],
    answer: "نماز جمعه عبادتی هفتگی است که به جای ظهر در روز جمعه برگزار می‌شود.",
  },
  {
    question: "توبه چیست?",
    keywords: ["توبه"],
    answer: "توبه بازگشت به سوی خدا با ندامت و تصمیم به ترک گناه است.",
  },
  {
    question: "صدقه چه فوایدی دارد?",
    keywords: ["صدقه", "فواید"],
    answer: "صدقه باعث برکت، دوری از بلا و نزدیکی به خدا می‌شود.",
  },
  {
    question: "نماز آیات چیست?",
    keywords: ["نماز آیات"],
    answer: "نماز آیات در زمان رخدادهای طبیعی مثل خورشیدگرفتگی واجب است.",
  },
  {
    question: "حج تمتع چیست?",
    keywords: ["حج تمتع"],
    answer: "حج تمتع نوعی حج است که با عمره همراه است و برای غیرمقیمین مکه انجام می‌شود.",
  },
  {
    question: "عمرۀ مفرده چیست?",
    keywords: ["عمرۀ مفرده"],
    answer: "عمرۀ مفرده عبادتی جدا از حج است که در زمان‌های دیگر سال انجام می‌شود.",
  },
  {
    question: "قرآن چه آثاری دارد?",
    keywords: ["قرآن", "آثار"],
    answer: "قرآن نور هدایت، شفای دل و راه سعادت است.",
  },
  {
    question: "نماز تراویح چیست?",
    keywords: ["نماز تراویح"],
    answer: "نماز تراویح نمازی مستحبی در ماه رمضان است که پس از عشا خوانده می‌شود.",
  },
  {
    question: "حکم موسیقی چیست?",
    keywords: ["حکم", "موسیقی"],
    answer: "حکم موسیقی بسته به نوع و محتوا متفاوت است و برخی انواع آن حرام شمرده می‌شود.",
  },
  {
    question: "روزه مستحبی چیست?",
    keywords: ["روزه مستحبی"],
    answer: "روزه مستحبی شامل روزه‌های داوطلبانه مثل روزه دحوالارض است.",
  },
  {
    question: "حکم دروغ چیست?",
    keywords: ["حکم", "دروغ"],
    answer: "دروغ در اسلام حرام است مگر در موارد خاص مثل آشتی دادن افراد.",
  },
  {
    question: "نماز وحشت چیست?",
    keywords: ["نماز وحشت"],
    answer: "نماز وحشت دو رکعت است که در زمان ترس یا نگرانی خوانده می‌شود.",
  },
  {
    question: "حکم قمار چیست?",
    keywords: ["حکم", "قمار"],
    answer: "قمار در اسلام حرام است و باعث ضرر مالی و اخلاقی می‌شود.",
  },
  {
    question: "ذکر صبح چیست?",
    keywords: ["ذکر صبح"],
    answer: "ذکر صبح شامل آیة الکرسی و برخی اذکار مستحبی است.",
  },
  {
    question: "حکم غیبت چیست?",
    keywords: ["حکم", "غیبت"],
    answer: "غیبت در اسلام حرام است و مانند خوردن گوشت برادر مؤمن شمرده می‌شود.",
  },
  {
    question: "نماز مستحبی چیست?",
    keywords: ["نماز مستحبی"],
    answer: "نماز مستحبی شامل نافله‌ها و نمازهای خاص مثل نماز شب است.",
  },
  {
    question: "حکم شرب خمر چیست?",
    keywords: ["حکم", "شرب خمر"],
    answer: "شرب خمر در اسلام حرام و دارای مجازات شدید است.",
  },
  {
    question: "سجده شکر چیست?",
    keywords: ["سجده شکر"],
    answer: "سجده شکر برای تشکر از نعمت‌های الهی انجام می‌شود.",
  },
  {
    question: "حکم رشوه چیست?",
    keywords: ["حکم", "رشوه"],
    answer: "رشوه در اسلام حرام است و گرفتن و دادن آن ممنوع است.",
  },
  {
    question: "نماز حاجت چیست?",
    keywords: ["نماز حاجت"],
    answer: "نماز حاجت دو رکعت است که برای برآورده شدن حاجت خوانده می‌شود.",
  },
  {
    question: "حکم طلاق چیست?",
    keywords: ["حکم", "طلاق"],
    answer: "طلاق در اسلام مجاز اما مکروه است و شرایط خاصی دارد.",
  },
  {
    question: "ذکر شب چیست?",
    keywords: ["ذکر شب"],
    answer: "ذکر شب شامل خواندن قرآن و دعاها در سحر است.",
  },
  {
    question: "حکم زنا چیست?",
    keywords: ["حکم", "زنا"],
    answer: "زنا در اسلام حرام و دارای مجازات شرعی است.",
  },
  {
    question: "نماز میت چیست?",
    keywords: ["نماز میت"],
    answer: "نماز میت برای طلب آمرزش مرده خوانده می‌شود و رکعت ندارد.",
  },
  {
    question: "حکم روزه در سفر چیست?",
    keywords: ["حکم", "روزه", "سفر"],
    answer: "روزه در سفر برای بیمار یا مسافر با شرایطی قضا می‌شود.",
  },
  {
    question: "استغفار چیست?",
    keywords: ["استغفار"],
    answer: "استغفار درخواست بخشش گناهان از خداست.",
  },
  {
    question: "نماز شب چگونه خوانده می‌شود?",
    keywords: ["نماز شب", "چگونه"],
    answer: "نماز شب یازده رکعت است که شامل نافله شب و نماز وتر می‌شود.",
  },
  {
    question: "حکم روزه مستحبی چیست?",
    keywords: ["حکم", "روزه مستحبی"],
    answer: "روزه مستحبی برای افراد سالم و بدون مانع جایز و مستحب است.",
  },
  {
    question: "دعای کمیل چیست?",
    keywords: ["دعای کمیل"],
    answer: "دعای کمیل دعایی است که در شب‌های جمعه برای آمرزش گناهان خوانده می‌شود.",
  },
  {
    question: "حکم خرید و فروش سلاح چیست?",
    keywords: ["حکم", "خرید و فروش سلاح"],
    answer: "خرید و فروش سلاح با قصد سوء حرام و بدون قصد مشروع جایز است.",
  },
  {
    question: "نماز استسقاء چیست?",
    keywords: ["نماز استسقاء"],
    answer: "نماز استسقاء برای طلب باران در زمان خشکسالی خوانده می‌شود.",
  },
  {
    question: "حکم روزه در بارداری چیست?",
    keywords: ["حکم", "روزه", "بارداری"],
    answer: "روزه در بارداری برای حفظ سلامت مادر و جنین قضا می‌شود.",
  },
  {
    question: "زکات فطره چگونه محاسبه می‌شود?",
    keywords: ["زکات فطره", "چگونه", "محاسبه"],
    answer: "زکات فطره بر اساس مقدار خوراک یک نفر برای یک روز محاسبه می‌شود.",
  },
  {
    question: "حکم کار در بانک ربوی چیست?",
    keywords: ["حکم", "کار", "بانک ربوی"],
    answer: "کار در بانک ربوی اگر شامل ربا باشد حرام است.",
  },
  {
    question: "نماز طواف چیست?",
    keywords: ["نماز طواف"],
    answer: "نماز طواف دو رکعت است که پس از طواف کعبه خوانده می‌شود.",
  },
  {
    question: "حکم ترک نماز چیست?",
    keywords: ["حکم", "ترک نماز"],
    answer: "ترک عمدی نماز واجب گناه کبیره و دارای مجازات است.",
  },
  {
    question: "دعای جوشن کبیر چیست?",
    keywords: ["دعای جوشن کبیر"],
    answer: "دعای جوشن کبیر دعایی طولانی با هزار نام خدا است که در ماه رمضان خوانده می‌شود.",
  },
  {
    question: "حکم استفاده از اینترنت چیست?",
    keywords: ["حکم", "اینترنت"],
    answer: "استفاده از اینترنت اگر با گناه همراه نباشد جایز است.",
  },
  {
    question: "نماز کسوف چیست?",
    keywords: ["نماز کسوف"],
    answer: "نماز کسوف در زمان گرفتگی خورشید خوانده می‌شود و دو رکعت است.",
  },
  {
    question: "حکم قرض الحسنه چیست?",
    keywords: ["حکم", "قرض الحسنه"],
    answer: "قرض الحسنه در اسلام مستحب و دارای ثواب است.",
  },
  {
    question: "سوره یاسین چه فوایدی دارد?",
    keywords: ["سوره یاسین", "فواید"],
    answer: "سوره یاسین برای آمرزش، برکت و آرامش دل مفید است.",
  },
  {
    question: "سوره الرحمن چه ویژگی‌هایی دارد؟",
    keywords: ["سوره الرحمن", "ویژگی", "قرآن"],
    answer: "سوره الرحمن به عنوان 'سوره رحمت' شناخته می‌شود و در آن بر نعمت‌های الهی تأکید شده است.",
  },
  {
    question: "چگونه می‌توانم دعاهای شبانه بخوانم؟",
    keywords: ["دعا", "شبانه", "خواندن"],
    answer: "برای خواندن دعاهای شبانه می‌توانید پس از اذان شب، در محیط آرام نشسته و از دعاهای سنتی بهره ببرید.",
  },
  {
    question: "مزایای اخلاق حسن در اسلام چیست؟",
    keywords: ["اخلاق حسن", "مزایا", "اسلام"],
    answer: "اخلاق حسن در اسلام باعث کسب ثواب، جلب رضایت الهی و ایجاد روابط سالم اجتماعی می‌شود.",
  },
  {
    question: "روش‌های افزایش تقوا در زندگی چیست؟",
    keywords: ["تقوا", "افزایش", "زندگی"],
    answer: "با خواندن قرآن، دعا، انجام اعمال خیریه و حفظ ارتباط با اهل علم می‌توان تقوا را افزایش داد.",
  },
  {
    question: "آداب معاشرت اسلامی چه هستند؟",
    keywords: ["آداب", "معاشرت", "اسلام"],
    answer: "آداب معاشرت در اسلام شامل صداقت، احترام به دیگران، گفتگوی محترمانه و رعایت حریم شخصی می‌شود.",
  },
  // اضافه کردن سوالات روزمره و خوش و بش
  {
    question: "چطور می‌توانم روزم را بهتر کنم؟",
    keywords: ["روز", "بهتر"],
    answer: "برای بهتر کردن روزت، می‌تونی با یه ذکر صبحگاهی شروع کنی، مثلاً «بسم الله الرحمن الرحیم» بگو و یه برنامه‌ریزی ساده برای کارهات داشته باش. ورزش صبحگاهی هم خیلی کمک می‌کنه!",
  },
  {
    question: "امروز چه کار کنم؟",
    keywords: ["امروز", "کار"],
    answer: "امروز می‌تونی یه کار خوب انجام بدی، مثلاً به یه نفر کمک کنی یا یه سوره از قرآن بخونی و درباره معنی‌ش فکر کنی. اگه وقت داری، یه پیاده‌روی کوتاه هم خیلی حالتو بهتر می‌کنه.",
  },
  {
    question: "خداحافظ",
    keywords: ["خداحافظ"],
    answer: "خداحافظ عزیزم! امیدوارم روز خوبی داشته باشی، اگه سوالی داشتی دوباره بیا پیشم.",
  },
  {
    question: "حالت چطوره؟",
    keywords: ["حالت", "چطور"],
    answer: "ممنون که پرسیدی! من یه هوش مصنوعی‌ام، حالم همیشه خوبه! تو چطوری؟",
  },
  {
    question: "اسم تو چیه؟",
    keywords: ["اسم", "تو"],
    answer: "من یه هوش مصنوعی‌ام که برای کمک به سوالات دینی و روزمره‌ت طراحی شدم. می‌تونی بهم بگی «دوست دینی»! اسم تو چیه؟",
  },
];

// تابع برای فرمت کردن زمان
const formatTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

// تابع برای نرمال‌سازی متن (حذف علامت‌های نگارشی و حروف خاص)
const normalizeText = (text: string) => {
  return text
    .toLowerCase()
    // حذف علامت‌های نگارشی
    .replace(/[،؛؟!.\-]/g, "")
    // نرمال‌سازی حروف عربی/فارسی (مثلاً تبدیل "نَ" به "ن")
    .replace(/[\u064B-\u065F]/g, "") // حذف اعراب (فتحه، کسره، ضمه و ...)
    .replace(/[\u061F-\u0621]/g, "") // حذف برخی حروف خاص (مثل همزه)
    .replace(/\s+/g, " ") // تبدیل چند فاصله به یک فاصله
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

// تابع بهبودیافته برای پیدا کردن جواب از دیتابیس
const findAnswer = (userInput: string) => {
  const normalizedInput = normalizeText(userInput);
  const inputWords = normalizedInput.split(" ");
  let bestMatch = null;
  let highestMatchCount = 0;

  for (const qa of qaDatabase) {
    const normalizedKeywords = qa.keywords.map(keyword => normalizeText(keyword));
    const matchCount = normalizedKeywords.filter(keyword =>
      inputWords.includes(keyword)
    ).length;

    if (matchCount > highestMatchCount) {
      highestMatchCount = matchCount;
      bestMatch = qa;
    }
  }

  return bestMatch ? bestMatch.answer : null;
};

// تابع بهبودیافته برای تولید جواب
const generateAnswer = (userInput: string) => {
  // بررسی سوالاتی که درباره تعداد تکرار کلمات در قرآن هستند
  const wordCountRegex = /(.*?)چند\s*بار\s*در\s*قرآن\s*تکرار\s*شده/;
  const wordCountMatch = userInput.match(wordCountRegex);
  if (wordCountMatch) {
    const word = wordCountMatch[1].trim();
    const count = countWordInQuran(word);
    return `کلمه «${word}» ${count} بار در قرآن تکرار شده است.`;
  }

  // بررسی سوالاتی که درباره معنی آیه هستند
  const ayahTranslationRegex = /آیه\s*(\d+)\s*در\s*سوره\s*(\d+)/;
  const ayahTranslationMatch = userInput.match(ayahTranslationRegex);
  if (ayahTranslationMatch) {
    const ayah = parseInt(ayahTranslationMatch[1], 10);
    const surah = parseInt(ayahTranslationMatch[2], 10);
    return getAyahTranslation(surah, ayah);
  }

  // بررسی سوالات دیتابیس
  const directAnswer = findAnswer(userInput);
  if (directAnswer) return directAnswer;

  // جستجوی پیشرفته‌تر
  const normalizedInput = normalizeText(userInput);
  const inputWords = normalizedInput.split(" ");
  const relatedAnswers = [];
  const keywordWeights = {};

  qaDatabase.forEach(qa => {
    qa.keywords.forEach(keyword => {
      const normalizedKeyword = normalizeText(keyword);
      if (inputWords.includes(normalizedKeyword)) {
        keywordWeights[normalizedKeyword] = (keywordWeights[normalizedKeyword] || 0) + 1;
      }
    });
  });

  qaDatabase.forEach(qa => {
    let totalWeight = 0;
    qa.keywords.forEach(keyword => {
      const normalizedKeyword = normalizeText(keyword);
      totalWeight += keywordWeights[normalizedKeyword] || 0;
    });
    if (totalWeight > 0) {
      relatedAnswers.push({ answer: qa.answer, weight: totalWeight });
    }
  });

  if (relatedAnswers.length > 0) {
    relatedAnswers.sort((a, b) => b.weight - a.weight);
    const topAnswers = relatedAnswers.slice(0, 2);
    return "بر اساس اطلاعاتی که دارم:\n" + topAnswers.map(a => `- ${a.answer}`).join("\n");
  } else {
    return "متأسفم، نمی‌تونم به این سوال پاسخ بدم. لطفاً سوال دیگه‌ای بپرس یا توی تنظیمات به بخش درباره ما مراجعه کن.";
  }
};

const AiScreen = () => {
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const { isDarkMode, toggleTheme } = useTheme();
  const { fontSize, fontType } = useSettings();
  const navigation = useNavigation();
  const { height: windowHeight } = useWindowDimensions(); // گرفتن ارتفاع پویای صفحه

  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const [userWantsTour, setUserWantsTour] = useState<boolean | null>(null);

  const headerRef = useRef<View>(null);
  const inputRef = useRef<View>(null);
  const chatContainerRef = useRef<View>(null);

  useEffect(() => {
    const checkTourStatus = async () => {
      try {
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
        console.error("Error checking tour status:", error);
      }
    };
    checkTourStatus();
  }, []);

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
      flex: 1, // استفاده از flex برای پر کردن فضای موجود
      paddingBottom: 600, // فاصله از inputContainer (بیشتر از ارتفاع تقریبی input)
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
      gap : 15
    },
    aiBubble: {
      alignSelf: "flex-start",
      backgroundColor: "#08326B",
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
      zIndex: 10, // اطمینان از اینکه بالای چت قرار می‌گیره
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

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const savedChat = await AsyncStorage.getItem("chatHistory");
        if (savedChat) {
          const parsedChat = JSON.parse(savedChat).map(msg => ({
            ...msg,
            timestamp: msg.timestamp || formatTime(),
          }));
          setChatHistory(parsedChat);
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    };
    loadChatHistory();
  }, []);

  const saveChatHistory = async (chat) => {
    try {
      await AsyncStorage.setItem("chatHistory", JSON.stringify(chat));
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
  
    const timestamp = formatTime();
    const userMessage = { role: "user", content: input, timestamp };
    const updatedChat = [...chatHistory, userMessage];
    setChatHistory(updatedChat);
    saveChatHistory(updatedChat);
  
    // نمایش یک پیام موقتی برای انیمیشن تایپینگ
    const typingMessage = { role: "assistant", content: "...", timestamp };
    setChatHistory(prev => [...prev, typingMessage]);
  
    // شبیه‌سازی تاخیر تایپینگ
    setTimeout(() => {
      const aiResponse = generateAnswer(input);
      const aiMessage = { role: "assistant", content: aiResponse, timestamp: formatTime() };
  
      // جایگزین کردن پیام تایپینگ با پاسخ واقعی
      setChatHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = aiMessage;
        saveChatHistory(newHistory);
        return newHistory;
      });
    }, 1000); // تاخیر ۱ ثانیه
  };
  

  const renderMessage = ({ item }) => (
    <Animatable.View
      animation={item.role === "user" ? "fadeInRight" : "fadeInLeft"}
      duration={500}
      style={[
        styles.chatBubble,
        item.role === "user" ? styles.userBubble : styles.aiBubble,
      ]}
    >
      <Text style={styles.chatText}>{item.content}</Text>
      <Text style={styles.timeText}>{item.timestamp}</Text>
    </Animatable.View>
  );

  const renderEmptyChat = () => (
    <View style={styles.emptyChatContainer}>
      <Image
        style={styles.emptyChatImage}
        source={require("../../assets/images/chat_empty.png")} // مسیر تصویر خالی رو جایگزین کن
        resizeMode="contain"
      />
      <Text style={styles.emptyChatText}>هنوز چتی وجود ندارد</Text>
    </View>
  );

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
                  ListEmptyComponent={renderEmptyChat} // نمایش وقتی لیست خالیه
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