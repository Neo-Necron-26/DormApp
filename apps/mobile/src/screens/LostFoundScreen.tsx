import React, { useCallback, useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { LostFoundItem, LostFoundKind } from "@sfu/shared";
import { api } from "../state/api";
import { useLang } from "../state/LangContext";
import { useTheme } from "../state/ThemeContext";
import { useToast } from "../state/ToastContext";
import { BottomSheet, Card, Icon, Input, MutedText, PrimaryButton, Screen, ScreenTitle, SecondaryButton } from "../components/ui";
import { PhotoPicker, photoUrl } from "../components/PhotoPicker";
import { timeAgo } from "../utils/listing";
import { TAB_BAR_CLEARANCE } from "../components/GlassTabBar";

export default function LostFoundScreen() {
  const { t } = useLang();
  const { tokens, accent, radii } = useTheme();
  const { showToast } = useToast();
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [kind, setKind] = useState<LostFoundKind>("LOST");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    api.lostFoundItems().then(setItems);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    setSubmitting(true);
    try {
      const result = await api.createLostFoundItem({ kind, title, location: location || undefined, photo: photos[0] });
      setTitle("");
      setLocation("");
      setPhotos([]);
      setCreating(false);
      load();
      showToast(`${t("sentToResidents")}: ${result.notifiedCount}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_CLEARANCE + 16, gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <ScreenTitle>{t("lostFound")}</ScreenTitle>
          <SecondaryButton label={t("lostFoundNew")} onPress={() => setCreating(true)} />
        </View>

        {items.length === 0 && <MutedText>{t("lostFoundEmpty")}</MutedText>}
        {items.map((item) => (
          <Card key={item.id} style={{ gap: 6, flexDirection: "row" }}>
            {item.photo && (
              <Image source={{ uri: photoUrl(item.photo) }} style={{ width: 48, height: 48, borderRadius: radii.sm }} />
            )}
            <View style={{ flex: 1, gap: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: tokens.tx, fontWeight: "700" }}>{item.title}</Text>
              <View
                style={{
                  backgroundColor: (item.kind === "LOST" ? "#EF4444" : "#22C55E") + "22",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                }}
              >
                <Text style={{ color: item.kind === "LOST" ? "#EF4444" : "#22C55E", fontSize: 11, fontWeight: "700" }}>
                  {t(item.kind === "LOST" ? "lostFoundKindLost" : "lostFoundKindFound")}
                </Text>
              </View>
            </View>
            {item.location && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Icon name="map-pin" size={12} color={tokens.mu} />
                <MutedText>{item.location}</MutedText>
              </View>
            )}
            <MutedText>
              {item.resident.fullName} · {timeAgo(item.createdAt)}
            </MutedText>
            </View>
          </Card>
        ))}
      </ScrollView>

      <BottomSheet visible={creating} onClose={() => setCreating(false)}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: tokens.tx, fontSize: 18, fontWeight: "700" }}>{t("lostFoundNew")}</Text>
          <Pressable
            onPress={() => setCreating(false)}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: tokens.sub, alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="x" size={16} color={tokens.mu} />
          </Pressable>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["LOST", "FOUND"] as const).map((k) => (
            <Pressable
              key={k}
              onPress={() => setKind(k)}
              style={{
                flex: 1,
                height: 40,
                borderRadius: radii.md,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: kind === k ? accent : tokens.sub,
              }}
            >
              <Text style={{ color: kind === k ? "#fff" : tokens.tx, fontWeight: "700" }}>
                {t(k === "LOST" ? "lostFoundKindLost" : "lostFoundKindFound")}
              </Text>
            </Pressable>
          ))}
        </View>
        <Input value={title} onChangeText={setTitle} placeholder={t("listingTitle")} />
        <Input value={location} onChangeText={setLocation} placeholder={t("lostFoundLocation")} />
        <PhotoPicker value={photos} onChange={setPhotos} max={1} />
        <PrimaryButton label={t("submit")} onPress={submit} loading={submitting} disabled={!title} />
      </BottomSheet>
    </Screen>
  );
}
