import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const LoveButton = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  icon,
  loading = false,
  disabled = false,
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];

    if (disabled || loading) {
      baseStyle.push(styles.disabled);
    } else {
      baseStyle.push(styles[variant]);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`${size}Text`]];

    if (disabled || loading) {
      baseStyle.push(styles.disabledText);
    } else {
      baseStyle.push(styles[`${variant}Text`]);
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      <View style={styles.content}>
        {loading ? (
          <Text style={getTextStyle()}>💕</Text>
        ) : (
          <>
            {icon && (              <Ionicons
                name={icon}
                size={size === "small" ? 16 : size === "large" ? 24 : 20}
                color={
                  variant === "primary"
                    ? "#FFF"
                    : variant === "danger"
                    ? "#FFF"
                    : variant === "secondary"
                    ? "#9C0D4A"
                    : variant === "outline"
                    ? "#8A0D47"
                    : "#D81B60"
                }
                style={styles.icon}
              />
            )}
            <Text style={getTextStyle()}>{title}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E91E63",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: 8,
  }, // Variants
  primary: {
    backgroundColor: "#E91E63",
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 2,
    borderColor: "#C2185B",
    shadowColor: "#E91E63",
  },
  outline: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 2,
    borderColor: "#AD1457",
    shadowColor: "#C2185B",
  },
  danger: {
    backgroundColor: "#D32F2F",
    borderWidth: 0,
  },
  // Sizes
  small: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 48,
  },
  large: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    minHeight: 56,
  },
  // Text styles
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  primaryText: {
    color: "#FFF",
  secondaryText: {
    color: "#9C0D4A",
    fontWeight: "700",
  },
  outlineText: {
    color: "#8A0D47",
    fontWeight: "700",
  },
  dangerText: {
    color: "#FFF",
  },
  // Disabled state  disabled: {
    backgroundColor: "#DDD",
    borderColor: "#DDD",
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledText: {
    color: "#777",
  },
});

export default LoveButton;
