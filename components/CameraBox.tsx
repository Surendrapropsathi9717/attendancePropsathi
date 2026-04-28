import React, { useRef, useState, useEffect } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Image, Platform } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

export default function CameraBox({ onCapture }) {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);

  // ✅ FIX: permission handle properly
  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return <Text>Loading Camera...</Text>;
  }

  if (!permission.granted) {
    return (
      <TouchableOpacity onPress={requestPermission} style={styles.allowBtn}>
        <Text style={{ color: "#fff" }}>Allow Camera 📸</Text>
      </TouchableOpacity>
    );
  }

  const takePhoto = async () => {
    try {
      if (!cameraRef.current) {
        alert("Camera not ready");
        return;
      }

      const result = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.6,
      });

      setPhoto(result);

      if (result?.base64) {
        onCapture(`data:image/jpeg;base64,${result.base64}`);
      }
    } catch (err) {
      console.log("Camera Error:", err);
      alert("Camera failed. Try HTTPS or reload.");
    }
  };

  return (
    <View style={styles.container}>

      {!photo ? (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
        />
      ) : (
        <Image source={{ uri: photo.uri }} style={styles.camera} />
      )}

      <TouchableOpacity style={styles.btn} onPress={takePhoto}>
        <Text style={{ color: "#fff" }}>Capture</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", marginTop: 10 },

  camera: {
    width: 280,
    height: 280,
    borderRadius: 10,
  },

  btn: {
    marginTop: 10,
    backgroundColor: "#000",
    padding: 10,
    borderRadius: 8,
  },

  allowBtn: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
});