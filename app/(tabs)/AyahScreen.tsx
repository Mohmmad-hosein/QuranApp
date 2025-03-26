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
  Modal,
  Pressable,
  TextInput,
  Animated,
  Platform,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import { Surah, Ayah } from "@/types";
import { translatePersian } from "@/assets/data/translatePersian";
import { surahs } from "@/assets/data/surahs";
import { Audio as AudioData } from "@/assets/data/audio";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import * as FileSystem from "expo-file-system";

type AyahScreenRouteProp = RouteProp<{ AyahScreen: { surah: Surah } }, "AyahScreen">;

const AyahScreen = () => {
  const { surah: receivedSurah } = useRoute<AyahScreenRouteProp>().params;
  const { isDarkMode, toggleTheme } = useTheme();
  const { fontSize, fontType } = useSettings();
  const navigation = useNavigation();

  // انیمیشن برای سوئیچ دارک مود
  const [spinValue] = useState(new Animated.Value(0));
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // انیمیشن مقیاس برای دکمه‌های پلیر
  const [playButtonScale] = useState(new Animated.Value(1));
  const [forwardButtonScale] = useState(new Animated.Value(1));
  const [backwardButtonScale] = useState(new Animated.Value(1));

  const animateButtonPress = (scale: Animated.Value) => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateToggle = () => {
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => toggleTheme());
  };

  // مدیریت سوره و آیات
  const [mergedSurah, setMergedSurah] = useState<Surah | null>(null);
  const [translatedAyahs, setTranslatedAyahs] = useState<Ayah[]>([]);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);

  // مدیریت پخش صوت
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [localAudioUri, setLocalAudioUri] = useState<string | null>(null);

  // مدیریت مودال راهنما
  const [showTutorial, setShowTutorial] = useState(false);

  // مدیریت مودال پایان قرائت
  const [showEndModal, setShowEndModal] = useState(false);

  // مدیریت منوی گزینه‌ها
  const [showMenu, setShowMenu] = useState(false);

  // مدیریت یادداشت‌ها
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentNoteAyah, setCurrentNoteAyah] = useState<Ayah | null>(null);
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const checkTutorial = async () => {
      const hasSeenTutorial = await AsyncStorage.getItem("hasSeenAyahScreenTutorial");
      if (!hasSeenTutorial) {
        setShowTutorial(true);
        await AsyncStorage.setItem("hasSeenAyahScreenTutorial", "true");
      }
    };
    checkTutorial();
  }, []);

  useEffect(() => {
    const matchingSurahs = surahs.filter((s) => s.name === receivedSurah.name);
    if (matchingSurahs.length > 0) {
      const mergedAyahs = matchingSurahs.reduce((acc: Ayah[], current: Surah) => {
        return [...acc, ...current.ayahs];
      }, []);
      const merged: Surah = {
        ...matchingSurahs[0],
        ayahs: mergedAyahs,
        numberOfAyahs: mergedAyahs.length,
      };
      setMergedSurah(merged);
    } else {
      setMergedSurah(receivedSurah);
    }
  }, [receivedSurah]);

  useEffect(() => {
    if (!mergedSurah) return;
    const surahTranslation = translatePersian.find((t) => t.number === mergedSurah.number);
    if (surahTranslation) {
      const combinedAyahs = mergedSurah.ayahs.map((ayah) => {
        const translation = surahTranslation.translation.find((t) => t.number === ayah.number);
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

  // بررسی وجود فایل صوتی محلی (فقط روی پلتفرم‌های native)
  const audioLink = AudioData.find((a) => a.number === mergedSurah?.number)?.audioLink;

  useEffect(() => {
    const checkLocalAudio = async () => {
      if (!mergedSurah || !audioLink) return;
      if (Platform.OS === "web") {
        setLocalAudioUri(null); // روی وب، همیشه از لینک آنلاین استفاده می‌کنیم
        return;
      }
      const fileName = `audio_${mergedSurah.number}.mp3`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        setLocalAudioUri(fileUri);
      } else {
        setLocalAudioUri(null);
      }
    };
    checkLocalAudio();
  }, [mergedSurah, audioLink]);

  const downloadAudio = async () => {
    if (Platform.OS === "web") {
      alert("قابلیت دانلود صوت فقط در اپلیکیشن موبایل در دسترس است.");
      setShowMenu(false);
      return;
    }
    if (!mergedSurah || !audioLink) return;
    const fileName = `audio_${mergedSurah.number}.mp3`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    try {
      const downloadResult = await FileSystem.downloadAsync(audioLink, fileUri);
      if (downloadResult.status === 200) {
        setLocalAudioUri(fileUri);
        alert("صوت با موفقیت دانلود شد!");
      } else {
        alert("خطا در دانلود صوت.");
      }
    } catch (error) {
      console.error("Error downloading audio:", error);
      alert("خطا در دانلود صوت.");
    }
    setShowMenu(false);
  };

  const playSound = async () => {
    if (!audioLink && !localAudioUri) return;
    const source = Platform.OS === "web" ? { uri: audioLink } : localAudioUri ? { uri: localAudioUri } : { uri: audioLink };
    if (sound) {
      await sound.playAsync();
      setIsPlaying(true);
    } else {
      const { sound: newSound } = await Audio.Sound.createAsync(
        source,
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);
      newSound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
      const status = await newSound.getStatusAsync();
      if (status.isLoaded) {
        setDuration(status.durationMillis);
      }
    }
  };

  const pauseSound = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const forward15 = async () => {
    if (sound) {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        const newPosition = status.positionMillis + 15000;
        await sound.setPositionAsync(newPosition);
        setPosition(newPosition);
      }
    }
  };

  const backward15 = async () => {
    if (sound) {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        const newPosition = Math.max(0, status.positionMillis - 15000);
        await sound.setPositionAsync(newPosition);
        setPosition(newPosition);
      }
    }
  };

  const onPlaybackStatusUpdate = async (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis);
      if (mergedSurah) {
        await AsyncStorage.setItem(
          `lastPosition_${mergedSurah.number}`,
          status.positionMillis.toString()
        );
      }
      if (status.didJustFinish) {
        await pauseSound();
        setShowEndModal(true);
      }
    }
  };

  useEffect(() => {
    const loadLastPosition = async () => {
      if (mergedSurah && sound) {
        const lastPosition = await AsyncStorage.getItem(`lastPosition_${mergedSurah.number}`);
        if (lastPosition) {
          const pos = parseInt(lastPosition);
          setPosition(pos);
          await sound.setPositionAsync(pos);
        }
      }
    };
    loadLastPosition();
  }, [mergedSurah, sound]);

  // محاسبه آیه فعلی با در نظر گرفتن تأخیر اولیه
  useEffect(() => {
    if (mergedSurah && duration > 0 && translatedAyahs.length > 0) {
      const wordsPerSecond = 0.375;
      const initialDelay = mergedSurah.number === 1 ? 13000 : 8000;
      let cumulativeTime = initialDelay;
      let found = false;

      for (let i = 0; i < translatedAyahs.length; i++) {
        const ayah = translatedAyahs[i];
        const wordCount = ayah.text.split(" ").length;
        const ayahDuration = (wordCount / wordsPerSecond) * 1000;
        const startTime = cumulativeTime;
        const endTime = cumulativeTime + ayahDuration;

        if (position >= startTime && position < endTime) {
          setCurrentAyahIndex(i);
          found = true;
          break;
        }
        cumulativeTime += ayahDuration;
      }

      if (!found) {
        if (position < initialDelay) {
          setCurrentAyahIndex(0);
        } else {
          setCurrentAyahIndex(translatedAyahs.length - 1);
        }
      }
    }
  }, [position, mergedSurah, duration, translatedAyahs]);

  useEffect(() => {
    const saveLastSurah = async () => {
      if (mergedSurah) {
        await AsyncStorage.setItem("lastSurah", JSON.stringify(mergedSurah));
      }
    };
    saveLastSurah();
  }, [mergedSurah]);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // مدیریت یادداشت‌ها
  useEffect(() => {
    const loadNotes = async () => {
      if (!mergedSurah) return;
      const loadedNotes: { [key: string]: string } = {};
      for (const ayah of translatedAyahs) {
        const noteKey = `note_${mergedSurah.number}_${ayah.number}`;
        const note = await AsyncStorage.getItem(noteKey);
        if (note) {
          loadedNotes[noteKey] = note;
        }
      }
      setNotes(loadedNotes);
    };
    loadNotes();
  }, [mergedSurah, translatedAyahs]);

  const openNoteModal = (ayah: Ayah) => {
    setCurrentNoteAyah(ayah);
    const noteKey = `note_${mergedSurah?.number}_${ayah.number}`;
    setNoteText(notes[noteKey] || "");
    setShowNoteModal(true);
  };

  const saveNote = async () => {
    if (!mergedSurah || !currentNoteAyah) return;
    const noteKey = `note_${mergedSurah.number}_${currentNoteAyah.number}`;
    if (noteText.trim()) {
      await AsyncStorage.setItem(noteKey, noteText);
      setNotes((prev) => ({ ...prev, [noteKey]: noteText }));
    } else {
      await AsyncStorage.removeItem(noteKey);
      setNotes((prev) => {
        const newNotes = { ...prev };
        delete newNotes[noteKey];
        return newNotes;
      });
    }
    setShowNoteModal(false);
    setNoteText("");
  };

  // تابع برای افزودن به علاقه‌مندی
  const addToFavorites = async () => {
    if (!mergedSurah) return;
    const favorites = await AsyncStorage.getItem("favorites");
    let favoritesArray = favorites ? JSON.parse(favorites) : [];
    if (!favoritesArray.some((s: Surah) => s.number === mergedSurah.number)) {
      favoritesArray.push(mergedSurah);
      await AsyncStorage.setItem("favorites", JSON.stringify(favoritesArray));
    }
    setShowMenu(false);
  };

  // تابع برای رفتن به سوره بعدی
  const goToNextSurah = () => {
    if (!mergedSurah) return;
    const nextSurahNumber = mergedSurah.number + 1;
    if (nextSurahNumber <= 114) {
      const nextSurah = surahs.find((s) => s.number === nextSurahNumber);
      if (nextSurah) {
        navigation.replace("AyahScreen", { surah: nextSurah });
      }
    }
    setShowEndModal(false);
  };

  const lightColors = {
    background: ["#5331DD", "#192163"],
    buttonText: "#fff",
    headerBackground: "rgba(255, 255, 255, 0.25)",
    borderColor: "rgb(255, 255, 255)",
    resultItemBackground: "rgba(94, 243, 233, 0.35)",
    translationTextColor: "#FFFFFF",
    playerGradient: ["#3A2A9B", "#192163"],
  };

  const darkColors = {
    background: ["#251663", "#060817"],
    buttonText: "#FFFFFF",
    headerBackground: "rgba(255, 255, 255, 0.25)",
    borderColor: "rgb(255, 255, 255)",
    resultItemBackground: "#08326B",
    translationTextColor: "#D3D3D3",
    playerGradient: ["#1A1A3A", "#060817"],
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
      backButton: { padding: 10 },
      menuButton: { padding: 10 },
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
      darkImg: { width: 27, height: 28 },
      resultsContainer: {
        width: width * 0.9,
        alignSelf: "center",
        paddingBottom: 90,
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
      resultTextContainer: {
        flex: 1,
      },
      resultText: {
        color: colors.buttonText,
        fontSize: fontSize ? parseInt(fontSize) + 4 : 24,
        fontFamily: fontType,
        textAlign: "right",
        lineHeight: 35,
      },
      translationText: {
        color: colors.translationTextColor,
        fontSize: fontSize ? parseInt(fontSize) - 4 : 18,
        fontFamily: fontType,
        textAlign: "right",
        marginTop: 5,
        fontStyle: "italic",
      },
      noteButton: {
        padding: 5,
      },
      audioControls: {
        position: "absolute",
        bottom: 0,
        width: width,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: "rgba(255, 255, 255, 0.1)",
      },
      audioButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        justifyContent: "center",
        alignItems: "center",
      },
      timeText: {
        color: "#FFFFFF",
        fontSize: fontSize ? parseInt(fontSize) - 4 : 14,
        fontFamily: fontType,
      },
      modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
      },
      modalContent: {
        width: width * 0.8,
        backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
        padding: 20,
        borderRadius: 10,
        alignItems: "center",
      },
      modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: isDarkMode ? "#FFFFFF" : "#000000",
        marginBottom: 10,
        fontFamily: fontType,
      },
      modalText: {
        fontSize: 16,
        color: isDarkMode ? "#D3D3D3" : "#333333",
        textAlign: "right",
        marginBottom: 10,
        fontFamily: fontType,
      },
      modalButton: {
        backgroundColor: "#57B4BA",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginVertical: 5,
      },
      modalButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontFamily: fontType,
      },
      noteInput: {
        width: "100%",
        height: 100,
        borderColor: isDarkMode ? "#D3D3D3" : "#333333",
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        marginBottom: 20,
        color: isDarkMode ? "#FFFFFF" : "#000000",
        fontFamily: fontType,
        textAlign: "right",
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
      seekImage: {
        width: 28,
        height: 28,
      },
    });
  }, [isDarkMode, fontSize, fontType]);

  const renderAyah = ({ item, index }: { item: Ayah; index: number }) => {
    const noteKey = `note_${mergedSurah?.number}_${item.number}`;
    const hasNote = !!notes[noteKey];
    return (
      <View
        style={[
          styles.resultItem,
          index === currentAyahIndex && {
            backgroundColor: "#183B4E",
          },
        ]}
      >
        <View style={styles.resultTextContainer}>
          <Text
            style={[
              styles.resultText,
              index === currentAyahIndex && { color: "#ccc" },
            ]}
          >
            {`${item.number}. ${item.text}`}
          </Text>
          {item.translation && (
            <Text
              style={[
                styles.translationText,
                index === currentAyahIndex && { color: "#ccc" },
              ]}
            >
              {item.translation}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.noteButton}
          onPress={() => openNoteModal(item)}
        >
          <Feather
            name={hasNote ? "edit-2" : "plus"}
            size={20}
            color={hasNote ? "#57B4BA" : colors.buttonText}
          />
        </TouchableOpacity>
      </View>
    );
  };

  if (!mergedSurah) {
    return (
      <LinearGradient colors={colors.background} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color={colors.buttonText} />
          </TouchableOpacity>
          <Text style={styles.headerText}>در حال بارگذاری...</Text>
        </View>
      </LinearGradient>
    );
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <LinearGradient colors={colors.background} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={colors.buttonText} />
        </TouchableOpacity>
        <Text style={styles.headerText}>{mergedSurah.name}</Text>
        <TouchableOpacity style={styles.menuButton} onPress={() => setShowMenu(!showMenu)}>
          <Feather name="more-vertical" size={24} color={colors.buttonText} />
        </TouchableOpacity>
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

      {/* منوی کشویی */}
      {showMenu && (
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={addToFavorites}>
            <Text style={styles.menuItemText}>افزودن به علاقه‌مندی</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              navigation.navigate("SurahDetails", { surah: mergedSurah });
            }}
          >
            <Text style={styles.menuItemText}>جزئیات سوره</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={downloadAudio}>
            <Text style={styles.menuItemText}>
              {Platform.OS === "web" ? "دانلود صوت (فقط در اپ)" : localAudioUri ? "صوت دانلود شده" : "دانلود صوت"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={translatedAyahs}
        renderItem={renderAyah}
        keyExtractor={(item: Ayah) => item.number.toString()}
        contentContainerStyle={styles.resultsContainer}
      />

      <LinearGradient colors={colors.playerGradient} style={styles.audioControls}>
        <Text style={styles.timeText}>
          {formatTime(position)} / {formatTime(duration)}
        </Text>
        <Slider
          style={{ width: 150, height: 40 }}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onSlidingComplete={async (value) => {
            if (sound) {
              await sound.setPositionAsync(value);
              setPosition(value);
            }
          }}
          minimumTrackTintColor="#FFFFFF"
          maximumTrackTintColor="rgba(255, 255, 255, 0.5)"
          thumbTintColor="#57B4BA"
        />
        <TouchableOpacity
          onPress={() => {
            backward15();
            animateButtonPress(backwardButtonScale);
          }}
          style={styles.audioButton}
        >
          <Animated.View style={{ transform: [{ scale: backwardButtonScale }] }}>
            <Image
              source={require("../../assets/images/backward15.png")}
              style={styles.seekImage}
            />
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            if (isPlaying) pauseSound();
            else playSound();
            animateButtonPress(playButtonScale);
          }}
          style={styles.audioButton}
        >
          <Animated.View style={{ transform: [{ scale: playButtonScale }] }}>
            <Feather name={isPlaying ? "pause" : "play"} size={28} color={colors.buttonText} />
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            forward15();
            animateButtonPress(forwardButtonScale);
          }}
          style={styles.audioButton}
        >
          <Animated.View style={{ transform: [{ scale: forwardButtonScale }] }}>
            <Image
              source={require("../../assets/images/forward15.png")}
              style={styles.seekImage}
            />
          </Animated.View>
        </TouchableOpacity>
      </LinearGradient>

      {/* مودال راهنما */}
      <Modal
        visible={showTutorial}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTutorial(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>راهنمای استفاده</Text>
            <Text style={styles.modalText}>
              - برای پخش یا توقف قرائت، از دکمه پخش/توقف در پایین صفحه استفاده کنید.
            </Text>
            <Text style={styles.modalText}>
              - برای جلو یا عقب بردن ۱۵ ثانیه، از دکمه‌های کنار پلیر استفاده کنید.
            </Text>
            <Text style={styles.modalText}>
              - با اسلایدر می‌توانید به بخش دلخواه صوت بروید.
            </Text>
            <Text style={styles.modalText}>
              - آیه در حال قرائت با رنگ متفاوت نمایش داده می‌شود.
            </Text>
            <Text style={styles.modalText}>
              - از منوی کشویی (بالا سمت چپ) می‌توانید سوره را به علاقه‌مندی‌ها اضافه کنید، جزئیات سوره را ببینید یا صوت را دانلود کنید.
            </Text>
            <Text style={styles.modalText}>
              - برای افزودن یا ویرایش یادداشت برای هر آیه، روی آیکون یادداشت (سمت چپ آیه) کلیک کنید.
            </Text>
            <Pressable
              style={styles.modalButton}
              onPress={() => setShowTutorial(false)}
            >
              <Text style={styles.modalButtonText}>بستن</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* مودال پایان قرائت */}
      <Modal
        visible={showEndModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEndModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>پایان قرائت</Text>
            <Text style={styles.modalText}>
              قرائت سوره به پایان رسید. آیا می‌خواهید به سوره بعدی بروید؟
            </Text>
            <Pressable style={styles.modalButton} onPress={goToNextSurah}>
              <Text style={styles.modalButtonText}>بله</Text>
            </Pressable>
            <Pressable
              style={[styles.modalButton, { backgroundColor: "#FF5555" }]}
              onPress={() => setShowEndModal(false)}
            >
              <Text style={styles.modalButtonText}>خیر</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* مودال یادداشت */}
      <Modal
        visible={showNoteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNoteModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>یادداشت برای آیه {currentNoteAyah?.number}</Text>
            <TextInput
              style={styles.noteInput}
              multiline
              value={noteText}
              onChangeText={setNoteText}
              placeholder="یادداشت خود را اینجا بنویسید..."
              placeholderTextColor={isDarkMode ? "#D3D3D3" : "#666666"}
            />
            <Pressable style={styles.modalButton} onPress={saveNote}>
              <Text style={styles.modalButtonText}>ذخیره</Text>
            </Pressable>
            <Pressable
              style={[styles.modalButton, { backgroundColor: "#FF5555" }]}
              onPress={() => setShowNoteModal(false)}
            >
              <Text style={styles.modalButtonText}>بستن</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const { width } = Dimensions.get("window");
export default AyahScreen;