import { createApiClient } from "@sfu/shared";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// In Expo Go on a physical device/emulator, localhost refers to the device
// itself, so the dev API host must be resolved to the machine running it.
// EXPO_PUBLIC_API_URL lets `expo start` consumers override this explicitly.
const hostUri = Constants.expoConfig?.hostUri?.split(":")[0];
const DEV_HOST = hostUri || "localhost";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${DEV_HOST}:4000`;

export const TOKEN_KEY = "sfu_auth_token";

export const api = createApiClient({
  baseUrl: API_BASE_URL,
  getToken: () => AsyncStorage.getItem(TOKEN_KEY),
});
