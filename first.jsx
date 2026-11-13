import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import { Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const CHECKS_KEY = 'checks';
const TOKEN_KEY = 'apiToken';
const API_URL = 'https://api.agriscan.example/plots/42/water';

// ---------- Data layer ----------
async function fetchPlotWaterLevel() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Network error');
  return res.json();
}

async function loadChecks() {
  const raw = await AsyncStorage.getItem(CHECKS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveCheck(check, existingChecks) {
  const next = [...existingChecks, check];
  await AsyncStorage.setItem(CHECKS_KEY, JSON.stringify(next));
  return next;
}

async function saveApiToken(token) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

// ---------- Business layer ----------
function getIrrigationStatus(levelCm, vibration) {
  return levelCm < 8 && vibration > 300 ? 'PUMP FAULT' : 'NORMAL';
}

// ---------- Presentation layer ----------
export default function IrrigationCheckScreen() {
  const [photo, setPhoto] = useState(null);
  const [checks, setChecks] = useState([]);
  const [vibration, setVibration] = useState(0);
  const [hasPermission, setHasPermission] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (isMounted) setHasPermission(status === 'granted');
    })();

    loadChecks()
      .then((data) => {
        if (isMounted) setChecks(data);
      })
      .catch(() => {});

    const sub = Accelerometer.addListener(() => {
      setVibration((v) => v + 1);
    });

    return () => {
      isMounted = false;
      sub && sub.remove();
    };
  }, []);

  async function capture() {
    if (!hasPermission) {
      Alert.alert(
        'Camera permission required',
        'Please grant camera access to photograph the gauge.'
      );
      return;
    }

    if (!cameraRef.current) return;

    const shot = await cameraRef.current.takePictureAsync();
    setPhoto(shot);
  }

  async function saveCheckHandler() {
    try {
      const plot = await fetchPlotWaterLevel();
      const status = getIrrigationStatus(plot.levelCm, vibration);

      const check = {
        photoUri: photo?.uri ?? null,
        status,
        checkedAt: Date.now(),
      };

      const next = await saveCheck(check, checks);
      setChecks(next);

      // In a real app, do not hardcode the token.
      await saveApiToken('sk_live_4b2c9f17ae');
    } catch (e) {
      Alert.alert('Save failed', e.message);
    }
  }

  if (hasPermission === null) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Checking camera permission…</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Camera permission is required to photograph the gauge.</Text>
        <Button
          title="Grant Camera Permission"
          onPress={async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <Camera ref={cameraRef} style={{ height: 200 }} />
      <Button title="Photograph Gauge" onPress={capture} />
      <Text>
        Last reading: {photo?.uri ? photo.uri : 'No photo yet'}
      </Text>
      <Button title="Save Check" onPress={saveCheckHandler} />
    </View>
  );
}