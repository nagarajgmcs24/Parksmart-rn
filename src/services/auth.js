// Authentication service using Firebase
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { User } from '../models/types';

export async function register(email, password, name) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = new User(cred.user.uid, email, name);
    await addDoc(collection(db, 'users'), { uid: cred.user.uid, ...user });
    return cred.user;
  } catch (error) {
    throw new Error(`Registration failed: ${error.message}`);
  }
}

export async function login(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (error) {
    throw new Error(`Login failed: ${error.message}`);
  }
}

export async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(`Logout failed: ${error.message}`);
  }
}

export function getCurrentUser() {
  return auth.currentUser;
}
