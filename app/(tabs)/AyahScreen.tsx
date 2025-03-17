import React, { useMemo, useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useSettings } from "@/context/SettingsContext";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import { Surah, Ayah } from "@/types";
import { translatePersian } from "@/assets/data/translatePersian";
import { Animated } from "react-native";
import { surahs } from "@/assets/data/surahs";

type AyahScreenRouteProp = RouteProp<{ AyahScreen: { surah: Surah } }, "AyahScreen">;

const AyahScreen = () => {
  const { surah: receivedSurah } = useRoute<AyahScreenRouteProp>().params;
  const { isDarkMode, toggleTheme } = useTheme();
  const { fontSize, fontType, setFontSize, setFontType } = useSettings();
  const navigation = useNavigation();

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

  // پیدا کردن سوره‌ی اصلی از surahs و ادغام آیات
  const [mergedSurah, setMergedSurah] = useState<Surah | null>(null);
  const [translatedAyahs, setTranslatedAyahs] = useState<Ayah[]>([]);

  useEffect(() => {
    // پیدا کردن همه‌ی سوره‌هایی که نامشون با سوره‌ی دریافت‌شده مطابقت داره
    const matchingSurahs = surahs.filter(s => s.name === receivedSurah.name);

    if (matchingSurahs.length > 0) {
      // ادغام آیات همه‌ی سوره‌های پیدا شده
      const mergedAyahs = matchingSurahs.reduce((acc: Ayah[], current: Surah) => {
        return [...acc, ...current.ayahs];
      }, []);

      // ساختن سوره‌ی ادغام‌شده
      const merged: Surah = {
        ...matchingSurahs[0], // اطلاعات پایه رو از اولین سوره می‌گیریم
        ayahs: mergedAyahs,
        numberOfAyahs: mergedAyahs.length,
      };

      setMergedSurah(merged);
    } else {
      // اگه سوره پیدا نشد، از سوره‌ی دریافت‌شده استفاده کن
      setMergedSurah(receivedSurah);
    }
  }, [receivedSurah]);

  // ترکیب آیات با ترجمه
  useEffect(() => {
    if (!mergedSurah) return;

    const surahTranslation = translatePersian.find(
      (t) => t.number === mergedSurah.number
    );
    if (surahTranslation) {
      const combinedAyahs = mergedSurah.ayahs.map((ayah) => {
        const translation = surahTranslation.translation.find(
          (t) => t.number === ayah.number
        );
        return {
          ...ayah,
          translation: translation ? translation.text : "ترجمه در دسترس نیست",
        };
      });
      setTranslatedAyahs(combinedAyahs);
    } else {
      setTranslatedAyahs(mergedSurah.ayahs);
    }
  }, [mergedSurah]);

  const lightColors = {
    background: ["#5331DD", "#192163"],
    buttonText: "#fff",
    headerBackground: "rgba(255, 255, 255, 0.25)",
    borderColor: "rgb(255, 255, 255)",
    resultItemBackground: "rgba(105, 166, 245, 0.3)",
    translationTextColor: "#FFFFFF",
  };

  const darkColors = {
    background: ["#251663", "#060817"],
    buttonText: "#FFFFFF",
    headerBackground: "rgba(255, 255, 255, 0.25)",
    borderColor: "rgb(255, 255, 255)",
    resultItemBackground: "#08326B",
    translationTextColor: "#D3D3D3",
  };

  const colors = isDarkMode ? darkColors : lightColors;

  const styles = useMemo(() => {
    return StyleSheet.create({
      container: { flex: 1 },
      header: {
        backgroundColor: colors.headerBackground,
        width: width * 0.9,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 15,
        marginBottom: 20,
        alignSelf: "center",
        borderRadius: 10,
        marginTop: 30,
        height: 80,
      },
      headerText: {
        fontSize: fontSize ? parseInt(fontSize) : 24,
        color: colors.buttonText,
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
      resultsContainer: {
        width: width * 0.9,
        alignSelf: "center",
      },
      resultItem: {
        backgroundColor: colors.resultItemBackground,
        padding: 15,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: colors.borderColor,
        marginBottom: 10,
      },
      resultText: {
        color: colors.buttonText,
        fontSize: fontSize ? parseInt(fontSize) : 22,
        fontFamily: fontType,
        textAlign: "right",
      },
      translationText: {
        color: colors.translationTextColor,
        fontSize: fontSize ? parseInt(fontSize) - 4 : 18,
        fontFamily: fontType,
        textAlign: "right",
        marginTop: 5,
        fontStyle: "italic",
      },
    });
  }, [isDarkMode, fontSize, fontType]);

  const renderAyah = ({ item }: { item: Ayah }) => (
    <View style={styles.resultItem}>
      <Text style={styles.resultText}>
        {`${item.number}. ${item.text}`}
      </Text>
      {item.translation && (
        <Text style={styles.translationText}>{item.translation}</Text>
      )}
    </View>
  );

  if (!mergedSurah) {
    return (
      <LinearGradient colors={colors.background} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color={colors.buttonText} />
          </TouchableOpacity>
          <Text style={styles.headerText}>در حال بارگذاری...</Text>
        </View>
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
          <Feather name="arrow-left" size={24} color={colors.buttonText} />
        </TouchableOpacity>
        <Text style={styles.headerText}>{mergedSurah.name}</Text>
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
      <FlatList
        data={translatedAyahs}
        renderItem={renderAyah}
        keyExtractor={(item: Ayah) => item.number.toString()}
        contentContainerStyle={styles.resultsContainer}
      />
    </LinearGradient>
  );
};

const { width } = Dimensions.get("window");
export default AyahScreen;