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

  // ================= LOCATION =================
  const getLocationWithAddress = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      alert("📍 Enable location");
      return null;
    }

    const loc = await Location.getCurrentPositionAsync({});

    const addressArr = await Location.reverseGeocodeAsync({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });

    const addr = addressArr[0]; 

    const fullAddress = [
      addr?.name,
      addr?.street,
      addr?.district,
      addr?.subregion,
      addr?.region,
      addr?.postalCode,
      addr?.country,
    ]
      .filter(Boolean)
      .join(", ");

    return {
      lat: loc.coords.latitude,
      lon: loc.coords.longitude,
      address: fullAddress,
    };
  };

  // ================= MARK IN =================
  const markIn = async () => {
    const location = await getLocationWithAddress();

    if (!location || !image) {
      alert("Photo + Location required");
      return;
    }

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

    if (!location) {
      alert("Location required 📍");
      return;
    }

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
    try {
      await AsyncStorage.setItem("isLoggedIn", "false");

      setTimeout(() => {
        router.replace("/login");
      }, 200);
    } catch (e) {
      console.log("Logout Error", e);
    }
  };

  const inDone = today?.in_time;
  const outDone = today?.out_time;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

      {/* LOGOUT */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>

      {/* ATTENDANCE CARD */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: "#00bcd4" }]}
        onPress={() => setAttendanceOpen(!attendanceOpen)}
        activeOpacity={0.8}
      >
        <Text style={styles.title}>Attendance</Text>

        <Text style={styles.bigText}>
          Today: {today?.final_status || "Absent"}
        </Text>

        <Text style={{ color: "#fff", marginTop: 5 }}>
          Status: {today?.status || "--"}
        </Text>

        <Text style={{ color: "#fff", marginTop: 5 }}>
          IN: {today?.in_time || "--"}
        </Text>

        <Text style={{ color: "#fff", marginTop: 5 }}>
          OUT: {today?.out_time || "--"}
        </Text>
      </TouchableOpacity>

      {/* STATS */}
      {stats && (
        <View style={styles.statsBox}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.present}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.absent}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.late}</Text>
            <Text style={styles.statLabel}>Late</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.half_day}</Text>
            <Text style={styles.statLabel}>Half Day</Text>
          </View>
        </View>
      )}

      {/* DROPDOWN */}
      {attendanceOpen && (
        <View style={styles.dropdown}>

          <Text>🟢 IN Time: {inDone || "Not Marked"}</Text>
          <Text>📍 IN Location: {today?.in_address || "--"}</Text>

          <Text>🔴 OUT Time: {outDone || "Not Marked"}</Text>
          <Text>📍 OUT Location: {today?.out_address || "--"}</Text>

          {!inDone && (
            <CameraBox onCapture={(img) => setImage(img)} />
          )}

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: inDone ? "#aaa" : "#28a745" },
            ]}
            disabled={Boolean(inDone)}
            onPress={markIn}
          >
            <Text style={styles.btnText}>
              {inDone ? "IN Done" : "Mark IN"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor:
                  !inDone || outDone ? "#aaa" : "#dc3545",
              },
            ]}
            disabled={Boolean(!inDone || outDone)}
            onPress={markOut}
          >
            <Text style={styles.btnText}>
              {outDone ? "OUT Done" : "Mark OUT"}
            </Text>
          </TouchableOpacity>

        </View>
      )}

      {/* MEETINGS */}
      <TouchableOpacity style={[styles.card, { backgroundColor: "#2196f3" }]}>
        <Text style={styles.title}>Meetings</Text>
        <Text style={styles.bigText}>Coming Soon</Text>
      </TouchableOpacity>

      {/* SITE VISITS */}
      <TouchableOpacity style={[styles.card, { backgroundColor: "#ff9800" }]}>
        <Text style={styles.title}>Site Visits</Text>
        <Text style={styles.bigText}>Coming Soon</Text>
      </TouchableOpacity>

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
    alignItems: "center",
  },

  logoutText: { color: "#fff", fontWeight: "bold" },

  card: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 5,
  },

  title: { fontSize: 18, color: "#fff", fontWeight: "bold" },

  bigText: { fontSize: 22, color: "#fff", marginTop: 10 },

  dropdown: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
  },

  button: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  btnText: { color: "#fff", fontWeight: "bold" },

  statsBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },

  statItem: { alignItems: "center" },

  statNumber: { fontSize: 20, fontWeight: "bold" },

  statLabel: { fontSize: 12, color: "#555" },
});