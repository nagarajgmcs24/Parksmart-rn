import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { logout } from '../services/auth';

export default function ProfileScreen({ navigation }) {
  const handleLogout = async () => {
    await logout();
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.section}>Account Settings</Text>
      <Text style={styles.item}>Email: user@example.com</Text>
      <Text style={styles.item}>Name: User Name</Text>
      <Text style={styles.section}>Statistics</Text>
      <Text style={styles.item}>Total Bookings: 5</Text>
      <Text style={styles.item}>Reputation Points: 100</Text>
      <Button title="Logout" onPress={handleLogout} color="#E53935" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  section: { fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  item: { fontSize: 14, marginBottom: 8, paddingLeft: 8 },
});
