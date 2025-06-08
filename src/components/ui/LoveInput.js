import React from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LoveInput = ({ 
  value, 
  onChangeText, 
  placeholder, 
  secureTextEntry = false, 
  error, 
  icon,
  ...props 
}) => {
  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, error && styles.errorContainer]}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={20} 
            color="#FF69B4" 
            style={styles.icon} 
          />
        )}        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#D27796"
          secureTextEntry={secureTextEntry}
          {...props}
        />
      </View>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFB6C1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#FF69B4',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  errorContainer: {
    borderColor: '#FF6B6B',
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#8B0000',
    fontWeight: '500',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
    fontWeight: '500',
  },
});

export default LoveInput;