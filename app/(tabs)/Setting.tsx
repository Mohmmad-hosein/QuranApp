import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Image,
  findNodeHandle,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useSettings } from "@/context/SettingsContext";
import { Animated } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage'; // برای ذخیره‌سازی
import WalkthroughTooltip from 'react-native-walkthrough-tooltip'; // برای تور

const SettingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isDarkMode, toggleTheme } = useTheme();
  const { fontSize, setFontSize, fontType, setFontType } = useSettings();

  // مدیریت تور
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const [userWantsTour, setUserWantsTour] = useState<boolean | null>(null); // وضعیت کلی تور

  // refs برای المان‌ها
  const headerRef = useRef<View>(null);
  const fontSizeRef = useRef<View>(null);
  const fontTypeRef = useRef<View>(null);
  const reportRef = useRef<View>(null);
  const aboutRef = useRef<View>(null);

  // مقدار انیمیشن برای دکمه تغییر تم
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

  // بررسی وضعیت کلی تور و تور این صفحه
  useEffect(() => {
    const checkTourStatus = async () => {
      try {
        const wantsTour = await AsyncStorage.getItem('userWantsTour');
        const seenTour = await AsyncStorage.getItem('hasSeenSettingTour');

        if (wantsTour !== null) {
          setUserWantsTour(wantsTour === 'true');
        }

        if (seenTour === 'true') {
          setHasSeenTour(true);
        } else if (wantsTour === 'true') {
          setTourActive(true); // تور فقط برای صفحاتی که ندیده نمایش داده می‌شه
        }
      } catch (error) {
        console.error("Error checking tour status:", error);
      }
    };
    checkTourStatus();
  }, []);

  // ذخیره وضعیت تور این صفحه
  const markTourAsSeen = async () => {
    try {
      await AsyncStorage.setItem('hasSeenSettingTour', 'true');
      setHasSeenTour(true);
      setTourActive(false);
      setTourStep(0);
    } catch (error) {
      console.error("Error saving tour status:", error);
    }
  };

  // ریست کردن وضعیت تور برای دیدن دوباره
  const resetTour = async () => {
    try {
      // ریست کردن تور همه صفحات
      await AsyncStorage.removeItem('hasSeenHomeTour');
      await AsyncStorage.removeItem('hasSeenSettingTour');
      await AsyncStorage.setItem('userWantsTour', 'true'); // کاربر می‌خواد تور رو ببینه
      setHasSeenTour(false);
      setUserWantsTour(true);
      setTourActive(true);
      setTourStep(0);
    } catch (error) {
      console.error("Error resetting tour status:", error);
    }
  };

  const lightColors = {
    background: ["#7253EF", "#192163"],
    buttonText: "#fff",
    buttonBackground: "rgba(255, 255, 255, 0.2)",
    headerBackground: "rgba(255, 255, 255, 0.25)",
  };

  const darkColors = {
    background: ["#251663", "#060817"],
    buttonText: "#FFFFFF",
    buttonBackground: "#08326B",
    headerBackground: "rgba(255, 255, 255, 0.25)",
  };

  const colors = isDarkMode ? darkColors : lightColors;

  const styles = useMemo(() => {
    return StyleSheet.create({
      container: {
        flex: 1,
      },
      header: {
        backgroundColor: colors.headerBackground,
        width: width * 0.9,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 15,
        marginBottom: 27,
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
      settingContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: width * 0.9,
        marginVertical: 10,
        backgroundColor: colors.buttonBackground,
        borderRadius: 10,
        padding: 15,
        alignSelf: "center",
        borderWidth: 1,
        borderColor: "#D9D9D9",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        height: 60,
      },
      label: {
        fontSize: fontSize ? parseInt(fontSize) : 18,
        color: colors.buttonText,
        fontFamily: fontType,
      },
      picker: {
        height: 50,
        width: "45%",
        color: colors.buttonText,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 15,
      },
      flatButton: {
        width: width * 0.9,
        marginVertical: 10,
        backgroundColor: colors.buttonBackground,
        borderRadius: 10,
        paddingVertical: 15,
        alignItems: "flex-end",
        padding: 20,
        alignSelf: "center",
        borderWidth: 1,
        borderColor: "#D9D9D9",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      flatButtonText: {
        fontSize: fontSize ? parseInt(fontSize) : 18,
        color: colors.buttonText,
        fontFamily: fontType,
      },
      themeToggleButton: {
        position: "absolute",
        top: 20,
        right: 120,
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
      resetTourButton: {
        width: width * 0.9,
        marginVertical: 10,
        backgroundColor: "#ff5555",
        borderRadius: 10,
        paddingVertical: 15,
        alignItems: "center",
        alignSelf: "center",
        borderWidth: 1,
        borderColor: "#D9D9D9",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      resetTourButtonText: {
        fontSize: fontSize ? parseInt(fontSize) : 18,
        color: "#fff",
        fontFamily: fontType,
      },
      nextButton: {
        backgroundColor: "#4CAF50",
        padding: 8,
        borderRadius: 5,
        marginTop: 8,
        alignItems: "center",
      },
      nextButtonText: {
        color: "#fff",
        fontSize: 14,
        fontFamily: fontType,
      },
      tooltipText: {
        color: "#000", // متن همیشه سیاه برای خوانایی
        fontSize: 16,
        fontFamily: fontType,
        textAlign: "center",
        padding: 5,
      },
      tooltipContainer: {
        padding: 10,
        maxWidth: 200,
      },
    });
  }, [isDarkMode, fontSize, fontType]);

  // تعریف مراحل تور (بدون دکمه تغییر تم)
  const tourSteps = [
    {
      target: headerRef,
      content: "اینجا تنظیمات اپ شماست!",
      position: "bottom",
    },
    {
      target: fontSizeRef,
      content: "اندازه فونت رو تنظیم کن!",
      position: "top",
    },
    {
      target: fontTypeRef,
      content: "نوع فونت رو انتخاب کن!",
      position: "top",
    },
    {
      target: reportRef,
      content: "گزارش‌ها رو اینجا ببین!",
      position: "top",
    },
    {
      target: aboutRef,
      content: "درباره ما اطلاعات بگیر!",
      position: "top",
    },
  ];

  return (
    <LinearGradient colors={colors.background} style={styles.container}>
      <ScrollView>
        {/* هدر */}
        <View style={styles.header} ref={headerRef}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color={colors.buttonText} />
          </TouchableOpacity>
          <Text style={styles.headerText}>تنظیمات</Text>
          <View style={styles.themeToggleButton}>
            <TouchableOpacity onPress={animateToggle}>
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
        </View>

        {/* تنظیم اندازه فونت */}
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
          tooltipStyle={{ backgroundColor: colors.buttonBackground }}
          target={fontSizeRef.current ? findNodeHandle(fontSizeRef.current) : undefined}
        >
          <View style={styles.settingContainer} ref={fontSizeRef}>
            <Picker
              selectedValue={fontSize}
              style={styles.picker}
              onValueChange={(itemValue) => setFontSize(itemValue)}
            >
              <Picker.Item label="14" value="14" />
              <Picker.Item label="18" value="18" />
              <Picker.Item label="20" value="20" />
              <Picker.Item label="24" value="24" />
            </Picker>
            <Text style={styles.label}>اندازه قلم</Text>
          </View>
        </WalkthroughTooltip>

        {/* تنظیم نوع فونت */}
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
          tooltipStyle={{ backgroundColor: colors.buttonBackground }}
          target={fontTypeRef.current ? findNodeHandle(fontTypeRef.current) : undefined}
        >
          <View style={styles.settingContainer} ref={fontTypeRef}>
            <Picker
              selectedValue={fontType}
              style={styles.picker}
              onValueChange={(itemValue) => setFontType(itemValue)}
            >
              <Picker.Item label="ایران سنس" value="ایران سنس" />
              <Picker.Item label="نازنین" value="نازنین" />
              <Picker.Item label="بی‌نازنین" value="بی‌نازنین" />
            </Picker>
            <Text style={styles.label}>نوع فونت</Text>
          </View>
        </WalkthroughTooltip>

        {/* گزارش */}
        <WalkthroughTooltip
          isVisible={tourActive && !hasSeenTour && userWantsTour && tourStep === 2}
          content={
            <View style={styles.tooltipContainer}>
              <Text style={styles.tooltipText}>{tourSteps[2].content}</Text>
              <TouchableOpacity style={styles.nextButton} onPress={() => setTourStep(3)}>
                <Text style={styles.nextButtonText}>رفتن به راهنمای بعدی</Text>
              </TouchableOpacity>
            </View>
          }
          placement={tourSteps[2].position}
          onClose={() => setTourStep(3)}
          showChildInTooltip={false}
          tooltipStyle={{ backgroundColor: colors.buttonBackground }}
          target={reportRef.current ? findNodeHandle(reportRef.current) : undefined}
        >
          <TouchableOpacity style={styles.flatButton} ref={reportRef}>
            <Text style={styles.flatButtonText}>گزارش</Text>
          </TouchableOpacity>
        </WalkthroughTooltip>

        {/* درباره ما */}
        <WalkthroughTooltip
          isVisible={tourActive && !hasSeenTour && userWantsTour && tourStep === 3}
          content={
            <View style={styles.tooltipContainer}>
              <Text style={styles.tooltipText}>{tourSteps[3].content}</Text>
              <TouchableOpacity style={styles.nextButton} onPress={() => setTourStep(4)}>
                <Text style={styles.nextButtonText}>رفتن به راهنمای بعدی</Text>
              </TouchableOpacity>
            </View>
          }
          placement={tourSteps[3].position}
          onClose={() => setTourStep(4)}
          showChildInTooltip={false}
          tooltipStyle={{ backgroundColor: colors.buttonBackground }}
          target={aboutRef.current ? findNodeHandle(aboutRef.current) : undefined}
        >
          <TouchableOpacity style={styles.flatButton} ref={aboutRef}>
            <Text style={styles.flatButtonText}>درباره ما</Text>
          </TouchableOpacity>
        </WalkthroughTooltip>

        {/* دکمه دیدن دوباره راهنما */}
        <WalkthroughTooltip
          isVisible={tourActive && !hasSeenTour && userWantsTour && tourStep === 4}
          content={
            <View style={styles.tooltipContainer}>
              <Text style={styles.tooltipText}>برای دیدن دوباره راهنما اینجا کلیک کن!</Text>
              <TouchableOpacity style={styles.nextButton} onPress={markTourAsSeen}>
                <Text style={styles.nextButtonText}>اتمام راهنما</Text>
              </TouchableOpacity>
            </View>
          }
          placement="top"
          onClose={markTourAsSeen}
          showChildInTooltip={false}
          tooltipStyle={{ backgroundColor: colors.buttonBackground }}
          target={aboutRef.current ? findNodeHandle(aboutRef.current) : undefined}
        >
          <TouchableOpacity style={styles.resetTourButton} onPress={resetTour}>
            <Text style={styles.resetTourButtonText}>دیدن دوباره راهنما</Text>
          </TouchableOpacity>
        </WalkthroughTooltip>
      </ScrollView>
    </LinearGradient>
  );
};

const { width } = Dimensions.get("window");

export default SettingScreen;