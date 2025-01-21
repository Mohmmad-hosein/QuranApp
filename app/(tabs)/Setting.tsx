import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Image,
} from "react-native";
import {Picker} from '@react-native-picker/picker';
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Feather } from '@expo/vector-icons';

const Setting: React.FC = () => {
  const navigation = useNavigation();
  const [fontSize, setFontSize] = useState("20");
  const [fontType, setFontType] = useState("ایران سنس");
  const [color, setColor] = useState("آبی");
  const [lightLevel, setLightLevel] = useState("متوسط");

  const [isDarkMode, setIsDarkMode] = useState(false);

  const lightColors = {
    background: ["#7253EF", "#192163"],
    buttonText: "#fff",
  };

  const darkColors = {
    background: ["#251663", "#060817"],
    buttonText: "#FFFFFF",
  };
  
  const colors = isDarkMode ? darkColors : lightColors;

  const styles = useMemo(() => {
    return StyleSheet.create({
      container: {
        flex: 1,
        paddingVertical: 50,
      },
      header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        marginBottom: 20,
      },
      headerText: {
        fontSize: 24,
        color: colors.buttonText,
      },
      backButton: {
        padding: 10,
      },
      settingContainer: {
        width: width * 0.9,
        marginVertical: 10,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        borderRadius: 10,
        padding: 15,
      },
      label: {
        fontSize: 18,
        color: colors.buttonText,
        marginBottom: 5,
      },
      picker: {
        height: 50,
        width: "100%",
        color: colors.buttonText,
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        borderRadius: 5,
      },
      themeToggleButton: {
        position: "absolute",
        top: 40,
        right: 20,
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
  }, [isDarkMode]);

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
            onPress={() => setIsDarkMode(!isDarkMode)}
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
        </View>
        <View style={styles.settingContainer}>
          <Text style={styles.label}>اندازه قلم</Text>
          <Picker
            selectedValue={fontSize}
            style={styles.picker}
            onValueChange={(itemValue) => setFontSize(itemValue)}
          >
            <Picker.Item label="16" value="16" />
            <Picker.Item label="18" value="18" />
            <Picker.Item label="20" value="20" />
            <Picker.Item label="22" value="22" />
            <Picker.Item label="24" value="24" />
          </Picker>
        </View>
        <View style={styles.settingContainer}>
          <Text style={styles.label}>نوع فونت</Text>
          <Picker
            selectedValue={fontType}
            style={styles.picker}
            onValueChange={(itemValue) => setFontType(itemValue)}
          >
            <Picker.Item label="ایران سنس" value="ایران سنس" />
            <Picker.Item label="نازنین" value="نازنین" />
            <Picker.Item label="بی‌نازنین" value="بی‌نازنین" />
          </Picker>
        </View>
        <View style={styles.settingContainer}>
          <Text style={styles.label}>رنگ</Text>
          <Picker
            selectedValue={color}
            style={styles.picker}
            onValueChange={(itemValue) => setColor(itemValue)}
          >
            <Picker.Item label="آبی" value="آبی" />
            <Picker.Item label="قرمز" value="قرمز" />
            <Picker.Item label="سبز" value="سبز" />
          </Picker>
        </View>
        <View style={styles.settingContainer}>
          <Text style={styles.label}>سطح نور</Text>
          <Picker
            selectedValue={lightLevel}
            style={styles.picker}
            onValueChange={(itemValue) => setLightLevel(itemValue)}
          >
            <Picker.Item label="کم" value="کم" />
            <Picker.Item label="متوسط" value="متوسط" />
            <Picker.Item label="زیاد" value="زیاد" />
          </Picker>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const { width, height } = Dimensions.get("window");

export default Setting;
