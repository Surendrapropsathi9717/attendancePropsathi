import * as LocalAuthentication from "expo-local-authentication";

export const checkBiometric = async () => {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;

  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!enrolled) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Login with Fingerprint",
  });

  return result.success;
};