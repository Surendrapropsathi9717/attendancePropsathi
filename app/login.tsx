import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Button,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { checkBiometric } from "../utils/biometric";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [today, setToday] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadToday();
  }, []);

  // ================= LOAD TODAY =================
  const loadToday = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get(
        "https://propsathi.in/api/attendance/get_today.php",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setToday(res.data?.data || null);
    } catch (e) {
      console.log("LOAD TODAY ERROR:", e);
    }
  };

  // ================= LOGIN =================
  const handleLogin = async () => {
    if (!email || !password) {
      alert("Enter email & password");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        "https://propsathi.in/api/auth/login.php",
        { email, password }
      );

      if (res.data.status) {
        await AsyncStorage.setItem("token", res.data.token);

        alert("Login Success");
        loadToday();
        router.replace("/dashboard");
      } else {
        alert(res.data.msg);
      }
    } catch (error) {
      alert("Server error");
    }

    setLoading(false);
  };

  // ================= FINGERPRINT =================
  const handleFingerprintLogin = async () => {
    const ok = await checkBiometric();
    if (!ok) return;

    const token = await AsyncStorage.getItem("token");

    if (token) {
      router.replace("/dashboard");
    } else {
      alert("First login with email/password");
    }
  };

  // ================= LOCATION =================
  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("Location permission denied");
      return null;
    }

    const loc = await Location.getCurrentPositionAsync({});
    const lat = loc.coords.latitude;
    const lon = loc.coords.longitude;

    const addr = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });

    return {
      lat,
      lon,
      address: `${addr[0]?.name || ""}, ${addr[0]?.city || ""}`,
    };
  };

  // ================= MARK IN =================
  const markIn = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return alert("Login required");

    const location = await getLocation();
    if (!location) return;

    const image = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.5,
    });

    if (image.canceled) return;

    try {
      const res = await axios.post(
        "https://propsathi.in/api/attendance/mark_in.php",
        {
          ...location,
          image: "data:image/png;base64," + image.assets[0].base64,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(res.data.msg);
      loadToday();

    } catch (e: any) {
      alert(e?.response?.data?.msg || "IN Error");
    }
  };

  // ================= MARK OUT =================
  const markOut = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return alert("Login required");

    const location = await getLocation();
    if (!location) return;

    try {
      const res = await axios.post(
        "https://propsathi.in/api/attendance/mark_out.php",
        location,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(res.data.msg);
      loadToday();

    } catch (e: any) {
      alert(e?.response?.data?.msg || "OUT Error");
    }
  };

  // ================= CONDITIONS =================
  const inDone = today?.in_time;
  const outDone = today?.out_time;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <Button
        title={loading ? "Please wait..." : "Login"}
        onPress={handleLogin}
      />

      {/* Fingerprint */}
      <TouchableOpacity
        style={styles.fingerprintBtn}
        onPress={handleFingerprintLogin}
      >
        <Text style={styles.fingerprintText}>
          🔓 Login with Fingerprint
        </Text>
      </TouchableOpacity>

      {/* ================= ATTENDANCE ================= */}
      {today && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ textAlign: "center", fontWeight: "bold" }}>
            📅 Quick Attendance
          </Text>

          <Text style={{ textAlign: "center" }}>
            IN: {today.in_time ?? "-"} | OUT: {today.out_time ?? "-"}
          </Text>

          {/* MARK IN */}
          {!inDone && (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#28a745" }]}
              onPress={markIn}
            >
              <Text style={styles.btnText}>Mark IN</Text>
            </TouchableOpacity>
          )}

          {/* MARK OUT (ONLY IF IN DONE & OUT NOT DONE) */}
          {inDone && !outDone && (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#dc3545" }]}
              onPress={markOut}
            >
              <Text style={styles.btnText}>Mark OUT</Text>
            </TouchableOpacity>
          )}

          {/* DONE MESSAGE */}
          {outDone && (
            <Text style={{ textAlign: "center", marginTop: 10 }}>
              ✅ Attendance Completed
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ================= STYLE =================
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },

  heading: {
    fontSize: 22,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
  },

  input: {
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
  },

  fingerprintBtn: {
    marginTop: 20,
    backgroundColor: "#222",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  fingerprintText: { color: "#fff", fontWeight: "bold" },

  btn: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});