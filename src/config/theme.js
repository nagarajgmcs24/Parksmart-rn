import React from 'react';
import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#1E88E5',
  secondary: '#43A047',
  danger: '#E53935',
  warning: '#FDD835',
  info: '#29B6F6',
  light: '#F5F5F5',
  dark: '#212121',
  border: '#E0E0E0',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const globalStyles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.light,
  },
  screenPadding: {
    padding: spacing.lg,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    marginTop: spacing.md,
  },
  inputField: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: 14,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
