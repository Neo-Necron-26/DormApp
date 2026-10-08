import React, { useState } from "react";
import { ActionSheetIOS, ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../state/ThemeContext";
import { useLang } from "../state/LangContext";
import { api, API_BASE_URL } from "../state/api";
import { Icon } from "./ui";

/** Resolves a /uploads/... path returned by the API into an absolute URL for <Image>. */
export function photoUrl(path: string): string {
  return path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
}

export function PhotoPicker({
  value,
  onChange,
  max = 5,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const { tokens, accent, radii } = useTheme();
  const { t } = useLang();
  const [uploading, setUploading] = useState(false);

  const uploadAssets = async (assets: ImagePicker.ImagePickerAsset[]) => {
    setUploading(true);
    try {
      const form = new FormData();
      assets.forEach((asset, i) => {
        const name = asset.fileName || `photo-${Date.now()}-${i}.jpg`;
        form.append("photos", { uri: asset.uri, name, type: asset.mimeType || "image/jpeg" } as unknown as Blob);
      });
      const { urls } = await api.uploadPhotos(form);
      onChange([...value, ...urls].slice(0, max));
    } finally {
      setUploading(false);
    }
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, max - value.length),
      quality: 0.7,
    });
    if (result.canceled || result.assets.length === 0) return;
    await uploadAssets(result.assets);
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (result.canceled || result.assets.length === 0) return;
    await uploadAssets(result.assets);
  };

  const pick = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [t("cancel"), t("camera"), t("gallery")], cancelButtonIndex: 0 },
        (index) => {
          if (index === 1) pickFromCamera();
          if (index === 2) pickFromGallery();
        }
      );
    } else {
      Alert.alert(t("addPhoto"), undefined, [
        { text: t("camera"), onPress: pickFromCamera },
        { text: t("gallery"), onPress: pickFromGallery },
        { text: t("cancel"), style: "cancel" },
      ]);
    }
  };

  const remove = (url: string) => onChange(value.filter((u) => u !== url));

  return (
    <View style={{ gap: 8 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {value.map((url) => (
            <View key={url} style={{ width: 76, height: 76 }}>
              <Image source={{ uri: photoUrl(url) }} style={{ width: 76, height: 76, borderRadius: radii.sm }} />
              <Pressable
                onPress={() => remove(url)}
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: "#00000099",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="x" size={12} color="#fff" />
              </Pressable>
            </View>
          ))}
          {value.length < max && (
            <Pressable
              onPress={pick}
              disabled={uploading}
              style={{
                width: 76,
                height: 76,
                borderRadius: radii.sm,
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: tokens.bd,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: tokens.sub,
              }}
            >
              {uploading ? <ActivityIndicator color={accent} /> : <Icon name="camera" size={20} color={accent} />}
            </Pressable>
          )}
        </View>
      </ScrollView>
      <Text style={{ color: tokens.mu, fontSize: 12 }}>
        {value.length}/{max} · {t("addPhoto")}
      </Text>
    </View>
  );
}
