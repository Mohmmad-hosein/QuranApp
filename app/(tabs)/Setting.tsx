import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Image,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useSettings } from "@/context/SettingsContext";

const SettingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isDarkMode, toggleTheme } = useTheme();
  const {
    fontSize,
    setFontSize,
    fontType,
    setFontType,
  } = useSettings();



  const lightColors = {
    background: ["#7253EF", "#192163"],
    buttonText: "#fff",
    buttonBackground: "rgba(255, 255, 255, 0.2)",
    headerBackground: "rgba(255, 255, 255, 0.25)",
  };

  const darkColors = {
    background: ["#251663", "#060817"],
    buttonText: "#FFFFFF",
    buttonBackground: "rgba(255, 255, 255, 0.2)",
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
    });
  }, [isDarkMode, fontSize, fontType]);

  return (
    <LinearGradient colors={colors.background} style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color={colors.buttonText} />
          </TouchableOpacity>
          <Text style={styles.headerText}>تنظیمات</Text>
          <TouchableOpacity
            style={styles.themeToggleButton}
            onPress={toggleTheme}
          >
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

        <View style={styles.settingContainer}>
          <Picker
            selectedValue={fontSize}
            style={styles.picker}
            onValueChange={(itemValue) => setFontSize(itemValue)}
          >
            <Picker.Item label="14" value="14" />
            <Picker.Item label="16" value="16" />
            <Picker.Item label="18" value="18" />
            <Picker.Item label="20" value="20" />
            <Picker.Item label="22" value="22" />
            <Picker.Item label="24" value="24" />
          </Picker>
          <Text style={styles.label}>اندازه قلم</Text>
        </View>

        <View style={styles.settingContainer}>
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



        <TouchableOpacity style={styles.flatButton}>
          <Text style={styles.flatButtonText}>گزارش</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.flatButton}>
          <Text style={styles.flatButtonText}>درباره ما</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const { width } = Dimensions.get("window");

export default SettingScreen;
