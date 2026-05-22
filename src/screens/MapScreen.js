import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Button, Alert } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { getParkingSpots } from '../services/firestore';
import { getReports } from '../services/firestore';

export default function MapScreen({ navigation }) {
  const [spots, setSpots] = useState(null);
  const [reports, setReports] = useState([]);
  const [userLocation, setUserLocation] = useState({ latitude: 12.9716, longitude: 77.5946 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const spotsData = await getParkingSpots();
      setSpots(spotsData);
      const reportsData = await getReports(userLocation.latitude, userLocation.longitude);
      setReports(reportsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    }
  };

  if (!spots) return <ActivityIndicator style={styles.center} size="large" />;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {spots.map(s => (
          <Marker
            key={s.id}
            coordinate={{ latitude: s.latitude, longitude: s.longitude }}
            title={s.status}
            description={`₹${s.pricePerHour}/hour`}
            pinColor={s.status === 'free' ? 'green' : 'red'}
            onPress={() => navigation.navigate('Booking', { spot: s })}
          />
        ))}
        {reports.map((r, i) => (
          <Circle key={`report-${i}`} center={{ latitude: r.latitude, longitude: r.longitude }} radius={50} strokeColor="#E53935" />
        ))}
      </MapView>
      <View style={styles.buttonContainer}>
        <Button title="Refresh" onPress={loadData} />
        <Button title="Report Issue" onPress={() => navigation.navigate('Report', { ...userLocation })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: 12, backgroundColor: 'white' },
});
