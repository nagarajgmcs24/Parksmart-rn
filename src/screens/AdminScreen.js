import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Button, Alert } from 'react-native';
import { getParkingSpots, updateParkingSpot } from '../services/firestore';

export default function AdminScreen() {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSpots();
  }, []);

  const loadSpots = async () => {
    try {
      const data = await getParkingSpots();
      setSpots(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load spots');
    } finally {
      setLoading(false);
    }
  };

  const toggleSpotStatus = async (spotId, currentStatus) => {
    const newStatus = currentStatus === 'free' ? 'occupied' : 'free';
    try {
      await updateParkingSpot(spotId, { status: newStatus });
      setSpots(spots.map(s => s.id === spotId ? { ...s, status: newStatus } : s));
      Alert.alert('Success', `Spot status updated to ${newStatus}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update spot');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Panel - Manage Spots</Text>
      <FlatList
        data={spots}
        keyExtractor={item => item.id}
        refreshing={loading}
        onRefresh={loadSpots}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.spotId}>Spot: {item.id}</Text>
            <Text>Status: <Text style={{ color: item.status === 'free' ? 'green' : 'red' }}>{item.status}</Text></Text>
            <Text>Price: ₹{item.pricePerHour}/hour</Text>
            <Button
              title={`Mark as ${item.status === 'free' ? 'Occupied' : 'Free'}`}
              onPress={() => toggleSpotStatus(item.id, item.status)}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: 'white', padding: 12, marginBottom: 8, borderRadius: 8 },
  spotId: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
});
