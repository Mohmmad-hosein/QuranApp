import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
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
  Modal,
  findNodeHandle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSettings } from "@/context/SettingsContext";
import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { surahs } from "@/assets/data/surahs";
import { useFavorites } from "@/context/FavoritesContext";
import { Surah, Ayah } from "@/types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import WalkthroughTooltip from 'react-native-walkthrough-tooltip';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  SurahDetails: { surah: Surah };
  AyahScreen: { surah: Surah };
  FavoritesScreen: undefined;
  QuranScreen: undefined;
  NotesScreen: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "QuranScreen">;

type SortOrder = "asc" | "desc" | "asc-number" | "desc-number";

interface Colors {
  background: string[];
  buttonText: string;
  buttonBackground: string;
  headerBackground: string;
  borderColor: string;
  resultItemBackground: string;
}

const QuranScreen: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { fontSize, fontType } = useSettings();
  const navigation = useNavigation<NavigationProp>();
  const { addToFavorites } = useFavorites();

  const [word, setWord] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [searchResults, setSearchResults] = useState<Surah[]>(surahs);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [lastSurah, setLastSurah] = useState<Surah | null>(null);

  // مدیریت تور
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const [userWantsTour, setUserWantsTour] = useState<boolean | null>(null);

  // refs برای المان‌ها
  const headerRef = useRef<View>(null);
  const inputRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const lastSurahRef = useRef<View>(null); // ref برای بخش آخرین سوره
  const menuButtonRef = useRef<TouchableOpacity>(null); // ref برای دکمه منو

  // بررسی وضعیت کلی تور و تور این صفحه
  useEffect(() => {
    const checkTourStatus = async () => {
      try {
        const wantsTour = await AsyncStorage.getItem('userWantsTour');
        const seenTour = await AsyncStorage.getItem('hasSeenQuranTour');

        if (wantsTour !== null) {
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

  // بارگذاری آخرین سوره دیده‌شده
  useEffect(() => {
    const loadLastSurah = async () => {
      try {
        const lastSurahData = await AsyncStorage.getItem("lastSurah");
        if (lastSurahData) {
          const parsedSurah = JSON.parse(lastSurahData);
          setLastSurah(parsedSurah);
        }
      } catch (error) {
        console.error("Error loading last surah:", error);
      }
    };
    loadLastSurah();
  }, []);

  // ذخیره وضعیت تور این صفحه
  const markTourAsSeen = async () => {
    try {
      await AsyncStorage.setItem('hasSeenQuranTour', 'true');
      setHasSeenTour(true);
      setTourActive(false);
      setTourStep(0);
    } catch (error) {
      console.error("Error saving tour status:", error);
    }
  };

  const lightColors: Colors = {
    background: ["#5331DD", "#192163"],
    buttonText: "#fff",
    buttonBackground: "rgba(255, 255, 255, 0.2)",
    headerBackground: "rgba(255, 255, 255, 0.25)",
    borderColor: "rgb(255, 255, 255)",
    resultItemBackground: "rgba(97, 194, 243, 0.3)",
  };

  const darkColors: Colors = {
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

  const handleSearch = () => {
    const filteredSurahs = surahs.filter(
      (surah: Surah) =>
        surah.name.includes(word) ||
        surah.ayahs.some((ayah: Ayah) => ayah.text.includes(word))
    );

    const mergedSurahs = filteredSurahs.reduce((acc: Surah[], surah: Surah) => {
      const existingSurah = acc.find((s) => s.name === surah.name);
      if (existingSurah) {
        existingSurah.ayahs = [...existingSurah.ayahs, ...surah.ayahs];
        existingSurah.numberOfAyahs = existingSurah.ayahs.length;
      } else {
        acc.push({ ...surah, numberOfAyahs: surah.ayahs.length });
      }
      return acc;
    }, []);

    const sortedSurahs = mergedSurahs.sort((a, b) => {
      if (sortOrder === "asc") {
        return a.numberOfAyahs - b.numberOfAyahs;
      } else if (sortOrder === "desc") {
        return b.numberOfAyahs - a.numberOfAyahs;
      } else if (sortOrder === "asc-number") {
        return a.number - b.number;
      } else {
        return b.number - a.number;
      }
    });

    setSearchResults(sortedSurahs);
  };

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
        width: 150,
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
      lastSurahContainer: {
        backgroundColor: colors.resultItemBackground,
        padding: 15,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: colors.borderColor,
        marginBottom: 20,
        width: width * 0.9,
        alignSelf: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      },
      lastSurahText: {
        color: colors.buttonText,
        fontSize: 18,
        fontFamily: fontType,
      },
      scrollView: {
        maxHeight: height * 0.75,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
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
      menuButton: {
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
        right: 80,
        width: 35,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(217, 217, 217, 0.2)",
        justifyContent: "center",
        alignItems: "center",
      },
      favoritesButton: {
        padding: 10,
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
      smallContainer: {
        width: 80,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      },
      modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
      },
      modalContent: {
        backgroundColor: colors.resultItemBackground,
        padding: 20,
        borderRadius: 10,
        width: "80%",
        alignItems: "center",
      },
      modalText: {
        color: colors.buttonText,
        fontSize: 16,
        fontFamily: fontType,
        marginBottom: 10,
      },
      modalButton: {
        padding: 10,
        marginVertical: 5,
        borderRadius: 5,
        backgroundColor: colors.buttonBackground,
        width: "100%",
        alignItems: "center",
      },
      menuContainer: {
        position: "absolute",
        top: 90,
        right: 20,
        backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
        borderRadius: 5,
        padding: 10,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        zIndex: 1000,
      },
      menuItem: {
        paddingVertical: 10,
        paddingHorizontal: 15,
      },
      menuItemText: {
        fontSize: 16,
        color: isDarkMode ? "#FFFFFF" : "#000000",
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
        color: "#000",
        fontSize: 16,
        fontFamily: fontType,
        textAlign: "center",
        padding: 5,
      },
      tooltipContainer: {
        padding: 10,
        maxWidth: 200,
      },
      resultText: {
        color: colors.buttonText,
        fontSize: 20,
        fontFamily: fontType,
      },
    });
  }, [isDarkMode, fontSize, fontType, colors]);

  const navigateToSurahDetails = (surah: Surah) => {
    navigation.navigate("SurahDetails", { surah });
  };

  const navigateToAyahScreen = (surah: Surah) => {
    navigation.navigate("AyahScreen", { surah });
  };

  const renderModal = useCallback(
    () => (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>گزینه‌ها:</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                if (selectedSurah) {
                  navigateToAyahScreen(selectedSurah);
                  setModalVisible(false);
                }
              }}
            >
              <Text style={styles.modalText}>مشاهده آیات</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                if (selectedSurah) {
                  navigateToSurahDetails(selectedSurah);
                  setModalVisible(false);
                }
              }}
            >
              <Text style={styles.modalText}>جزئیات سوره</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                if (selectedSurah) {
                  addToFavorites(selectedSurah);
                  setModalVisible(false);
                }
              }}
            >
              <Text style={styles.modalText}>اضافه به علاقه‌مندی‌ها</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalText}>بستن</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    ),
    [modalVisible, selectedSurah, navigateToAyahScreen, navigateToSurahDetails, addToFavorites, styles]
  );

  // تعریف مراحل تور
  const tourSteps = [
    {
      target: headerRef,
      content: "به صفحه‌ی قرآن خوش اومدی!",
      position: "bottom",
    },
    {
      target: menuButtonRef,
      content: "اینجا می‌تونی منوی گزینه‌ها رو باز کنی و به یادداشت‌ها بری!",
      position: "bottom",
    },
    {
      target: lastSurahRef,
      content: "آخرین سوره‌ای که دیدی رو می‌تونی از اینجا سریع باز کنی!",
      position: "bottom",
    },
    {
      target: inputRef,
      content: "جستجو و مرتب‌سازی سوره‌ها رو اینجا انجام بده!",
      position: "bottom",
    },
    {
      target: scrollRef,
      content: "لیست سوره‌ها رو اینجا ببین و انتخاب کن!",
      position: "top",
    },
  ];

  return (
    <LinearGradient colors={colors.background} style={styles.container}>
      <ScrollView>
        {/* هدر با تور */}
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
          tooltipStyle={{ backgroundColor: colors.headerBackground }}
          target={headerRef.current ? findNodeHandle(headerRef.current) : undefined}
        >
          <View style={styles.header} ref={headerRef}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.canGoBack() && navigation.goBack()}
            >
              <Feather name="arrow-left" size={24} color={colors.buttonText} />
            </TouchableOpacity>
            <Text style={styles.headerText}>قرآن</Text>
            <WalkthroughTooltip
              isVisible={tourActive && !hasSeenTour && userWantsTour && tourStep === 1}
              content={
                <View style={styles.tooltipContainer}>
                  <Text style={styles.tooltipText}>{tourSteps[1].content}</Text>
                  <TouchableOpacity style={styles.nextButton} onPress={() => {
                    setShowMenu(false); // بستن منو بعد از نمایش توضیحات
                    setTourStep(2);
                  }}>
                    <Text style={styles.nextButtonText}>رفتن به راهنمای بعدی</Text>
                  </TouchableOpacity>
                </View>
              }
              placement={tourSteps[1].position}
              onClose={() => {
                setShowMenu(false);
                setTourStep(2);
              }}
              showChildInTooltip={false}
              tooltipStyle={{ backgroundColor: colors.headerBackground }}
              target={menuButtonRef.current ? findNodeHandle(menuButtonRef.current) : undefined}
            >
              <TouchableOpacity
                style={styles.menuButton}
                ref={menuButtonRef}
                onPress={() => {
                  setShowMenu(!showMenu);
                  if (tourActive && tourStep === 1) {
                    setTourStep(2);
                  }
                }}
              >
                <Feather name="more-vertical" size={24} color={colors.buttonText} />
              </TouchableOpacity>
            </WalkthroughTooltip>
            <TouchableOpacity
              style={styles.favoritesButton}
              onPress={() => navigation.navigate("FavoritesScreen")}
            >
              <Feather name="heart" size={24} color={colors.buttonText} />
            </TouchableOpacity>
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
        </WalkthroughTooltip>

        {/* منوی کشویی */}
        {showMenu && (
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                navigation.navigate("NotesScreen");
              }}
            >
              <Text style={styles.menuItemText}>یادداشت‌ها</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* بخش آخرین سوره دیده‌شده با تور */}
        {lastSurah && (
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
            tooltipStyle={{ backgroundColor: colors.headerBackground }}
            target={lastSurahRef.current ? findNodeHandle(lastSurahRef.current) : undefined}
          >
            <TouchableOpacity
              style={styles.lastSurahContainer}
              ref={lastSurahRef}
              onPress={() => navigateToAyahScreen(lastSurah)}
            >
              <Text style={styles.lastSurahText}>آخرین سوره دیده‌شده:</Text>
              <Text style={styles.lastSurahText}>{lastSurah.name}</Text>
            </TouchableOpacity>
          </WalkthroughTooltip>
        )}

        {/* بخش جستجو با تور */}
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
          tooltipStyle={{ backgroundColor: colors.headerBackground }}
          target={inputRef.current ? findNodeHandle(inputRef.current) : undefined}
        >
          <View style={styles.inputContainer} ref={inputRef}>
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
              onValueChange={(itemValue: SortOrder) => setSortOrder(itemValue)}
            >
              <Picker.Item label="ترتیب صعودی شماره" value="asc-number" />
              <Picker.Item label="ترتیب نزولی شماره" value="desc-number" />
              <Picker.Item label="بیشترین آیات" value="desc" />
              <Picker.Item label="کمترین آیات" value="asc" />
            </Picker>
          </View>
        </WalkthroughTooltip>

        {/* لیست سوره‌ها با تور */}
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
          tooltipStyle={{ backgroundColor: colors.headerBackground }}
          target={scrollRef.current ? findNodeHandle(scrollRef.current) : undefined}
        >
          <ScrollView style={styles.scrollView} ref={scrollRef}>
            <View style={styles.resultsContainer}>
              {searchResults.length > 0 ? (
                searchResults.map((surah, index) => (
                  <View key={index} style={styles.resultItem}>
                    <View style={styles.smallContainer}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => {
                          setSelectedSurah(surah);
                          setModalVisible(true);
                        }}
                      >
                        <Image
                          source={require("../../assets/images/icons8-more-64.png")}
                          style={styles.moreBtn}
                        />
                      </TouchableOpacity>
                      <Text style={styles.resultText}>{`${surah.numberOfAyahs} آیه`}</Text>
                    </View>
                    <Text style={styles.resultText}>{surah.name}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.resultText}>نتیجه‌ای یافت نشد.</Text>
              )}
            </View>
          </ScrollView>
        </WalkthroughTooltip>
      </ScrollView>
      {renderModal()}
    </LinearGradient>
  );
};

const { width, height } = Dimensions.get("window");
export default QuranScreen;