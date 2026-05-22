import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { submitReport } from '../services/firestore';
import { getCurrentUser } from '../services/auth';
import { Report } from '../models/types';

export default function ReportScreen({ route, navigation }) {
  const { latitude, longitude } = route.params || { latitude: 12.9716, longitude: 77.5946 };
  const [description, setDescription] = useState('');
  const [type, setType] = useState('illegal_parking');
  const [loading, setLoading] = useState(false);

  const handleSubmitReport = async () => {
    if (!description) {
      Alert.alert('Error', 'Please describe the issue');
      return;
    }
    setLoading(true);
    try {
      const user = getCurrentUser();
      const report = new Report(user.uid, latitude, longitude, type, description);
      await submitReport(report);
      Alert.alert('Success', 'Report submitted!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report Parking Issue</Text>
      <Text style={styles.label}>Type:</Text>
      <View style={styles.typeButtons}>
        {['illegal_parking', 'poor_marking', 'unavailable'].map(t => (
          <Button key={t} title={t} onPress={() => setType(t)} color={type === t ? '#1E88E5' : '#ccc'} />
        ))}
      </View>
      <TextInput
        placeholder="Describe the issue..."
        value={description}
        onChangeText={setDescription}
        style={styles.textArea}
        multiline
      />
      <Button title={loading ? 'Submitting...' : 'Submit Report'} onPress={handleSubmitReport} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  typeButtons: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  textArea: { borderWidth: 1, borderColor: '#ccc', padding: 10, minHeight: 100, marginBottom: 16, borderRadius: 8 },
});
