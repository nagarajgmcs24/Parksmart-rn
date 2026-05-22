// Setup Instructions for ParkSmart React Native

## Complete Setup Guide

### Step 1: Install Dependencies
```bash
cd C:\Users\nagar\OneDrive\Desktop\MAD LAB\ParkSmart-RN
npm install
```

This installs all packages including:
- React Native & Expo
- Firebase SDK
- React Navigation & Bottom Tabs
- React Native Maps
- Stripe React Native
- Axios

### Step 2: Configure Firebase

1. Go to https://console.firebase.google.com
2. Create a new project (or use existing)
3. Enable these services:
   - **Authentication**: Email/Password
   - **Firestore Database**: In production mode (add security rules later)
   - **Realtime Database** (optional, for live updates)

4. Get your config from Project Settings:
   ```
   Settings → Project settings → Your apps → Web → Copy config
   ```

5. Update `src/config/firebase.js`:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_ID",
     appId: "YOUR_APP_ID",
   };
   ```

### Step 3: Configure Stripe

1. Go to https://dashboard.stripe.com
2. Copy your **Publishable Key** (starts with pk_test_)
3. Update `src/config/stripe.js`:
   ```javascript
   export const STRIPE_KEY = 'pk_test_YOUR_KEY_HERE';
   ```

### Step 4: Set Up Firestore Database

Create these collections in Firestore:

**parkingSpots**
```json
{
  "id": "spot_001",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "status": "free",
  "type": "street",
  "pricePerHour": 50,
  "reportedBy": "user_123",
  "verified": true,
  "timestamp": 1234567890
}
```

**bookings**
```json
{
  "spotId": "spot_001",
  "userId": "user_123",
  "hours": 2,
  "totalPrice": 100,
  "paymentId": "pi_xxx",
  "status": "active",
  "createdAt": 1234567890,
  "startTime": 1234567890,
  "endTime": 1234575890
}
```

**users**
```json
{
  "uid": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "9876543210",
  "reputation": 0,
  "totalBookings": 0,
  "createdAt": 1234567890
}
```

**reports**
```json
{
  "userId": "user_123",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "type": "illegal_parking",
  "description": "Car parked on double line",
  "photoUri": "https://...",
  "verified": false,
  "upvotes": 5,
  "timestamp": 1234567890
}
```

### Step 5: (Optional) Add Sample Data

Use Firebase Console to add test parking spots:

```
Spot 1: (12.9716, 77.5946) - MG Road - ₹50/hour
Spot 2: (12.9352, 77.6245) - Indiranagar - ₹40/hour
Spot 3: (13.0350, 77.6245) - Whitefield - ₹30/hour
```

### Step 6: Run the App

```bash
npm start
```

**For Android Emulator:**
```bash
a          # or npm run android
```

**For Physical Device:**
- Install Expo Go app (Google Play / App Store)
- Scan QR code from terminal
- App will load and run

**For Web:**
```bash
w          # or npm run web
```

### Step 7: Test Features

1. **Create Account**: Sign up with email/password
2. **View Map**: See all parking spots
3. **Make Booking**: Tap a spot and book for hours
4. **Check History**: Go to History tab to see bookings
5. **Report Issue**: Report a parking problem
6. **Profile**: View account and logout

## Troubleshooting

### Issue: "Cannot find module 'firebase'"
**Solution**: Run `npm install firebase`

### Issue: "Metro bundler crashes"
**Solution**: Clear cache
```bash
npm start -- --reset-cache
```

### Issue: Map not loading
**Solution**: Check if you've enabled Google Maps in your Firebase project

### Issue: Login fails
**Solution**: 
1. Check Firebase config is correct in `src/config/firebase.js`
2. Ensure Email/Password auth is enabled in Firebase Console
3. Check internet connection

### Issue: Payment fails
**Solution**:
1. Verify Stripe key is correct
2. Use test card: 4242 4242 4242 4242

## Next Steps

- [ ] Add Google Maps API key for geocoding
- [ ] Implement real-time location tracking
- [ ] Add photo upload for reports
- [ ] Set up admin dashboard
- [ ] Configure push notifications
- [ ] Add offline support with local storage
- [ ] Set up CI/CD pipeline with EAS

## Build for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Build signed APK for Android
eas build --platform android

# Or build for iOS
eas build --platform ios

# Submit to app stores
eas submit --platform android --latest
```

## Resources

- [React Native Docs](https://reactnative.dev)
- [Expo Documentation](https://docs.expo.dev)
- [Firebase Docs](https://firebase.google.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [React Navigation Guide](https://reactnavigation.org)
