import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useTheme } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AiScreen = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const { isDarkMode } = useTheme();
  const { fontSize, fontType } = useSettings();
  const navigation = useNavigation();

  // شناسه کاربر (اگر کاربر لاگین کرده باشد، از شناسه کاربری او استفاده کنید)
  const userId = 'user123'; // این را می‌توانید از سیستم احراز هویت دریافت کنید

  const lightColors = {
    background: ["#7253EF", "#192163"],
    buttonText: "#fff",
    buttonBackground: "rgba(255, 255, 255, 0.2)",
    headerBackground: "rgba(255, 255, 255, 0.25)",
  };

  const darkColors = {
    background: ["#251663", "#060817"],
    buttonText: "#FFFFFF",
    buttonBackground: "#08326B",
    headerBackground: "rgba(255, 255, 255, 0.25)",
  };

  const colors = isDarkMode ? darkColors : lightColors;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      backgroundColor: colors.headerBackground,
      width: '90%',
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
    input: {
      height: 40,
      borderColor: 'gray',
      borderWidth: 1,
      marginBottom: 16,
      paddingHorizontal: 8,
      color: colors.buttonText,
      backgroundColor: colors.buttonBackground,
      borderRadius: 10,
      width: '90%',
      alignSelf: 'center',
    },
    response: {
      marginTop: 16,
      color: colors.buttonText,
      fontSize: fontSize ? parseInt(fontSize) : 16,
      fontFamily: fontType,
      width: '90%',
      alignSelf: 'center',
    },
    chatContainer: {
      marginBottom: 20,
    },
    chatBubble: {
      padding: 10,
      borderRadius: 10,
      marginVertical: 5,
      maxWidth: '80%',
    },
    userBubble: {
      alignSelf: 'flex-end',
      backgroundColor: '#3A8BF5',
    },
    aiBubble: {
      alignSelf: 'flex-start',
      backgroundColor: '#08326B',
    },
    chatText: {
      color: '#fff',
      fontSize: fontSize ? parseInt(fontSize) : 16,
      fontFamily: fontType,
    },
  });

  // بارگذاری چت‌های کاربر از AsyncStorage
  const loadChatHistory = async () => {
    try {
      const savedChat = await AsyncStorage.getItem(`chat_${userId}`);
      if (savedChat) {
        setChatHistory(JSON.parse(savedChat));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  // ذخیره چت‌های کاربر در AsyncStorage
  const saveChatHistory = async (chat: Array<{ role: string; content: string }>) => {
    try {
      await AsyncStorage.setItem(`chat_${userId}`, JSON.stringify(chat));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };

  useEffect(() => {
    loadChatHistory();
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const updatedChat = [...chatHistory, userMessage];
    setChatHistory(updatedChat);
    saveChatHistory(updatedChat);

    // sk-213a6d4d67024c25b067902708e95356

    try {
        const result = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            {
              model: "DeepSeek-v3",
              messages: updatedChat,
            },
            {
              headers: {
                'Authorization': `Bearer sk-213a6d4d67024c25b067902708e95356`,
                'Content-Type': 'application/json',
              },
            }
          );

      const aiMessage = { role: 'assistant', content: result.data.choices[0].message.content };
      const finalChat = [...updatedChat, aiMessage];
      setChatHistory(finalChat);
      saveChatHistory(finalChat);
      setResponse(aiMessage.content);
    } catch (error) {
      console.error(error);
      setResponse('خطا در ارتباط با سرور');
    }

    setInput('');
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
        </View>

        <View style={styles.chatContainer}>
          {chatHistory.map((message, index) => (
            <View
              key={index}
              style={[
                styles.chatBubble,
                message.role === 'user' ? styles.userBubble : styles.aiBubble,
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
          placeholder="سوال خود را بپرسید..."
          placeholderTextColor={colors.buttonText}
        />
        <Button title="ارسال" onPress={handleSend} />
      </ScrollView>
    </LinearGradient>
  );
};

export default AiScreen;