import React, { useRef, useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Image } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

export default function CameraBox({ onCapture }) {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);

  // ❌ REMOVED auto permission loop (important fix)

  if (!permission) {
    return <Text>Loading Camera...</Text>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={{ color: "#fff" }}>Allow Camera 📸</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePhoto = async () => {
    if (!cameraRef.current) {
      alert("Camera not ready");
      return;
    }

    try {
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false, // ✅ IMPORTANT: web + android stable
      });

      setPhoto(result);

      // ✅ UNIVERSAL OUTPUT (URI only)
      onCapture(result.uri);

    } catch (e) {
      console.log(e);
      alert("Camera error");
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

  center: { alignItems: "center", marginTop: 20 },

  camera: {
    width: 250,
    height: 250,
    borderRadius: 10,
    overflow: "hidden",
  },

  btn: {
    marginTop: 10,
    backgroundColor: "#000",
    padding: 10,
    borderRadius: 8,
  },
});