import { surahs } from "@/assets/data/surahs";

export const mergeSurahs = () => {


  const surahMap = new Map<string, { number: number; name: string; englishName: string; englishNameTranslation: string; numberOfAyahs: number; revelationType: string; ayahs: Array<{ number: number; text: string }> }>();

  surahs.forEach(surah => {
    const key = `${surah.number}-${surah.name}`; // کلید یکتا برای هر سوره
    if (surahMap.has(key)) {
      // اگر سوره قبلاً وجود داره، آیاتش رو به سوره موجود اضافه کن
      const existingSurah = surahMap.get(key)!;
      existingSurah.ayahs = [...existingSurah.ayahs, ...surah.ayahs];
      existingSurah.numberOfAyahs = existingSurah.ayahs.length; // به‌روزرسانی تعداد آیات
    } else {
      // اگر سوره جدیده، اون رو اضافه کن
      surahMap.set(key, {
        ...surah,
        numberOfAyahs: surah.ayahs.length, // تنظیم تعداد آیات بر اساس آیات فعلی
      });
    }
  });

  return Array.from(surahMap.values()).sort((a, b) => a.number - b.number); // مرتب‌سازی بر اساس شماره سوره
};

// Export merged surahs
export const mergedSurahs = mergeSurahs();