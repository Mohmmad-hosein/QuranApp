import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  findNodeHandle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import * as Animatable from "react-native-animatable";
import { useTheme } from "@/context/ThemeContext";
import { useSettings } from "@/context/SettingsContext";
import AsyncStorage from '@react-native-async-storage/async-storage'; // برای ذخیره‌سازی
import WalkthroughTooltip from 'react-native-walkthrough-tooltip'; // برای تور

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isDarkMode, toggleTheme } = useTheme();
  const { fontSize, fontType } = useSettings();

  // مدیریت تور
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const [userWantsTour, setUserWantsTour] = useState<boolean | null>(null);
  const [showTourPrompt, setShowTourPrompt] = useState(false); // برای پرسش اولیه

  // refs برای المان‌ها
  const circleRef = useRef<View>(null);
  const aiButtonRef = useRef<View>(null);
  const quranButtonRef = useRef<View>(null);
  const settingsButtonRef = useRef<View>(null);
  const favoritesButtonRef = useRef<View>(null);

  // بررسی وضعیت کلی تور و تور این صفحه
  useEffect(() => {
    const checkTourStatus = async () => {
      try {
        const wantsTour = await AsyncStorage.getItem('userWantsTour');
        const seenTour = await AsyncStorage.getItem('hasSeenHomeTour');

        if (wantsTour === null) {
          setShowTourPrompt(true); // فقط توی HomeScreen از کاربر پرسیده می‌شه
        } else {
          setUserWantsTour(wantsTour === 'true');
          if (seenTour === 'true') {
            setHasSeenTour(true);
          } else if (wantsTour === 'true') {
            setTourActive(true);
          }
        }
      } catch (error) {
        console.error("Error checking tour status:", error);
      }
    };
    checkTourStatus();
  }, []);

  // ذخیره وضعیت کلی تور
  const setTourPreference = async (wantsTour: boolean) => {
    try {
      await AsyncStorage.setItem('userWantsTour', wantsTour.toString());
      setUserWantsTour(wantsTour);
      setShowTourPrompt(false);
      if (wantsTour) {
        setTourActive(true);
      } else {
        setTourActive(false);
      }
    } catch (error) {
      console.error("Error setting tour preference:", error);
    }
  };

  // ذخیره وضعیت تور این صفحه
  const markTourAsSeen = async () => {
    try {
      await AsyncStorage.setItem('hasSeenHomeTour', 'true');
      setHasSeenTour(true);
      setTourActive(false);
      setTourStep(0);
    } catch (error) {
      console.error("Error saving tour status:", error);
    }
  };



  const lightColors = {
    background: ["#7253EF", "#192163"],
    buttonBackground: "#3A8BF5",
    buttonText: "#fff",
    circleBackground: "rgba(255, 255, 255, 0.2)",
  };

  const darkColors = {
    background: ["#251663", "#060817"],
    buttonBackground: "#08326B",
    buttonText: "#FFFFFF",
    circleBackground: "rgba(255, 255, 255, 0.2)",
  };

  const colors = isDarkMode ? darkColors : lightColors;

  const styles = useMemo(() => {
    return StyleSheet.create({
      container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 50,
        backgroundColor: colors.background[0],
      },
      circle: {
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: (width * 0.8) / 2,
        backgroundColor: colors.circleBackground,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 30,
      },
      quranImage: {
        width: width * 0.7,
        height: height * 0.5,
        resizeMode: "contain",
      },
      buttonContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
      },
      button: {
        width: width * 0.35,
        height: width * 0.35,
        margin: 10,
        borderWidth: 1,
        borderColor: "#D9D9D9",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        backgroundColor: colors.buttonBackground,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
      },
      buttonContent: {
        justifyContent: "center",
        alignItems: "center",
      },
      buttonText: {
        color: colors.buttonText,
        fontSize: fontSize ? parseInt(fontSize) : 16,
        fontFamily: fontType,
        textAlign: "center",
        marginBottom: 5,
      },
      buttonImg: {
        width: 44,
        height: 44,
        marginTop: 5,
      },
      themeToggleButton: {
        position: "absolute",
        top: 40,
        right: 20,
        width: 35,
        height: 36,
        borderRadius: (width * 0.8) / 2,
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
        color: "#000", // متن سیاه برای خوانایی روی پس‌زمینه روشن
        fontSize: 16,
        fontFamily: fontType,
        textAlign: "center",
        padding: 5,
      },
      tooltipContainer: {
        padding: 10,
        maxWidth: 200,
      },
      skipButtonText: {
        color: "#fff",
        fontSize: 14,
        fontFamily: fontType,
      },
      skipButton: {
        backgroundColor: "#ff5555",
        padding: 8,
        borderRadius: 5,
        marginTop: 8,
        alignItems: "center",
      },
    });
  }, [isDarkMode, fontSize, fontType]);

  // تعریف مراحل تور
  const tourSteps = [
    {
      target: circleRef,
      content: "به اپ قرآن خوش اومدی!",
      position: "bottom",
    },
    {
      target: aiButtonRef,
      content: "با هوش مصنوعی کار کن!",
      position: "top",
    },
    {
      target: quranButtonRef,
      content: "سوره‌ها رو اینجا ببین!",
      position: "top",
    },
    {
      target: settingsButtonRef,
      content: "تنظیمات رو اینجا تغییر بده!",
      position: "top",
    },
    {
      target: favoritesButtonRef,
      content: "علاقه‌مندی‌هات اینجاست!",
      position: "top",
    },
  ];

  return (
    <LinearGradient colors={colors.background} style={styles.container}>
      {/* دکمه تغییر تم */}
      <View style={styles.themeToggleButton}>
        <TouchableOpacity onPress={toggleTheme}>
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
        </TouchableOpacity>
      </View>

      {/* پرسش اولیه برای نمایش راهنما */}
      <WalkthroughTooltip
        isVisible={showTourPrompt && !hasSeenTour}
        content={
          <View style={styles.tooltipContainer}>
            <Text style={styles.tooltipText}>آیا مایلید راهنما رو ببینید؟</Text>
            <TouchableOpacity style={styles.skipButton} onPress={() => setTourPreference(false)}>
              <Text style={styles.skipButtonText}>خیر</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextButton} onPress={() => setTourPreference(true)}>
              <Text style={styles.nextButtonText}>بله</Text>
            </TouchableOpacity>
          </View>
        }
        placement="center"
        onClose={() => setShowTourPrompt(false)}
        showChildInTooltip={false}
        tooltipStyle={{ backgroundColor: colors.buttonBackground }}
      />

      {/* دایره لوگو */}
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
        target={circleRef.current ? findNodeHandle(circleRef.current) : undefined}
      >
        <View style={styles.circle} ref={circleRef}>
          <Image
            source={require("../../assets/images/quran2.png")}
            style={styles.quranImage}
          />
        </View>
      </WalkthroughTooltip>

      <View style={styles.buttonContainer}>
        {/* دکمه هوش مصنوعی */}
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
          target={aiButtonRef.current ? findNodeHandle(aiButtonRef.current) : undefined}
        >
          <Animatable.View animation="fadeInUp" delay={300} style={styles.button} ref={aiButtonRef}>
            <TouchableOpacity
              onPress={() => navigation.navigate("AiScreen")}
              style={styles.buttonContent}
            >
              <Text style={styles.buttonText}>هوش مصنوعی</Text>
              <Image
                style={styles.buttonImg}
                source={require("../../assets/images/icons8-ai-100.png")}
              />
            </TouchableOpacity>
          </Animatable.View>
        </WalkthroughTooltip>

        {/* دکمه قرآن کریم */}
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
          target={quranButtonRef.current ? findNodeHandle(quranButtonRef.current) : undefined}
        >
          <Animatable.View animation="fadeInUp" delay={400} style={styles.button} ref={quranButtonRef}>
            <TouchableOpacity
              onPress={() => navigation.navigate("Quran")}
              style={styles.buttonContent}
            >
              <Text style={styles.buttonText}>قرآن کریم</Text>
              <Image
                style={styles.buttonImg}
                source={require("../../assets/images/icons8-quran-100.png")}
              />
            </TouchableOpacity>
          </Animatable.View>
        </WalkthroughTooltip>

        {/* دکمه تنظیمات */}
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
          target={settingsButtonRef.current ? findNodeHandle(settingsButtonRef.current) : undefined}
        >
          <Animatable.View animation="fadeInUp" delay={500} style={styles.button} ref={settingsButtonRef}>
            <TouchableOpacity
              style={styles.buttonContent}
              onPress={() => navigation.navigate("Setting")}
            >
              <Text style={styles.buttonText}>تنظیمات</Text>
              <Image
                style={styles.buttonImg}
                source={require("../../assets/images/icons8-settings-144.png")}
              />
            </TouchableOpacity>
          </Animatable.View>
        </WalkthroughTooltip>

        {/* دکمه علاقه‌مندی‌ها */}
        <WalkthroughTooltip
          isVisible={tourActive && !hasSeenTour && userWantsTour && tourStep === 4}
          content={
            <View style={styles.tooltipContainer}>
              <Text style={styles.tooltipText}>{tourSteps[4].content}</Text>
              <TouchableOpacity style={styles.nextButton} onPress={markTourAsSeen}>
                <Text style={styles.nextButtonText}>اتمام راهنما</Text>
              </TouchableOpacity>
            </View>
          }
          placement={tourSteps[4].position}
          onClose={markTourAsSeen}
          showChildInTooltip={false}
          tooltipStyle={{ backgroundColor: colors.buttonBackground }}
          target={favoritesButtonRef.current ? findNodeHandle(favoritesButtonRef.current) : undefined}
        >
          <Animatable.View animation="fadeInUp" delay={600} style={styles.button} ref={favoritesButtonRef}>
            <TouchableOpacity
              style={styles.buttonContent}
              onPress={() => navigation.navigate("FavoritesScreen")}
            >
              <Text style={styles.buttonText}>علاقه مندی</Text>
              <Image
                style={styles.buttonImg}
                source={require("../../assets/images/icons8-bookmark-128.png")}
              />
            </TouchableOpacity>
          </Animatable.View>
        </WalkthroughTooltip>
      </View>

    </LinearGradient>
  );
};

const { width, height } = Dimensions.get("window");

export default HomeScreen;