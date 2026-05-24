import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, Alert, Linking, ScrollView } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { colors } from '../constants/theme';
import {
  getNearbyParkingAreas,
  subscribeToParkingAreasRealtime,
  getReports,
  getUserFavorites,
  updateUserFavorites,
} from '../services/firestore';
import { getCurrentUser } from '../services/auth';

const filterDefinitions = [
  { key: 'availableOnly', label: 'Available' },
  { key: 'evSupport', label: 'EV' },
  { key: 'largeVehicle', label: 'Large' },
];

export default function MapScreen({ navigation }) {
  const [parkingAreas, setParkingAreas] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState(null);
  const [activeFilters, setActiveFilters] = useState({ availableOnly: false, evSupport: false, largeVehicle: false });
  const [sortKey, setSortKey] = useState('nearest');
  const [nearestAreas, setNearestAreas] = useState([]);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    requestLocationPermission();
    const unsubscribe = subscribeToParkingAreasRealtime((areas) => {
      setParkingAreas(areas);
      setLoading(false);
    });

    const currentUser = getCurrentUser();
    if (currentUser) {
      getUserFavorites(currentUser.uid).then(setFavorites).catch(() => {});
    }

    return () => unsubscribe && unsubscribe();
  }, []);

  useEffect(() => {
    if (!location || parkingAreas.length === 0) return;
    refreshNearby();
  }, [location, parkingAreas, activeFilters, sortKey]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location permission needed', 'Enable location to discover nearby parking.');
        setLoading(false);
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      setLoading(false);
    } catch (error) {
      Alert.alert('Location error', error.message);
      setLoading(false);
    }
  };

  const refreshNearby = async () => {
    try {
      const areas = await getNearbyParkingAreas(location.latitude, location.longitude, activeFilters);
      const sorted = [...areas].sort((a, b) => {
        if (sortKey === 'cheapest') return (a.pricePerHour || 0) - (b.pricePerHour || 0);
        if (sortKey === 'available') return (b.availableSlots || 0) - (a.availableSlots || 0);
        if (sortKey === 'nearest') return a.distanceKm - b.distanceKm;
        return a.distanceKm - b.distanceKm;
      });
      setNearestAreas(sorted);
    } catch (error) {
      Alert.alert('Nearby parking error', error.message);
    }
  };

  const toggleFavorite = async (areaId) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      Alert.alert('Login required', 'Please sign in to save favorites.');
      return;
    }
    const nextFavorites = favorites.includes(areaId)
      ? favorites.filter((id) => id !== areaId)
      : [...favorites, areaId];
    setFavorites(nextFavorites);
    try {
      await updateUserFavorites(currentUser.uid, nextFavorites);
    } catch (error) {
      Alert.alert('Favorites error', error.message);
    }
  };

  const areaStatusColor = (area) => {
    if (area.availableSlots === 0) return colors.danger;
    if (area.reservedSlots > 0 || area.occupiedSlots > 0) return colors.warning;
    return colors.success;
  };

  const openNavigation = (area) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${area.latitude},${area.longitude}&travelmode=driving`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Navigation failed', 'Unable to open navigation app.');
    });
  };

  const toggleFilter = (key) => {
    setActiveFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const recommendations = useMemo(() => {
    if (nearestAreas.length === 0) return 'No nearby parking found.';
    const best = nearestAreas[0];
    if (best.availableSlots === 0) return 'Parking is busy right now. Try another area.';
    if (best.pricePerHour <= 50) return `Best value: ${best.name} at ₹${best.pricePerHour}/hr.`;
    return `Try ${best.name}: nearest and available.`;
  }, [nearestAreas]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <MapView
        style={styles.map}
        region={location ? { ...location, latitudeDelta: 0.05, longitudeDelta: 0.05 } : undefined}
        showsUserLocation
      >
        {parkingAreas.map((area) => (
          <Marker
            key={area.id}
            coordinate={{ latitude: area.latitude, longitude: area.longitude }}
            title={area.name}
            description={`${area.availableSlots || 0}/${area.capacity || 0} available`}
            pinColor={areaStatusColor(area)}
            onPress={() => setSelectedArea(area)}
          />
        ))}
        {location && <Circle center={location} radius={120} strokeColor={colors.primary} fillColor={`${colors.primary}22`} />}
      </MapView>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filterDefinitions.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterChip, activeFilters[filter.key] && styles.filterChipActive]}
              onPress={() => toggleFilter(filter.key)}
            >
              <Text style={[styles.filterText, activeFilters[filter.key] && styles.filterTextActive]}>{filter.label}</Text>
            </TouchableOpacity>
          ))}
          {['nearest', 'cheapest', 'available'].map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.filterChip, sortKey === key && styles.filterChipActive]}
              onPress={() => setSortKey(key)}
            >
              <Text style={[styles.filterText, sortKey === key && styles.filterTextActive]}>{key}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Nearby parking</Text>
        <Text style={styles.summaryValue}>{recommendations}</Text>
      </View>

      <ScrollView style={styles.areaList} contentContainerStyle={styles.areaListContent}>
        {nearestAreas.map((area) => (
          <TouchableOpacity key={area.id} style={styles.areaCard} onPress={() => setSelectedArea(area)}>
            <View style={styles.areaHeader}>
              <Text style={styles.areaName}>{area.name}</Text>
              <TouchableOpacity onPress={() => toggleFavorite(area.id)}>
                <Text style={[styles.favoriteIcon, favorites.includes(area.id) ? styles.favoriteActive : null]}>{favorites.includes(area.id) ? '★' : '☆'}</Text>
              </TouchableOpacity>
              <View style={[styles.statusBadge, { backgroundColor: areaStatusColor(area) }]}>
                <Text style={styles.statusBadgeText}>{area.availableSlots > 0 ? 'Available' : 'Full'}</Text>
              </View>
            </View>
            <Text style={styles.areaSub}>{area.distanceKm?.toFixed(1)} km away · ₹{area.pricePerHour}/hr</Text>
            <View style={styles.areaMetaRow}>
              <Text style={styles.areaMeta}>{area.capacity || 0} slots</Text>
              {area.evSupport && <Text style={styles.areaMeta}>EV</Text>}
              {area.largeVehicle && <Text style={styles.areaMeta}>Large</Text>}
            </View>
            <TouchableOpacity style={styles.navigateButton} onPress={() => openNavigation(area)}>
              <Text style={styles.navigateText}>Navigate</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedArea && (
        <View style={styles.detailTray}>
          <Text style={styles.detailTitle}>{selectedArea.name}</Text>
          <Text style={styles.detailDescription}>{selectedArea.description || 'Smart city parking area with live slot updates.'}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Capacity</Text>
            <Text style={styles.detailValue}>{selectedArea.capacity || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={styles.detailValue}>₹{selectedArea.pricePerHour}/hr</Text>
          </View>
          <TouchableOpacity style={styles.actionButton} onPress={() => openNavigation(selectedArea)}>
            <Text style={styles.actionText}>Open in Maps</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  filterBar: { position: 'absolute', top: 24, left: 0, right: 0, paddingHorizontal: 12 },
  filterScroll: { alignItems: 'center' },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colors.panel,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.text, fontWeight: '700' },
  filterTextActive: { color: '#fff' },
  summaryCard: {
    position: 'absolute',
    top: 90,
    left: 12,
    right: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLabel: { fontSize: 12, color: colors.secondaryText, marginBottom: 6, fontWeight: '700' },
  summaryValue: { fontSize: 15, color: colors.text, fontWeight: '700' },
  areaList: { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '46%' },
  areaListContent: { paddingBottom: 24 },
  areaCard: {
    backgroundColor: colors.panel,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  areaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  areaName: { fontSize: 16, fontWeight: '800', color: colors.text },
  favoriteIcon: { fontSize: 20, marginLeft: 8 },
  favoriteActive: { color: '#FFD700' },
  areaSub: { fontSize: 13, color: colors.secondaryText, marginBottom: 10 },
  areaMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  areaMeta: { fontSize: 12, color: colors.secondaryText, marginRight: 12 },
  statusBadge: { borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  statusBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  navigateButton: { marginTop: 8, backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  navigateText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  detailTray: {
    position: 'absolute',
    bottom: '46%',
    left: 12,
    right: 12,
    backgroundColor: colors.panel,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 6 },
  detailDescription: { fontSize: 14, color: colors.secondaryText, marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  detailLabel: { fontSize: 13, color: colors.secondaryText },
  detailValue: { fontSize: 15, fontWeight: '700', color: colors.text },
  actionButton: { backgroundColor: colors.primary, borderRadius: 18, alignItems: 'center', paddingVertical: 14, marginTop: 10 },
  actionText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
