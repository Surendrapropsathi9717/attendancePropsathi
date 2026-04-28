import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";

import * as Location from "expo-location";
import CameraBox from "../components/CameraBox";

export default function Dashboard() {
  const router = useRouter();

  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [today, setToday] = useState(null);
  const [stats, setStats] = useState(null);
  const [image, setImage] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  // ================= LOAD =================
  const loadDashboard = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const res = await axios.get(
        "https://propsathi.in/api/dashboard/dashboard.php",
        {
          headers: { Authorization: token },
        }
      );

      setToday(res.data?.stats?.today_attendance || null);
      setStats(res.data?.stats || null);
    } catch (err) {
      console.log("Dashboard Error:", err);
    }
  };

  // ================= LOCATION FIX =================
  const getLocationWithAddress = async () => {
    const { status } =
      await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      alert("Enable location");
      return null;
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      maximumAge: 10000,
    });

    const addressArr = await Location.reverseGeocodeAsync({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });

    const addr = addressArr[0];

    return {
      lat: loc.coords.latitude,
      lon: loc.coords.longitude,
      address: `${addr?.name || ""}, ${addr?.city || ""}`,
    };
  };

  // ================= MARK IN =================
  const markIn = async () => {
    const location = await getLocationWithAddress();

    if (!location) return alert("Location required 📍");
    if (!image) return alert("Photo required 📸");

    try {
      const token = await AsyncStorage.getItem("token");

      const res = await axios.post(
        "https://propsathi.in/api/attendance/mark_in.php",
        {
          lat: location.lat,
          lon: location.lon,
          address: location.address,
          image: image,
        },
        {
          headers: { Authorization: token },
        }
      );

      alert(res.data.message || res.data.msg);
      setImage(null);
      loadDashboard();
    } catch (e) {
      alert("IN Error");
    }
  };

  // ================= MARK OUT =================
  const markOut = async () => {
    const location = await getLocationWithAddress();

    if (!location) return alert("Location required 📍");

    try {
      const token = await AsyncStorage.getItem("token");

      const res = await axios.post(
        "https://propsathi.in/api/attendance/mark_out.php",
        {
          lat: location.lat,
          lon: location.lon,
          address: location.address,
        },
        {
          headers: { Authorization: token },
        }
      );

      alert(res.data.msg);
      loadDashboard();
    } catch (e) {
      alert("OUT Error");
    }
  };

  // ================= LOGOUT =================
  const handleLogout = async () => {
    await AsyncStorage.setItem("isLoggedIn", "false");
    router.replace("/login");
  };

  const inDone = today?.in_time;
  const outDone = today?.out_time;

  return (
    <ScrollView style={styles.container}>

      {/* LOGOUT */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>

      {/* ATTENDANCE CARD */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: "#00bcd4" }]}
        onPress={() => setAttendanceOpen(!attendanceOpen)}
      >
        <Text style={styles.title}>Attendance</Text>

        <Text style={styles.bigText}>
          Today: {today?.final_status || "Absent"}
        </Text>

        <Text style={{ color: "#fff" }}>IN: {today?.in_time || "--"}</Text>
        <Text style={{ color: "#fff" }}>OUT: {today?.out_time || "--"}</Text>
      </TouchableOpacity>

      {/* STATS */}
      {stats && (
        <View style={styles.statsBox}>
          <Text>Present: {stats.present}</Text>
          <Text>Absent: {stats.absent}</Text>
          <Text>Late: {stats.late}</Text>
          <Text>Half Day: {stats.half_day}</Text>
        </View>
      )}

      {/* DROPDOWN */}
      {attendanceOpen && (
        <View style={styles.dropdown}>

          <Text>🟢 IN: {today?.in_time || "Not Marked"}</Text>
          <Text>📍 IN Location: {today?.in_address || "--"}</Text>

          <Text>🔴 OUT: {today?.out_time || "Not Marked"}</Text>
          <Text>📍 OUT Location: {today?.out_address || "--"}</Text>

          {!inDone && (
            <CameraBox onCapture={(img) => setImage(img)} />
          )}

          {!inDone && (
            <TouchableOpacity style={styles.inBtn} onPress={markIn}>
              <Text style={{ color: "#fff" }}>Mark IN</Text>
            </TouchableOpacity>
          )}

          {inDone && !outDone && (
            <TouchableOpacity style={styles.outBtn} onPress={markOut}>
              <Text style={{ color: "#fff" }}>Mark OUT</Text>
            </TouchableOpacity>
          )}

          {outDone && (
            <Text style={{ textAlign: "center", marginTop: 10 }}>
              ✅ Completed
            </Text>
          )}
        </View>
      )}

    </ScrollView>
  );
}

// ================= STYLE =================
const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#f2f4f7" },

  logoutBtn: {
    backgroundColor: "#dc3545",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },

  logoutText: { color: "#fff", textAlign: "center", fontWeight: "bold" },

  card: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },

  title: { fontSize: 18, color: "#fff", fontWeight: "bold" },

  bigText: { fontSize: 20, color: "#fff", marginTop: 10 },

  dropdown: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
  },

  statsBox: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },

  inBtn: {
    backgroundColor: "#28a745",
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  outBtn: {
    backgroundColor: "#dc3545",
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
    alignItems: "center",
  },
});