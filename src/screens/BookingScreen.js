import React, { useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet, Alert } from 'react-native';
import { createBooking } from '../services/firestore';
import { getCurrentUser } from '../services/auth';
import { Booking } from '../models/types';

export default function BookingScreen({ route, navigation }) {
  const { spot } = route.params;
  const [hours, setHours] = useState('1');
  const [loading, setLoading] = useState(false);

  const handleBook = async () => {
    if (!hours || Number(hours) <= 0) {
      Alert.alert('Error', 'Please enter valid hours');
      return;
    }
    setLoading(true);
    try {
      const user = getCurrentUser();
      const totalPrice = Number(hours) * spot.pricePerHour;
      const booking = new Booking(spot.id, user.uid, Number(hours), totalPrice);
      await createBooking(booking);
      Alert.alert('Success', `Booked for ${hours} hour(s) at ₹${totalPrice}`);
      navigation.navigate('Map');
    } catch (error) {
      Alert.alert('Booking Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book Parking Spot</Text>
      <View style={styles.card}>
        <Text>Spot ID: {spot.id}</Text>
        <Text>Location: ({spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)})</Text>
        <Text>Price: ₹{spot.pricePerHour}/hour</Text>
      </View>
      <TextInput
        value={hours}
        onChangeText={setHours}
        keyboardType="numeric"
        placeholder="Hours"
        style={styles.input}
      />
      <Text style={styles.total}>Total: ₹{(Number(hours) * spot.pricePerHour).toFixed(2)}</Text>
      <Button title={loading ? 'Booking...' : 'Confirm Booking'} onPress={handleBook} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#f5f5f5', padding: 12, marginBottom: 16, borderRadius: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 8, borderRadius: 8 },
  total: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
});

