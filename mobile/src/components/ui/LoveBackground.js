import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const LoveBackground = ({ children, variant = 'primary' }) => {  const getGradientColors = () => {
    switch (variant) {
      case 'secondary':
        return ['#FCE4EC', '#F8BBD9', '#F3E5F5'];
      case 'accent':
        return ['#D81B60', '#EC407A', '#F06292'];
      case 'soft':
        return ['#FFEEF3', '#FCE4EC', '#FFF0F5'];
      default:
        return ['#F8BBD9', '#F48FB1', '#FCE4EC'];
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getGradientColors()}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Floating Hearts Background */}
      <View style={styles.heartsContainer}>
        <Text style={[styles.heart, styles.heart1]}>💕</Text>
        <Text style={[styles.heart, styles.heart2]}>💖</Text>
        <Text style={[styles.heart, styles.heart3]}>💗</Text>
        <Text style={[styles.heart, styles.heart4]}>💝</Text>
        <Text style={[styles.heart, styles.heart5]}>💞</Text>
        <Text style={[styles.heart, styles.heart6]}>💓</Text>
      </View>
      
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  heartsContainer: {
    position: 'absolute',
    width: width,
    height: height,
    overflow: 'hidden',
  },
  heart: {
    position: 'absolute',
    fontSize: 20,
    opacity: 0.1,
  },
  heart1: {
    top: '10%',
    left: '10%',
    fontSize: 24,
  },
  heart2: {
    top: '20%',
    right: '15%',
    fontSize: 18,
  },
  heart3: {
    top: '40%',
    left: '5%',
    fontSize: 22,
  },
  heart4: {
    top: '60%',
    right: '10%',
    fontSize: 20,
  },
  heart5: {
    top: '80%',
    left: '20%',
    fontSize: 16,
  },
  heart6: {
    top: '30%',
    left: '80%',
    fontSize: 26,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});

export default LoveBackground;