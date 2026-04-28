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
  const [loadingLoc, setLoadingLoc] = useState(false);

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

  // ================= LOCATION (PWA + MOBILE SAFE) =================
  const getLocationWithAddress = async () => {
    try {
      setLoadingLoc(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        alert("📍 Location permission required");
        setLoadingLoc(false);
        return null;
      }

      // ⚡ FIX: timeout crash avoid + low accuracy fallback
      let loc;
      try {
        loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
        });
      } catch (e) {
        loc = await Location.getLastKnownPositionAsync({});
      }

      if (!loc) {
        alert("Location not found");
        setLoadingLoc(false);
        return null;
      }

      const addressArr = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      const addr = addressArr?.[0];

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

      setLoadingLoc(false);

      return {
        lat: loc.coords.latitude,
        lon: loc.coords.longitude,
        address: fullAddress || "Address not found",
      };
    } catch (err) {
      setLoadingLoc(false);
      alert("Location error");
      return null;
    }
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
          <Text>Half Day: {stats.half_day}</Text>
        </View>
      )}

      {/* DROPDOWN */}
      {attendanceOpen && (
        <View style={styles.dropdown}>

          {/* 🔥 LOCATION FIX DISPLAY */}
          <Text>🟢 IN Time: {inDone || "Not Marked"}</Text>
          <Text>📍 IN Location: {today?.in_address || "--"}</Text>

          <Text>🔴 OUT Time: {outDone || "Not Marked"}</Text>
          <Text>📍 OUT Location: {today?.out_address || "--"}</Text>

          {!inDone && (
            <CameraBox onCapture={(img) => setImage(img)} />
          )}

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: inDone ? "#aaa" : "green" }]}
            disabled={inDone}
            onPress={markIn}
          >
            <Text style={{ color: "#fff" }}>
              {loadingLoc ? "Getting Location..." : "Mark IN"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: !inDone ? "#aaa" : "red" }]}
            disabled={!inDone}
            onPress={markOut}
          >
            <Text style={{ color: "#fff" }}>Mark OUT</Text>
          </TouchableOpacity>

        </View>
      )}

    </ScrollView>
  );
}

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

  title: { fontSize: 18, color: "#fff" },

  bigText: { fontSize: 20, color: "#fff" },

  dropdown: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },

  btn: {
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },

  statsBox: {
    backgroundColor: "#fff",
    padding: 10,
    marginVertical: 10,
  },
});