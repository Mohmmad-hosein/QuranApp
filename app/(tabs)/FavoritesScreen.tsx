import React, { useMemo } from "react";
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
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Surah } from "@/types";
import { useFavorites } from "@/context/FavoritesContext";

const FavoritesScreen = () => {
  const { isDarkMode } = useTheme();
  const { fontSize, fontType } = useSettings();
  const navigation = useNavigation();
  const { favorites, removeFromFavorites } = useFavorites();

  const lightColors = {
    background: ["#5331DD", "#192163"],
    buttonText: "#fff",
    headerBackground: "rgba(255, 255, 255, 0.25)",
    borderColor: "rgb(255, 255, 255)",
    resultItemBackground: "rgba(105, 166, 245, 0.3)",
  };

  const darkColors = {
    background: ["#251663", "#060817"],
    buttonText: "#FFFFFF",
    headerBackground: "rgba(255, 255, 255, 0.25)",
    borderColor: "rgb(255, 255, 255)",
    resultItemBackground: "#08326B",
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
        fontFamily: fontType as string,
      },
      backButton: {
        padding: 10,
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
        fontFamily: fontType as string,
      },
      removeButton: {
        padding: 5,
      },
    });
  }, [isDarkMode, fontSize, fontType]);

  const renderItem = ({ item }: { item: Surah }) => (
    <View style={styles.resultItem}>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFromFavorites(item.number)}
      >
        <Feather name="trash-2" size={20} color={colors.buttonText} />
      </TouchableOpacity>
      <Text style={styles.resultText}>{item.name}</Text>
    </View>
  );

  return (
    <LinearGradient colors={colors.background} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color={colors.buttonText} />
        </TouchableOpacity>
        <Text style={styles.headerText}>علاقه‌مندی‌ها</Text>
      </View>
      <FlatList
        data={favorites}
        renderItem={renderItem}
        keyExtractor={(item: Surah) => item.number.toString()}
        contentContainerStyle={styles.resultsContainer}
        ListEmptyComponent={
          <Text style={styles.resultText}>هیچ سوره‌ای در علاقه‌مندی‌ها وجود ندارد.</Text>
        }
      />
    </LinearGradient>
  );
};

const { width } = Dimensions.get("window");
export default FavoritesScreen;