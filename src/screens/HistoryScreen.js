import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { getUserBookings } from '../services/firestore';
import { getCurrentUser } from '../services/auth';

export default function HistoryScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    const user = getCurrentUser();
    if (user) {
      const bkgs = await getUserBookings(user.uid);
      setBookings(bkgs);
    }
    setLoading(false);
  };

  if (loading) return <ActivityIndicator style={styles.center} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Booking History</Text>
      {bookings.length === 0 ? (
        <Text style={styles.empty}>No bookings yet</Text>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text>Spot: {item.spotId}</Text>
              <Text>Hours: {item.hours}</Text>
              <Text>Price: ₹{item.totalPrice}</Text>
              <Text>Status: {item.status}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: 'white', padding: 12, marginBottom: 8, borderRadius: 8 },
  empty: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#999' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
