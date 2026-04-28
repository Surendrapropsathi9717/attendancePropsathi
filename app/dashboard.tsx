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

  // ================= LOCATION (FIXED) =================
  const getLocationWithAddress = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();

      let finalStatus = status;

      if (status !== "granted") {
        const req = await Location.requestForegroundPermissionsAsync();
        finalStatus = req.status;
      }

      if (finalStatus !== "granted") {
        alert("📍 Location permission required");
        return null;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const addressArr = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      const addr = addressArr[0];

      return {
        lat: loc.coords.latitude,
        lon: loc.coords.longitude,
        address: `${addr?.name || ""}, ${addr?.city || ""}, ${addr?.region || ""}`,
      };
    } catch (e) {
      console.log("Location Error:", e);
      return null;
    }
  };

  // ================= MARK IN (FIXED) =================
  const markIn = async () => {
    if (!image) {
      alert("📸 Photo required");
      return;
    }

    const location = await getLocationWithAddress();
    if (!location) return;

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
      console.log(e);
      alert("IN Error");
    }
  };

  // ================= MARK OUT (FIXED) =================
  const markOut = async () => {
    const location = await getLocationWithAddress();
    if (!location) return;

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
      console.log(e);
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

      {/* ATTENDANCE */}
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
          <Text>Half: {stats.half_day}</Text>
        </View>
      )}

      {/* DROPDOWN */}
      {attendanceOpen && (
        <View style={styles.dropdown}>

          <Text>IN: {inDone || "Not Marked"}</Text>
          <Text>OUT: {outDone || "Not Marked"}</Text>

          {!inDone && (
            <CameraBox onCapture={(img) => {
              if (img) setImage(img);
            }} />
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: inDone ? "#aaa" : "green" }]}
            disabled={!!inDone}
            onPress={markIn}
          >
            <Text style={{ color: "#fff" }}>Mark IN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: !inDone || outDone ? "#aaa" : "red" }]}
            disabled={!inDone || outDone}
            onPress={markOut}
          >
            <Text style={{ color: "#fff" }}>Mark OUT</Text>
          </TouchableOpacity>

        </View>
      )}

    </ScrollView>
  );
}

// ================= STYLE =================
const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },

  logoutBtn: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  logoutText: { color: "#fff", textAlign: "center" },

  card: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
  },

  title: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  bigText: { color: "#fff", fontSize: 20 },

  dropdown: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
  },

  button: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  statsBox: {
    backgroundColor: "#eee",
    padding: 10,
    marginBottom: 10,
  },
});