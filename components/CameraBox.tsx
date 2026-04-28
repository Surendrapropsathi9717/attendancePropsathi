import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function CameraBox({ onCapture }) {
  const [photo, setPhoto] = useState(null);

  const openCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();

    if (!perm.granted) {
      alert("Camera permission required");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.6,
    });

    if (result.canceled) return;

    const img = "data:image/jpeg;base64," + result.assets[0].base64;

    setPhoto(img);
    onCapture(img);
  };

  return (
    <View style={{ alignItems: "center", marginTop: 10 }}>
      {!photo ? (
        <TouchableOpacity
          onPress={openCamera}
          style={{
            backgroundColor: "#000",
            padding: 10,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#fff" }}>Open Camera</Text>
        </TouchableOpacity>
      ) : (
        <Image
          source={{ uri: photo }}
          style={{ width: 200, height: 200, borderRadius: 10 }}
        />
      )}
    </View>
  );
}