// Enhanced Firestore service with all CRUD operations
import { db } from '../config/firebase';
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

const usersCollection = collection(db, 'users');
const adminsCollection = collection(db, 'admins');
const slotsCollection = collection(db, 'parkingSpots');
const parkingAreasCollection = collection(db, 'parkingAreas');
const bookingsCollection = collection(db, 'bookings');
const reportsCollection = collection(db, 'reports');
const analyticsCollection = collection(db, 'analytics');

function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getTimeKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function parseFirestoreTimestamp(timestamp) {
  if (!timestamp) return null;
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
  return new Date(timestamp);
}

async function expireBookingIfNeeded(booking) {
  if (!booking?.expiresAt) return false;
  const expiresAtDate = parseFirestoreTimestamp(booking.expiresAt);
  const bookingState = booking.bookingStatus || booking.status;
  if (!expiresAtDate || expiresAtDate.getTime() > Date.now()) return false;
  if (!['reserved', 'occupied', 'active'].includes(bookingState)) return false;

  await updateDoc(doc(bookingsCollection, booking.id), {
    status: 'cancelled',
    bookingStatus: 'cancelled',
    updatedAt: serverTimestamp(),
  });

  if (booking.slotId) {
    await updateSlotStatus(booking.slotId, 'available');
  }

  return true;
}

export async function checkAdminAccess(email) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const q = query(adminsCollection, where('email', '==', normalized));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export async function getUserById(uid) {
  if (!uid) return null;
  const docRef = doc(usersCollection, uid);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? { uid: snapshot.id, ...snapshot.data() } : null;
}

