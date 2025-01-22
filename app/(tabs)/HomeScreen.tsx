import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import * as Animatable from "react-native-animatable";
import { useTheme } from "@/context/ThemeContext";
import { useSettings } from "@/context/SettingsContext";



const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isDarkMode, toggleTheme } = useTheme();
  const { fontSize, setFontSize, fontType, setFontType, lightLevel, setLightLevel } = useSettings();

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
      themeToggleButtonText: {
        color: colors.buttonText,
      },
      darkImg: {
        width: 27,
        height: 28,
      },
    });
  }, [isDarkMode, fontSize, fontType]);

  return (
    <LinearGradient colors={colors.background} style={styles.container}>
      <View style={styles.circle}>
        <Image
          source={require("../../assets/images/quran2.png")}
          style={styles.quranImage}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Animatable.View animation="fadeInUp" delay={300} style={styles.button}>
          <TouchableOpacity style={styles.buttonContent}>
            <Text style={styles.buttonText}>هوش مصنوعی</Text>
            <Image
              style={styles.buttonImg}
              source={require("../../assets/images/icons8-ai-100.png")}
            />
          </TouchableOpacity>
        </Animatable.View>
        <Animatable.View animation="fadeInUp" delay={400} style={styles.button}>
          <TouchableOpacity style={styles.buttonContent}>
            <Text style={styles.buttonText}>قرآن کریم</Text>
            <Image
              style={styles.buttonImg}
              source={require("../../assets/images/icons8-quran-100.png")}
            />
          </TouchableOpacity>
        </Animatable.View>
        <Animatable.View animation="fadeInUp" delay={500} style={styles.button}>
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
        <Animatable.View animation="fadeInUp" delay={600} style={styles.button}>
          <TouchableOpacity style={styles.buttonContent}>
            <Text style={styles.buttonText}>علاقه مندی</Text>
            <Image
              style={styles.buttonImg}
              source={require("../../assets/images/icons8-bookmark-128.png")}
            />
          </TouchableOpacity>
        </Animatable.View>
      </View>
      <TouchableOpacity
        style={styles.themeToggleButton}
        onPress={toggleTheme}
      >
        <Text style={styles.themeToggleButtonText}>
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
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const { width, height } = Dimensions.get("window");

export default HomeScreen;
