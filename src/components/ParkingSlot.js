import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

const slotStyles = {
  available: { backgroundColor: '#D9F5DA', borderColor: colors.success },
  occupied: { backgroundColor: '#FDE1E0', borderColor: colors.danger },
  reserved: { backgroundColor: '#FFF0D5', borderColor: colors.warning },
  entered: { backgroundColor: '#E8E0FF', borderColor: '#8A67FF' },
  selected: { backgroundColor: '#FCECC4', borderColor: colors.warning },
};

const statusLabels = {
  available: 'Available',
  occupied: 'Occupied',
  reserved: 'Reserved',
  entered: 'Entered',
};

export default function ParkingSlot({ label, status, selected, onPress }) {
  const state = selected ? 'selected' : status;
  return (
    <TouchableOpacity style={[styles.container, slotStyles[state]]} onPress={onPress} disabled={status !== 'available'} activeOpacity={0.8}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.status}>{statusLabels[status] || 'Reserved'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    flex: 1,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 6,
  },
  label: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  status: {
    marginTop: 10,
    fontSize: 12,
    color: colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
