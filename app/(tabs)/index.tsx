import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      // ❌ No token → direct login
      if (!token) {
        router.replace("/login");
        return;
      }

      // ✅ Verify token
      const res = await axios.get(
        "https://propsathi.in/api/auth/check_auth.php",
        {
          headers: { Authorization: token },
          timeout: 5000,
        }
      );

      if (res?.data?.status) {
        router.replace("/dashboard");
      } else {
        // ❌ invalid token → clear storage
        await AsyncStorage.removeItem("token");
        router.replace("/login");
      }

    } catch (error) {
      console.log("Auth Error:", error);

      // ❌ network issue → fallback login
      router.replace("/login");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}