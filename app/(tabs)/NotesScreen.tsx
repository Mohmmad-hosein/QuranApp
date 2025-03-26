import React, { useState, useEffect } from "react";
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
  TextInput,
  Modal,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { surahs } from "@/assets/data/surahs";

interface Note {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  noteText: string;
}

const NotesScreen = () => {
  const { isDarkMode } = useTheme();
  const { fontSize, fontType } = useSettings();
  const navigation = useNavigation();

  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false); // برای مودال تأیید حذف
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null); // یادداشتی که قراره حذف بشه

  // بارگذاری تمام یادداشت‌ها
  useEffect(() => {
    const loadAllNotes = async () => {
      const loadedNotes: Note[] = [];
      const keys = await AsyncStorage.getAllKeys();
      const noteKeys = keys.filter((key) => key.startsWith("note_"));

      for (const key of noteKeys) {
        const noteText = await AsyncStorage.getItem(key);
        if (noteText) {
          const [, surahNumber, ayahNumber] = key.split("_");
          const surah = surahs.find((s) => s.number === parseInt(surahNumber));
          if (surah) {
            loadedNotes.push({
              surahNumber: parseInt(surahNumber),
              surahName: surah.name,
              ayahNumber: parseInt(ayahNumber),
              noteText,
            });
          }
        }
      }

      // مرتب‌سازی بر اساس شماره سوره و شماره آیه
      loadedNotes.sort((a, b) => {
        if (a.surahNumber === b.surahNumber) {
          return a.ayahNumber - b.ayahNumber;
        }
        return a.surahNumber - b.surahNumber;
      });

      setNotes(loadedNotes);
      setFilteredNotes(loadedNotes);
    };
    loadAllNotes();
  }, []);

  // فیلتر کردن یادداشت‌ها بر اساس جستجو
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredNotes(notes);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = notes.filter(
        (note) =>
          note.surahName.toLowerCase().includes(query) ||
          note.noteText.toLowerCase().includes(query)
      );
      setFilteredNotes(filtered);
    }
  }, [searchQuery, notes]);

  // تابع حذف یادداشت
  const deleteNote = async () => {
    if (!noteToDelete) return;

    const noteKey = `note_${noteToDelete.surahNumber}_${noteToDelete.ayahNumber}`;
    try {
      // حذف از AsyncStorage
      await AsyncStorage.removeItem(noteKey);
      // به‌روزرسانی لیست یادداشت‌ها
      const updatedNotes = notes.filter(
        (note) =>
          note.surahNumber !== noteToDelete.surahNumber ||
          note.ayahNumber !== noteToDelete.ayahNumber
      );
      setNotes(updatedNotes);
      setFilteredNotes(
        updatedNotes.filter(
          (note) =>
            note.surahName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.noteText.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setShowDeleteModal(false);
      setNoteToDelete(null);
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const lightColors = {
    background: ["#5331DD", "#192163"],
    buttonText: "#fff",
    headerBackground: "rgba(255, 255, 255, 0.25)",
    borderColor: "rgb(255, 255, 255)",
    resultItemBackground: "rgba(94, 243, 233, 0.35)",
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

  const styles = StyleSheet.create({
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
    searchContainer: {
      width: width * 0.9,
      alignSelf: "center",
      marginBottom: 20,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
      borderRadius: 10,
      paddingHorizontal: 10,
    },
    searchInput: {
      flex: 1,
      height: 40,
      color: isDarkMode ? "#FFFFFF" : "#000000",
      fontFamily: fontType,
      fontSize: fontSize ? parseInt(fontSize) - 4 : 16,
      textAlign: "right",
    },
    searchIcon: {
      marginLeft: 10,
    },
    resultsContainer: {
      width: width * 0.9,
      alignSelf: "center",
      paddingBottom: 20,
    },
    noteItem: {
      backgroundColor: colors.resultItemBackground,
      padding: 15,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.borderColor,
      marginBottom: 10,
    },
    noteHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 10,
      alignItems: "center",
    },
    surahText: {
      color: colors.buttonText,
      fontSize: fontSize ? parseInt(fontSize) : 20,
      fontFamily: fontType,
      fontWeight: "bold",
    },
    ayahNumber: {
      color: colors.buttonText,
      fontSize: fontSize ? parseInt(fontSize) : 20,
      fontFamily: fontType,
    },
    noteText: {
      color: colors.translationTextColor,
      fontSize: fontSize ? parseInt(fontSize) - 4 : 16,
      fontFamily: fontType,
      textAlign: "right",
    },
    emptyText: {
      color: colors.buttonText,
      fontSize: fontSize ? parseInt(fontSize) : 18,
      fontFamily: fontType,
      textAlign: "center",
      marginTop: 20,
    },
    deleteButton: {
      padding: 5,
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
      textAlign: "center",
      marginBottom: 20,
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
  });

  const renderNote = ({ item }: { item: Note }) => (
    <View style={styles.noteItem}>
      <View style={styles.noteHeader}>
        <TouchableOpacity
          onPress={() => {
            const surah = surahs.find((s) => s.number === item.surahNumber);
            if (surah) {
              navigation.navigate("AyahScreen", { surah });
            }
          }}
        >
          <Text style={styles.surahText}>{item.surahName}</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              setNoteToDelete(item);
              setShowDeleteModal(true);
            }}
          >
            <Feather name="trash-2" size={20} color="#FF5555" />
          </TouchableOpacity>
          <Text style={styles.ayahNumber}>آیه {item.ayahNumber}</Text>
        </View>
      </View>
      <Text style={styles.noteText}>{item.noteText}</Text>
    </View>
  );

  return (
    <LinearGradient colors={colors.background} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={colors.buttonText} />
        </TouchableOpacity>
        <Text style={styles.headerText}>یادداشت‌ها</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="جستجو در یادداشت‌ها..."
          placeholderTextColor={isDarkMode ? "#D3D3D3" : "#666666"}
        />
        <Feather
          name="search"
          size={20}
          color={isDarkMode ? "#D3D3D3" : "#666666"}
          style={styles.searchIcon}
        />
      </View>

      {filteredNotes.length === 0 ? (
        <Text style={styles.emptyText}>هیچ یادداشتی یافت نشد.</Text>
      ) : (
        <FlatList
          data={filteredNotes}
          renderItem={renderNote}
          keyExtractor={(item) => `note_${item.surahNumber}_${item.ayahNumber}`}
          contentContainerStyle={styles.resultsContainer}
        />
      )}

      {/* مودال تأیید حذف */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>تأیید حذف</Text>
            <Text style={styles.modalText}>
              آیا مطمئن هستید که می‌خواهید این یادداشت را حذف کنید؟
            </Text>
            <Pressable style={styles.modalButton} onPress={deleteNote}>
              <Text style={styles.modalButtonText}>بله</Text>
            </Pressable>
            <Pressable
              style={[styles.modalButton, { backgroundColor: "#FF5555" }]}
              onPress={() => {
                setShowDeleteModal(false);
                setNoteToDelete(null);
              }}
            >
              <Text style={styles.modalButtonText}>خیر</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const { width } = Dimensions.get("window");
export default NotesScreen;