import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
  NavigationIndependentTree,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { Fragment, useEffect, useState } from "react";

import { useColorScheme } from "@/hooks/useColorScheme";
import LoadingScreen from "../components/LoadingScreen";
import HomeScreen from "./(tabs)/HomeScreen";
import Setting from "./(tabs)/Setting";
import { ThemeProvider } from "@/context/ThemeContext";
import { SettingsProvider } from "@/context/SettingsContext";

SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/A Iranian Sans/irsans.ttf"),
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      setTimeout(() => setIsLoading(false), 3000); 
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider> 
      <SettingsProvider>
      <NavigationIndependentTree>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Setting" 
              component={Setting} 
              options={{ headerShown: false }} 
            />
          </Stack.Navigator>
        </NavigationContainer>
      </NavigationIndependentTree>        
      </SettingsProvider>

    </ThemeProvider> 
  );
}