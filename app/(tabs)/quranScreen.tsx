import React, { useMemo, useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Image,
  TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSettings } from "@/context/SettingsContext";
import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { surahs } from "@/assets/data/surahs";

const QuranScreen = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { fontSize, fontType } = useSettings();
  const navigation = useNavigation();

  const [word, setWord] = useState("");
  const [searchResults, setSearchResults] = useState(surahs);
  const [sortOrder, setSortOrder] = useState("asc");

  const lightColors = {
    background: ["#5331DD", "#192163"],
    buttonText: "#fff",
    buttonBackground: "rgba(255, 255, 255, 0.2)",
    headerBackground: "rgba(255, 255, 255, 0.25)",
    borderColor: "rgb(255, 255, 255)",
    resultItemBackground: "rgba(105, 166, 245, 0.3)",
  };

  const darkColors = {
    background: ["#251663", "#060817"],
    buttonText: "#FFFFFF",
    buttonBackground: "#08326B",
    headerBackground: "rgba(255, 255, 255, 0.25)",
    borderColor: "rgb(255, 255, 255)",
    resultItemBackground: "#08326B",
  };

  const colors = isDarkMode ? darkColors : lightColors;

  useEffect(() => {
    handleSearch();
  }, [word, sortOrder]);

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
      inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: width * 0.9,
        alignSelf: "center",
        backgroundColor: colors.buttonBackground,
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 20,
        direction: "rtl",
      },
      input: {
        flex: 1,
        height: 50,
        color: colors.buttonText,
        fontSize: 16,
        fontFamily: fontType,
      },
      searchButton: { padding: 10 },
      searchButtonIcon: { color: colors.buttonText },
      sortButton: {
        backgroundColor: colors.buttonBackground,
        padding: 10,
        borderRadius: 10,
        marginBottom: 15,
        alignSelf: "center",
      },
      sortButtonText: {
        color: colors.buttonText,
        fontSize: 16,
        textAlign: "center",
        fontFamily: fontType,
      },
      picker: {
        height: 50,
        width: 120,
        color: colors.buttonText,
        backgroundColor: colors.buttonBackground,
        borderRadius: 10,
        marginLeft: 10,
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
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      },
      resultText: {
        color: colors.buttonText,
        fontSize: 16,
        fontFamily: fontType,
      },
      scrollView: {
        maxHeight: height * 0.7,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        padding: 15,
        width: width * 0.95,
        alignSelf: "center",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.borderColor,
      },
      backButton: {
        padding: 10,
      },
      headerText: {
        fontSize: fontSize ? parseInt(fontSize) : 24,
        color: colors.buttonText,
        fontWeight: "bold",
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
      iconButton: {
        padding: 5,
      },
      moreBtn: {
        height: 30,
        width: 30,
      },
      smallContainer : {
        width : 80,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }
    });
  }, [isDarkMode, fontSize, fontType]);

  const handleSearch = () => {
    const filteredSurahs = surahs.filter(
      (surah) =>
        surah.name.includes(word) ||
        surah.ayahs.some((ayah) => ayah.text.includes(word))
    );
    const uniqueSurahs = Array.from(
      new Map(filteredSurahs.map((surah) => [surah.name, surah])).values()
    );

    const sortedSurahs = uniqueSurahs.sort((a, b) =>
      sortOrder === "asc"
        ? a.numberOfAyahs - b.numberOfAyahs
        : b.numberOfAyahs - a.numberOfAyahs
    );

    setSearchResults(sortedSurahs);
  };

  const navigateToSurahDetails = (surah) => {
    navigation.navigate("SurahDetails", { surah });
  };

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
          <Text style={styles.headerText}>قرآن</Text>
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

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Feather name="search" size={24} style={styles.searchButtonIcon} />
          </TouchableOpacity>
          <TextInput
            placeholder="جستجو..."
            placeholderTextColor={colors.buttonText}
            style={styles.input}
            value={word}
            onChangeText={setWord}
          />
          <Picker
            selectedValue={sortOrder}
            style={styles.picker}
            onValueChange={(itemValue) => setSortOrder(itemValue)}
          >
            <Picker.Item label="بیشترین آیات" value="desc" />
            <Picker.Item label="کمترین آیات" value="asc" />
          </Picker>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.resultsContainer}>
            {searchResults.length > 0 ? (
              searchResults.map((surah, index) => (
                <View key={index} style={styles.resultItem}>
                  <View style={styles.smallContainer}>
                    {" "}
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => navigateToSurahDetails(surah)}
                    >
                      <Image
                        source={require("../../assets/images/icons8-more-64.png")}
                        style={styles.moreBtn}
                      />
                    </TouchableOpacity>
                    <Text
                      style={styles.resultText}
                    >{`${surah.numberOfAyahs} آیه`}</Text>{" "}
                  </View>
                  <Text style={styles.resultText}>{surah.name}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.resultText}>نتیجه‌ای یافت نشد.</Text>
            )}
          </View>
        </ScrollView>
      </ScrollView>
    </LinearGradient>
  );
};

const { width, height } = Dimensions.get("window");
export default QuranScreen;
