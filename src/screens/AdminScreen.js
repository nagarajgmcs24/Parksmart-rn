import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { colors } from '../constants/theme';
import { getCurrentUser } from '../services/auth';
import {
  createSlot,
  removeSlot,
  updateSlotStatus,
  updateBooking,
  getParkingStats,
  getParkingAnalytics,
  createParkingArea,
  removeParkingArea,
  updateParkingArea,
  cancelBooking,
  completeBooking,
  checkAdminAccess,
  subscribeToSlotsRealtime,
  subscribeToBookingsRealtime,
  subscribeToParkingAreasRealtime,
  subscribeToUsersRealtime,
} from '../services/firestore';
import StatCard from '../components/StatCard';

export default function AdminScreen({ navigation }) {
  const [slots, setSlots] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [areas, setAreas] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    totalBookings: 0,
    activeBookings: 0,
    cancelledBookings: 0,
    availableSlots: 0,
    occupiedSlots: 0,
    peakBookingHour: 'No bookings yet',
    peakBookingCount: 0,
  });
  const [analytics, setAnalytics] = useState({
    totalBookings: 0,
    activeBookings: 0,
    dailyRevenue: 0,
    occupancyPercentage: 0,
    peakHour: 'No data',
    quietHour: 'No data',
  });
  const [slotFilter, setSlotFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [adminReady, setAdminReady] = useState(false);

  const refreshStats = async () => {
    try {
      const result = await getParkingStats();
      setStats(result);
      const analyticsResult = await getParkingAnalytics();
      setAnalytics(analyticsResult);
    } catch (error) {
      Alert.alert('Unable to load stats', error.message);
    }
  };

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      return;
    }

    const verifyAdmin = async () => {
      try {
        const isAdmin = await checkAdminAccess(currentUser.email);
        if (!isAdmin) {
          navigation.replace('AccessDenied');
          return;
        }
        setAdminReady(true);
      } catch (error) {
        Alert.alert('Access error', error.message);
      }
    };
    verifyAdmin();
  }, [navigation]);

  useEffect(() => {
    if (!adminReady) return;

    setLoading(true);
    const unsubscribeSlots = subscribeToSlotsRealtime((slotList) => {
      setSlots(slotList);
    });
    const unsubscribeBookings = subscribeToBookingsRealtime((bookingList) => {
      setBookings(bookingList);
    });
    const unsubscribeUsers = subscribeToUsersRealtime((userList) => {
      setUsers(userList);
    });
    const unsubscribeAreas = subscribeToParkingAreasRealtime((areaList) => {
      setAreas(areaList);
    });

    refreshStats().finally(() => setLoading(false));
    return () => {
      unsubscribeSlots();
      unsubscribeBookings();
      unsubscribeUsers();
      unsubscribeAreas();
    };
  }, [adminReady]);

  useEffect(() => {
    if (!adminReady) return;
    refreshStats();
  }, [slots, bookings, adminReady]);

  const handleAddSlot = async () => {
    const slotId = `slot-${Date.now()}`;
    try {
      await createSlot({ slotId, status: 'available', parkingArea: 'Campus Lot' });
      Alert.alert('Slot added', `New slot ${slotId} has been created.`);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleAddArea = async () => {
    const areaId = `area-${Date.now()}`;
    try {
      await createParkingArea({
        name: `New Parking ${areaId}`,
        latitude: 12.9716 + Math.random() * 0.02,
        longitude: 77.5946 + Math.random() * 0.02,
        capacity: 40,
        availableSlots: 40,
        occupiedSlots: 0,
        reservedSlots: 0,
        pricePerHour: 60,
        evSupport: false,
        largeVehicle: false,
        description: 'Add coordinates and pricing details here.',
      });
      Alert.alert('Parking area added', `New parking area ${areaId} has been created.`);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleToggleAreaFeature = async (area, field) => {
    try {
      await updateParkingArea(area.id, { [field]: !area[field] });
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRemoveArea = async (areaId) => {
    Alert.alert('Remove area', 'Delete this parking area?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeParkingArea(areaId);
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const handleToggleStatus = async (slot) => {
    try {
      const nextStatus = slot.status === 'available' ? 'occupied' : 'available';
      await updateSlotStatus(slot.id, nextStatus);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    Alert.alert('Delete slot', 'Remove this slot from inventory?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeSlot(slotId);
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const handleVerifyBooking = async (booking) => {
    try {
      const bookingState = booking.bookingStatus || booking.status;
      if (bookingState === 'cancelled' || bookingState === 'completed') {
        Alert.alert('Cannot verify', 'This booking is already closed.');
        return;
      }
      await updateBooking(booking.id, { status: 'entered', bookingStatus: 'entered' });
      if (booking.slotId) {
        await updateSlotStatus(booking.slotId, 'entered');
      }
      Alert.alert('Verified', `Booking ${booking.bookingId} marked entered.`);
    } catch (error) {
      Alert.alert('Verification failed', error.message);
    }
  };

  const handleCancelBooking = async (booking) => {
    try {
      await cancelBooking(booking.id);
      Alert.alert('Booking cancelled', `Booking ${booking.bookingId} has been cancelled.`);
    } catch (error) {
      Alert.alert('Cancel failed', error.message);
    }
  };

  const handleCompleteBooking = async (booking) => {
    try {
      await completeBooking(booking.id);
      Alert.alert('Completed', `Booking ${booking.bookingId} marked completed.`);
    } catch (error) {
      Alert.alert('Complete failed', error.message);
    }
  };

  if (!adminReady || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Admin Dashboard</Text>

      <View style={styles.summaryRow}>
        <StatCard label="Users" value={stats.totalUsers.toString()} accent={colors.primary} />
        <StatCard label="Bookings" value={analytics.totalBookings.toString()} accent={colors.success} />
        <StatCard label="Active" value={analytics.activeBookings.toString()} accent={colors.success} />
      </View>

      <View style={styles.summaryRow}>
        <StatCard label="Revenue" value={`₹${analytics.dailyRevenue}`} accent={colors.primary} />
        <StatCard label="Occupancy" value={`${analytics.occupancyPercentage}%`} accent={colors.warning} />
      </View>

      <View style={styles.summaryRow}>
        <StatCard label="Cancelled" value={stats.cancelledBookings.toString()} accent={colors.danger} />
        <StatCard label="Peak hour" value={analytics.peakHour} accent={colors.warning} />
      </View>

      <Pressable style={styles.addButton} onPress={handleAddArea}>
        <Text style={styles.addButtonText}>Add parking area</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Managed parking areas</Text>
      {areas.length === 0 ? (
        <Text style={styles.emptyText}>No parking areas configured yet.</Text>
      ) : (
        areas.map((area) => (
          <View key={area.id} style={styles.card}>
            <Text style={styles.cardTitle}>{area.name}</Text>
            <Text style={styles.cardMeta}>{area.description || 'Smart parking area'}</Text>
            <Text style={styles.cardText}>Price: ₹{area.pricePerHour}/hr</Text>
            <Text style={styles.cardText}>Capacity: {area.capacity || 0}</Text>
            <Text style={styles.cardText}>Available: {area.availableSlots || 0}</Text>
            <View style={styles.buttonRow}>
              <Pressable style={styles.actionButton} onPress={() => handleToggleAreaFeature(area, 'evSupport')}>
                <Text style={styles.actionText}>{area.evSupport ? 'EV off' : 'EV on'}</Text>
              </Pressable>
              <Pressable style={styles.actionButton} onPress={() => handleToggleAreaFeature(area, 'largeVehicle')}>
                <Text style={styles.actionText}>{area.largeVehicle ? 'Large off' : 'Large on'}</Text>
              </Pressable>
              <Pressable style={[styles.actionButton, styles.deleteButton]} onPress={() => handleRemoveArea(area.id)}>
                <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      <View style={styles.filterRow}>
        {['all', 'available', 'occupied', 'reserved', 'entered', 'cancelled'].map((filter) => (
          <Pressable
            key={filter}
            style={[styles.filterChip, slotFilter === filter && styles.filterChipActive]}
            onPress={() => setSlotFilter(filter)}
          >
            <Text style={[styles.filterText, slotFilter === filter && styles.filterTextActive]}>{filter}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Active slots</Text>
      <FlatList
        data={slots.filter((item) => slotFilter === 'all' || item.status === slotFilter)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.slotId || item.id}</Text>
            <Text style={styles.cardMeta}>{item.parkingArea || 'Unknown area'}</Text>
            <Text style={styles.cardText}>Status: {item.status}</Text>
            <View style={styles.buttonRow}>
              <Pressable style={styles.actionButton} onPress={() => handleToggleStatus(item)}>
                <Text style={styles.actionText}>{item.status === 'available' ? 'Mark occupied' : 'Mark free'}</Text>
              </Pressable>
              <Pressable style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDeleteSlot(item.id)}>
                <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <Text style={styles.sectionTitle}>Latest bookings</Text>
      {bookings.length === 0 ? (
        <Text style={styles.emptyText}>No bookings yet. Create a booking to see them here.</Text>
      ) : (
        bookings.slice(0, 6).map((booking) => (
          <View key={booking.id} style={styles.bookingCard}>
            <Text style={styles.cardTitle}>{booking.slotId}</Text>
            <Text style={styles.cardText}>Area: {booking.parkingArea || 'Campus Lot'}</Text>
            <Text style={styles.cardText}>User: {booking.userName || booking.userId}</Text>
            <Text style={styles.cardText}>Status: {booking.bookingStatus || booking.status}</Text>
            <Text style={styles.cardText}>Price: ₹{booking.totalPrice || 0}</Text>
            <View style={styles.buttonRow}>
              <Pressable style={styles.actionButton} onPress={() => handleVerifyBooking(booking)}>
                <Text style={styles.actionText}>Verify QR</Text>
              </Pressable>
              <Pressable style={styles.actionButton} onPress={() => handleCancelBooking(booking)}>
                <Text style={styles.actionText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.actionButton, styles.completeButton]} onPress={() => handleCompleteBooking(booking)}>
                <Text style={styles.actionText}>Complete</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Users</Text>
      {users.length === 0 ? (
        <Text style={styles.emptyText}>No users yet.</Text>
      ) : (
        users.slice(0, 4).map((user) => (
          <View key={user.uid} style={styles.bookingCard}>
            <Text style={styles.cardTitle}>{user.name || 'Unnamed'}</Text>
            <Text style={styles.cardText}>{user.email}</Text>
            <Text style={styles.cardText}>Role: {user.role || 'user'}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  filterChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: colors.panel,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.text,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  filterTextActive: {
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: colors.panel,
    borderRadius: 18,
    padding: 18,
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 8,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 22,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  list: {
    paddingBottom: 10,
  },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookingCard: {
    backgroundColor: colors.panel,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  cardMeta: {
    fontSize: 13,
    color: colors.secondaryText,
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    color: colors.secondaryText,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#F8D7DA',
    marginRight: 0,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
  },
  deleteText: {
    color: colors.danger,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
