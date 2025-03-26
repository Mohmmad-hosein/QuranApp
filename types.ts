export interface Ayah {
    number: number;
    text: string;
    // سایر فیلدهای آیه (مثل ترجمه و تفسیر) رو اضافه کن
  }
  
  export interface Surah {
    number: number;
    name: string;
    name_fa : string;
    translation: Ayah[];
    numberOfAyahs: number;
    revelationType: string;
    ayahs: Ayah[];
    // سایر فیلدهای سوره
  }
  
  export type SortOrder = "asc-number" | "desc-number" | "asc" | "desc";