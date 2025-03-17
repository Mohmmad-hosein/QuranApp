import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "@/context/ThemeContext";
import { useSettings } from "@/context/SettingsContext";
import { mergedSurahs } from "@/utils/surahUtils";
import { translatePersian } from "@/assets/data/translatePersian";
import { surahs } from "@/assets/data/surahs"; // وارد کردن فایل surahs
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Animated } from "react-native";

const SurahDetails = () => {
  const navigation = useNavigation();
  const { params } = useRoute();
  const { surah: surahParam } = params as { surah: { name: string; numberOfAyahs: number; revelationType: string } };
  const { isDarkMode, toggleTheme } = useTheme();
  const { fontSize, fontType } = useSettings();
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollPosition, setScrollPosition] = useState<number>(0);

  // انیمیشن برای سوئیچ دارک مود
  const [spinValue] = useState(new Animated.Value(0));
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const animateToggle = () => {
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => toggleTheme());
  };

  const lightColors = {
    background: ["#5331DD", "#192163"],
    text: "#fff",
    card: "rgba(255, 255, 255, 0.2)",
    headerBackground: "rgba(255, 255, 255, 0.25)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  };

  const darkColors = {
    background: ["#251663", "#060817"],
    text: "#FFFFFF",
    card: "#08326B",
    headerBackground: "rgba(255, 255, 255, 0.25)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  };

  const colors = isDarkMode ? darkColors : lightColors;

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1 },
    header: {
      zIndex: 1000,
      backgroundColor: colors.headerBackground,
      width: width * 0.9,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 15,
      alignSelf: "center",
      borderRadius: 10,
      marginTop: 30,
      height: 80,
      borderWidth: 1,
      borderColor: colors.borderColor,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    headerText: {
      fontSize: fontSize ? parseInt(fontSize) : 24,
      color: colors.text,
      fontWeight: "bold",
      fontFamily: fontType,
    },
    backButton: {
      padding: 10,
    },
    themeToggleButton: {
      position: "absolute",
      top: 20,
      right: 130,
      width: 35,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(217, 217, 217, 0.2)",
      justifyContent: "center",
      alignItems: "center",
    },
    darkImg: {
      width: 27,
      height: 28,
    },
    content: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 15, flex: 1 },
    infoText: {
      fontSize: fontSize ? parseInt(fontSize) : 16,
      color: colors.text,
      fontFamily: fontType,
      marginVertical: 5,
    },
    ayahText: {
      fontSize: fontSize ? parseInt(fontSize) : 18,
      color: colors.text,
      fontFamily: fontType,
      textAlign: "right",
      marginVertical: 5,
    },
    translationText: {
      fontSize: fontSize ? parseInt(fontSize) - 2 : 16,
      color: colors.text,
      fontFamily: fontType,
      opacity: 0.8,
      textAlign: "right",
      marginVertical: 5,
    },
    tafsirText: {
      fontSize: fontSize ? parseInt(fontSize) : 16,
      color: colors.text,
      fontFamily: fontType,
      marginTop: 10,
      textAlign: "right",
    },
  }), [isDarkMode, fontSize, fontType]);

  // ذخیره موقعیت اسکرول در AsyncStorage
  const saveScrollPosition = async (position: number) => {
    try {
      await AsyncStorage.setItem(`scrollPosition_${surahParam.name}`, position.toString());
    } catch (error) {
      console.error("Error saving scroll position:", error);
    }
  };

  // بازیابی موقعیت اسکرول از AsyncStorage
  const loadScrollPosition = async () => {
    try {
      const position = await AsyncStorage.getItem(`scrollPosition_${surahParam.name}`);
      if (position) {
        setScrollPosition(parseFloat(position));
      }
    } catch (error) {
      console.error("Error loading scroll position:", error);
    }
  };

  // تنظیم موقعیت اسکرول هنگام لود صفحه
  useEffect(() => {
    loadScrollPosition();
  }, [surahParam.name]);

  // مدیریت اسکرول و ذخیره موقعیت
  const handleScroll = (event: any) => {
    const position = event.nativeEvent.contentOffset.y;
    setScrollPosition(position);
    saveScrollPosition(position);
  };

  // پیدا کردن اطلاعات سوره از surahs و translatePersian
  const surahDetails = surahs.find((s) => s.name === surahParam.name);
  const surahTranslation = translatePersian.find((s) => s.name === surahParam.name);

  if (!surahDetails || !surahTranslation) {
    return (
      <LinearGradient colors={colors.background} style={styles.container}>
        <Text style={styles.headerText}>سوره یافت نشد</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={colors.background} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerText}>{surahDetails.name}</Text>
        <TouchableOpacity style={styles.themeToggleButton} onPress={animateToggle}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            {isDarkMode ? (
              <Image
                style={styles.darkImg}
                source={require("../../assets/images/icons8-sun-100.png")}
              />
            ) : (
              <Image
                style={styles.darkImg}
                source={require("../../assets/images/icons8-moon-100.png")}
              />
            )}
          </Animated.View>
        </TouchableOpacity>
      </View>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={true}
        style={{ flex: 1 }}
        onLayout={() => {
          if (scrollViewRef.current && scrollPosition > 0) {
            scrollViewRef.current.scrollTo({ y: scrollPosition, animated: false });
          }
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.content}>
          <Text style={styles.infoText}>نام عربی: {surahDetails.name}</Text>
          <Text style={styles.infoText}>نام فارسی: {surahTranslation.name_fa}</Text>
          <Text style={styles.infoText}>نام انگلیسی: {surahDetails.englishName}</Text>
          <Text style={styles.infoText}>ترجمه نام انگلیسی: {surahDetails.englishNameTranslation}</Text>
          <Text style={styles.infoText}>تعداد آیات: {surahParam.numberOfAyahs}</Text>
          <Text style={styles.infoText}>محل نزول: {surahTranslation.revelationType || "نامشخص"}</Text>
          <Text style={styles.tafsirText}>
            تفسیر: {surahTranslation?.tafsir || "تفسیر موجود نیست"}
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const { width } = Dimensions.get("window");
export default SurahDetails;