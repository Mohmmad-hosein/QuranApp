import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import axios from "axios";
import { useTheme } from "@/context/ThemeContext";
import { useSettings } from "@/context/SettingsContext";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Config from "react-native-config"; // برای استفاده از متغیرهای محیطی

const AiScreen = () => {
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const { fontSize, fontType } = useSettings();
  const navigation = useNavigation();

  const colors = isDarkMode
    ? {
        background: ["#251663", "#060817"],
        buttonText: "#FFFFFF",
        buttonBackground: "#08326B",
        headerBackground: "rgba(255, 255, 255, 0.25)",
      }
    : {
        background: ["#7253EF", "#192163"],
        buttonText: "#fff",
        buttonBackground: "rgba(255, 255, 255, 0.2)",
        headerBackground: "rgba(255, 255, 255, 0.25)",
      };

  const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
      backgroundColor: colors.headerBackground,
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
      width: "90%",
    },
    headerText: {
      fontSize: fontSize ? parseInt(fontSize) : 24,
      color: colors.buttonText,
      fontWeight: "bold",
      fontFamily: fontType,
    },
    backButton: { padding: 10 },
    input: {
      height: 40,
      borderColor: "gray",
      borderWidth: 1,
      marginBottom: 16,
      paddingHorizontal: 8,
      color: colors.buttonText,
      backgroundColor: colors.buttonBackground,
      borderRadius: 10,
      width: "90%",
      alignSelf: "center",
    },
    chatContainer: { marginBottom: 20 },
    chatBubble: {
      padding: 10,
      borderRadius: 10,
      marginVertical: 5,
      maxWidth: "80%",
    },
    userBubble: { alignSelf: "flex-end", backgroundColor: "#3A8BF5" },
    aiBubble: { alignSelf: "flex-start", backgroundColor: "#08326B" },
    chatText: {
      color: "#fff",
      fontSize: fontSize ? parseInt(fontSize) : 16,
      fontFamily: fontType,
    },
    themeToggleButton: {
      position: "absolute",
      top: 20,
      right: 150,
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

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const savedChat = await AsyncStorage.getItem("chatHistory");
        if (savedChat) setChatHistory(JSON.parse(savedChat));
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    };
    loadChatHistory();
  }, []);

  const saveChatHistory = async (
    chat: Array<{ role: string; content: string }>
  ) => {
    try {
      await AsyncStorage.setItem("chatHistory", JSON.stringify(chat));
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  };


  const handleSend = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    const userMessage = { role: "user", content: input };
    const updatedChat = [...chatHistory, userMessage];
    setChatHistory(updatedChat);
    saveChatHistory(updatedChat);

    try {
      const result = await axios.post(
        "https://api.openai.com/v1/chat/completions", // آدرس صحیح API
        {
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "شما یک مشاور دینی هستید که به سوالات اسلامی پاسخ می‌دهید." },
            ...updatedChat,
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${Config.OPENAI_API_KEY}`, // استفاده از API Key در متغیر محیطی
            "Content-Type": "application/json",
          },
        }
      );

      const aiMessage = { role: "assistant", content: result.data.choices[0].message.content };
      const finalChat = [...updatedChat, aiMessage];
      setChatHistory(finalChat);
      saveChatHistory(finalChat);
    } catch (error) {
      console.error("Error details:", error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }

    setInput("");
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
          <Text style={styles.headerText}>هوش مصنوعی</Text>
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

        <View style={styles.chatContainer}>
          {chatHistory.map((message, index) => (
            <View
              key={index}
              style={[
                styles.chatBubble,
                message.role === "user" ? styles.userBubble : styles.aiBubble,
              ]}
            >
              <Text style={styles.chatText}>{message.content}</Text>
            </View>
          ))}
        </View>

        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="سوال دینی خود را بپرسید..."
          placeholderTextColor={colors.buttonText}
        />

        {isLoading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <Button title="ارسال" onPress={handleSend} />
        )}
      </ScrollView>
    </LinearGradient>
  );
};

export default AiScreen;
