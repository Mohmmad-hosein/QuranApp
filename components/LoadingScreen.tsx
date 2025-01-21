import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, Text, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const LoadingScreen: React.FC = () => {
  const [displayText, setDisplayText] = useState('');
  const [index, setIndex] = useState(0);
  const text = 'خدا چه می‌گوید...';

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayText(prev => prev + text.charAt(index));
      setIndex(prev => prev + 1);
    }, 130); 

    if (index === text.length) {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [index]);

  return (
    <LinearGradient colors={['#7253EF', '#192163']} style={styles.container}>
      <View style={styles.overlay}>
        <Image
          source={require('../assets/images/quran.png')}
          style={styles.quranImage}
        />
        <View style={styles.brainQuestion}>
          <Image
            source={require('../assets/images/brain-lateral.png')}
            style={styles.brainImage}
          />
          <Text style={styles.Question} >?</Text>
        </View>
        <Text style={styles.text}>{displayText}</Text>
      </View>
    </LinearGradient>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quranImage: {
    width: width * 1,
    height: height * 1,
    position: 'absolute',
    opacity: 0.35,
  },
  brainQuestion: {
    position: 'absolute',
    top: '18%',
    alignItems: 'center',
  },
  Question :{
    fontFamily: "inter",
    color: "#3A8BF5",
    position: 'absolute',
    textShadowColor:'black',
    textShadowOffset:{width: 2, height: 2},
    top: '-10%',
    fontSize: 180,

  },
  brainImage: {
    width: width * 0.75,
    height: height * 0.28,
    opacity: 0.43,
  },
  text: {
    fontSize: 35,
    fontWeight: 'bold',
    textShadowColor:'black',
    textShadowOffset:{width: 2, height: 2},
    color: '#509CFF',
    fontFamily: '("../font/A Iranian Sans/irsansb.ttf")',
    position: 'absolute',
    top: '70%',
  },
});

export default LoadingScreen;
