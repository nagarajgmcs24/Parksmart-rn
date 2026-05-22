// Enhanced Firestore service with all CRUD operations
import { db } from '../config/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';

// Parking Spots
export async function getParkingSpots() {
  const col = collection(db, 'parkingSpots');
  const snapshot = await getDocs(col);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addParkingSpot(spot) {
  return await addDoc(collection(db, 'parkingSpots'), spot);
}

export async function updateParkingSpot(spotId, updates) {
  await updateDoc(doc(db, 'parkingSpots', spotId), updates);
}

// Bookings
export async function createBooking(booking) {
  return await addDoc(collection(db, 'bookings'), booking);
}

export async function getUserBookings(userId) {
  const q = query(collection(db, 'bookings'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateBooking(bookingId, updates) {
  await updateDoc(doc(db, 'bookings', bookingId), updates);
}

// Reports
export async function submitReport(report) {
  return await addDoc(collection(db, 'reports'), report);
}

export async function getReports(latitude, longitude, radiusKm = 1) {
  const col = collection(db, 'reports');
  const snapshot = await getDocs(col);
  return snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(r => {
      const dist = Math.sqrt((r.latitude - latitude) ** 2 + (r.longitude - longitude) ** 2);
      return dist < radiusKm / 111;
    });
}

// Analytics
export async function saveAnalytics(userId, event) {
  await addDoc(collection(db, 'analytics'), {
    userId,
    event,
    timestamp: Date.now(),
  });
}
