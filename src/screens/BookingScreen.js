import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '../constants/theme';
import ParkingSlot from '../components/ParkingSlot';
import { subscribeToSlotsRealtime } from '../services/firestore';

const durationOptions = [
  { label: '1 hour', hours: 1, price: 50 },
  { label: '2 hours', hours: 2, price: 90 },
  { label: 'Full day', hours: 24, price: 250 },
];

const getTrafficPrediction = () => {
  const hour = new Date().getHours();
  if (hour >= 18) {
    return 'High traffic expected after 6 PM — book soon.';
  }
  if (hour >= 6 && hour < 12) {
    return 'Morning rush — reserve early for easy entry.';
  }
  if (hour >= 12 && hour < 18) {
    return 'Afternoon peak — nearby slots fill fast.';
  }
  return 'Evening calm — good time for quick parking.';
};

export default function BookingScreen({ navigation }) {
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(durationOptions[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToSlotsRealtime((slotList) => {
      setSlots(slotList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId);

  const handleContinue = () => {
    if (!selectedSlot) {
      Alert.alert('Pick a slot first', 'Select an available slot to continue.');
      return;
    }
    if (selectedSlot.status !== 'available') {
      Alert.alert('Slot unavailable', 'Please select a different available slot.');
      return;
    }

    navigation.navigate('Confirmation', {
      selectedSlot,
      durationOption: selectedDuration,
      totalPrice: selectedDuration.price,
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <Text style={styles.heading}>Choose your parking slot</Text>
      <Text style={styles.subtitle}>{getTrafficPrediction()}</Text>

      <View style={styles.grid}>
        {slots.map((slot) => (
          <ParkingSlot
            key={slot.id}
            label={slot.slotId || slot.id}
            status={slot.status || 'available'}
            selected={selectedSlotId === slot.id}
            onPress={() => {
              if (slot.status === 'available') {
                setSelectedSlotId(slot.id);
              }
            }}
          />
        ))}
      </View>

      <View style={styles.durationCard}>
        <Text style={styles.sectionTitle}>Parking duration</Text>
        <View style={styles.durationRow}>
          {durationOptions.map((option) => (
            <Pressable
              key={option.hours}
              style={[styles.durationOption, selectedDuration.hours === option.hours && styles.durationSelected]}
              onPress={() => setSelectedDuration(option)}
            >
              <Text style={[styles.durationLabel, selectedDuration.hours === option.hours && styles.durationSelectedLabel]}>{option.label}</Text>
              <Text style={[styles.durationPrice, selectedDuration.hours === option.hours && styles.durationSelectedLabel]}>₹{option.price}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Selected slot</Text>
        <Text style={styles.summaryValue}>{selectedSlot ? selectedSlot.slotId || selectedSlot.id : 'None selected'}</Text>
        <Text style={styles.summaryExtra}>{selectedSlot?.parkingArea || 'Choose a slot to see details'}</Text>
      </View>

      <Pressable
        style={[styles.bookButton, !selectedSlot && styles.bookButtonDisabled]}
        onPress={handleContinue}
        disabled={!selectedSlot}
      >
        <Text style={styles.bookButtonText}>Continue to confirmation</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pageContent: {
    padding: 20,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    color: colors.secondaryText,
    marginBottom: 22,
    lineHeight: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  durationCard: {
    backgroundColor: colors.panel,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 14,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durationOption: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: 14,
    marginRight: 10,
  },
  durationSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  durationLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  durationPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  durationSelectedLabel: {
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: colors.panel,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.secondaryText,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  summaryExtra: {
    marginTop: 6,
    color: colors.secondaryText,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  bookButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#A0D1A4',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

