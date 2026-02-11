/**
 * Color palette extracted from Figma design
 * Update these values to match your medium-fidelity prototype
 */
export const colors = {
  // Primary colors
  primary: "#000000", // Update with your primary color from Figma
  primaryLight: "#333333",
  primaryDark: "#000000",

  // Secondary colors
  secondary: "#000000", // Update with your secondary color from Figma
  secondaryLight: "#333333",
  secondaryDark: "#000000",

  // Background colors
  background: "#FFFFFF",
  backgroundSecondary: "#F5F5F5",
  backgroundTertiary: "#E5E5E5",

  // Text colors
  text: "#000000",
  textSecondary: "#666666",
  textTertiary: "#999999",
  textInverse: "#FFFFFF",

  // UI element colors
  border: "#E0E0E0",
  divider: "#E0E0E0",
  error: "#FF0000",
  success: "#00FF00",
  warning: "#FFA500",
  info: "#0066FF",

  // AR/VR specific colors
  arOverlay: "rgba(0, 0, 0, 0.5)",
  arHighlight: "#00FF00",

  // Brand/Accent colors
  purple: "#8B5CF6", // Darker purple theme color (less pink)
  grayBlack: "#2A2A2A", // Grayish black for secondary actions

  // Add any other colors from your Figma design
};

export type Colors = typeof colors;
