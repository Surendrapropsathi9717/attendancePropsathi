import React, { useRef, useState, useEffect } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Image } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

export default function CameraBox({ onCapture }: any) {
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<any>(null);

  // ✅ AUTO PERMISSION
  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return <Text>Loading Camera...</Text>;
  }

  if (!permission.granted) {
    return (
      <TouchableOpacity onPress={requestPermission}>
        <Text>Allow Camera 📸</Text>
      </TouchableOpacity>
    );
  }

  const takePhoto = async () => {
    if (!cameraRef.current) {
      alert("Camera not ready");
      return;
    }

    try {
      const result = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5,
      });

      setPhoto(result);
      onCapture(`data:image/png;base64,${result.base64}`);
    } catch (e) {
      alert("Camera error");
      console.log(e);
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