export async function getParkingSpots() {
  const q = query(slotsCollection, orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function getParkingAreas() {
  const q = query(parkingAreasCollection, orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function createParkingArea(area) {
  return await addDoc(parkingAreasCollection, {
    ...area,
    capacity: area.capacity || 0,
    pricePerHour: area.pricePerHour || 0,
    evSupport: area.evSupport || false,
    largeVehicle: area.largeVehicle || false,
    createdAt: serverTimestamp(),
  });
}

export async function updateParkingArea(areaId, updates) {
  return await updateDoc(doc(parkingAreasCollection, areaId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function removeParkingArea(areaId) {
  return await deleteDoc(doc(parkingAreasCollection, areaId));
}

export async function getNearbyParkingAreas(latitude, longitude, options = {}) {
  const areas = await getParkingAreas();
  return areas
    .map((area) => ({
      ...area,
      distanceKm: calculateDistance(latitude, longitude, area.latitude, area.longitude),
    }))
    .filter((area) => {
      if (options.availableOnly && area.availableSlots === 0) return false;
      if (options.evSupport && !area.evSupport) return false;
      if (options.largeVehicle && !area.largeVehicle) return false;
      return true;
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export async function updateUserFavorites(userId, favoriteAreas = []) {
  return await updateDoc(doc(usersCollection, userId), { favoriteAreas, updatedAt: serverTimestamp() });
}

export async function getUserFavorites(userId) {
  const userDoc = await getUserById(userId);
  return userDoc?.favoriteAreas || [];
}

export async function createSlot(slot) {
  return await addDoc(slotsCollection, {
    ...slot,
    status: slot.status || 'available',
    createdAt: serverTimestamp(),
  });
}

export async function removeSlot(slotId) {
  return await deleteDoc(doc(slotsCollection, slotId));
}

export async function updateSlotStatus(slotId, status) {
  return await updateDoc(doc(slotsCollection, slotId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function createBooking(booking) {
  const bookingRef = doc(bookingsCollection);
  const bookingPayload = {
    ...booking,
    bookingId: bookingRef.id,
    status: booking.status || 'active',
    bookingStatus: booking.bookingStatus || booking.status || 'active',
    paymentStatus: booking.paymentStatus || 'pending',
    qrData:
      booking.qrData ||
      JSON.stringify({ bookingId: bookingRef.id, slotId: booking.slotId, userId: booking.userId }),
    bookingTime: booking.bookingTime || serverTimestamp(),
    totalPrice: booking.totalPrice || 0,
    expiresAt: booking.expiresAt || null,
    createdAt: serverTimestamp(),
  };
  await setDoc(bookingRef, bookingPayload);
  return { id: bookingRef.id, ...bookingPayload };
}

export async function getUserBookings(userId) {
  const q = query(bookingsCollection, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getBookingById(bookingId) {
  const docRef = doc(bookingsCollection, bookingId);
  const snapshot = await getDoc(docRef);
  const booking = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  if (booking) {
    const expired = await expireBookingIfNeeded(booking);
    return expired ? await getBookingById(bookingId) : booking;
  }
  return null;
}

export async function getSlotById(slotId) {
  const docRef = doc(slotsCollection, slotId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function cancelBooking(bookingId) {
  const booking = await getBookingById(bookingId);
  if (!booking) return null;
  const bookingState = booking.bookingStatus || booking.status;
  if (bookingState === 'cancelled' || bookingState === 'completed') return null;
  const updates = { status: 'cancelled', bookingStatus: 'cancelled' };
  await updateBooking(bookingId, updates);
  if (booking.slotId) {
    await updateSlotStatus(booking.slotId, 'available');
  }
  return { id: bookingId, ...booking, ...updates };
}

export async function completeBooking(bookingId) {
  const booking = await getBookingById(bookingId);
  if (!booking) return null;
  await updateBooking(bookingId, { status: 'completed', bookingStatus: 'completed' });
  if (booking.slotId) {
    await updateSlotStatus(booking.slotId, 'available');
  }
  return { ...booking, status: 'completed', bookingStatus: 'completed' };
}

export async function getParkingAnalytics() {
  const [slotsSnapshot, bookingsSnapshot, areasSnapshot] = await Promise.all([
    getDocs(slotsCollection),
    getDocs(bookingsCollection),
    getDocs(parkingAreasCollection),
  ]);

  const slots = slotsSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  const areas = areasSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  const bookings = bookingsSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

  const totalBookings = bookings.length;
  const activeBookings = bookings.filter((booking) => ['reserved', 'occupied', 'entered', 'active'].includes(booking.bookingStatus || booking.status)).length;
  const dailyRevenueMap = bookings.reduce((acc, booking) => {
    const dateKey = getTimeKey(booking.bookingTime || booking.createdAt || new Date());
    acc[dateKey] = (acc[dateKey] || 0) + (booking.totalPrice || 0);
    return acc;
  }, {});
  const dailyRevenue = Object.values(dailyRevenueMap).reduce((sum, value) => sum + value, 0);
  const occupiedSlots = slots.filter((slot) => ['occupied', 'entered', 'reserved'].includes(slot.status)).length;
  const occupancyPercentage = slots.length ? Math.round((occupiedSlots / slots.length) * 100) : 0;

  const hourCounts = bookings.reduce((acc, booking) => {
    const date = booking.bookingTime?.toDate ? booking.bookingTime.toDate() : booking.bookingTime || booking.createdAt;
    if (!date) return acc;
    const hour = new Date(date).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});

  const peakHour = Object.keys(hourCounts).reduce((best, hour) => {
    if (!best || hourCounts[hour] > hourCounts[best]) return hour;
    return best;
  }, null);
  const lowHour = Object.keys(hourCounts).reduce((best, hour) => {
    if (!best || hourCounts[hour] < hourCounts[best]) return hour;
    return best;
  }, null);

  return {
    totalBookings,
    activeBookings,
    dailyRevenue,
    occupancyPercentage,
    peakHour: peakHour !== null ? `${peakHour}:00` : 'No data',
    quietHour: lowHour !== null ? `${lowHour}:00` : 'No data',
    areas,
    slots,
    bookings,
  };
}

export async function submitReport(report) {
  return await addDoc(reportsCollection, {
    ...report,
    createdAt: serverTimestamp(),
  });
}

export async function getReports(latitude, longitude, radiusKm = 1) {
  const snapshot = await getDocs(reportsCollection);
  return snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter((r) => {
      const dist = Math.sqrt((r.latitude - latitude) ** 2 + (r.longitude - longitude) ** 2);
      return dist < radiusKm / 111;
    });
}

export async function saveAnalytics(userId, event) {
  return await addDoc(analyticsCollection, {
    userId,
    event,
    timestamp: serverTimestamp(),
  });
}

export async function getParkingStats() {
  const [slotsSnapshot, bookingsSnapshot, usersSnapshot] = await Promise.all([
    getDocs(slotsCollection),
    getDocs(bookingsCollection),
    getDocs(usersCollection),
  ]);

  const slots = slotsSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  const bookings = bookingsSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

  const totalUsers = usersSnapshot.size;
  const totalBookings = bookings.length;
  const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
  const activeBookings = bookings.filter((booking) => {
    const status = booking.bookingStatus || booking.status;
    return ['reserved', 'occupied', 'active', 'entered'].includes(status);
  }).length;
  const cancelledBookings = bookings.filter((booking) => {
    const status = booking.bookingStatus || booking.status;
    return status === 'cancelled';
  }).length;
  const availableSlots = slots.filter((slot) => slot.status === 'available').length;
  const occupiedSlots = slots.filter((slot) => ['occupied', 'entered', 'reserved'].includes(slot.status)).length;

  const peakHour = calculatePeakBookingHour(bookings);

  return {
    totalUsers,
    totalBookings,
    totalRevenue,
    activeBookings,
    cancelledBookings,
    availableSlots,
    occupiedSlots,
    peakBookingHour: peakHour.label,
    peakBookingCount: peakHour.count,
  };
}

function calculatePeakBookingHour(bookings) {
  const hourCount = bookings.reduce((acc, booking) => {
    const createdAt = booking.createdAt;
    let date = null;
    if (createdAt?.toDate) {
      date = createdAt.toDate();
    } else if (createdAt?.seconds) {
      date = new Date(createdAt.seconds * 1000);
    } else if (typeof createdAt === 'number') {
      date = new Date(createdAt);
    }
    if (!date) return acc;
    const hour = date.getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});

  const peakHour = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0];
  if (!peakHour) {
    return { label: 'No bookings yet', count: 0 };
  }
  return { label: `${peakHour[0]}:00`, count: peakHour[1] };
}

export function subscribeToSlotsRealtime(callback) {
  const q = query(slotsCollection, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => callback(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))));
}

export function subscribeToParkingAreasRealtime(callback) {
  const q = query(parkingAreasCollection, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => callback(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))));
}

export function subscribeToBookingsRealtime(callback) {
  const q = query(bookingsCollection, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    bookings.forEach((booking) => {
      expireBookingIfNeeded(booking).catch(() => {});
    });
    callback(bookings);
  });
}

export function subscribeToUserBookingsRealtime(userId, callback) {
  const q = query(bookingsCollection, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    bookings.forEach((booking) => {
      expireBookingIfNeeded(booking).catch(() => {});
    });
    callback(bookings);
  });
}

export function subscribeToBookingRealtime(bookingId, callback) {
  const docRef = doc(bookingsCollection, bookingId);
  return onSnapshot(docRef, (snapshot) => {
    const booking = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
    if (booking) {
      expireBookingIfNeeded(booking).catch(() => {});
    }
    callback(booking);
  });
}

export function subscribeToUsersRealtime(callback) {
  const q = query(usersCollection, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => callback(snapshot.docs.map((docSnap) => ({ uid: docSnap.id, ...docSnap.data() }))));
}
