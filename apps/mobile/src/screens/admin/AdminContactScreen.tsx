import React, { useCallback, useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { ContactMessage } from "@sfu/shared";
import { api } from "../../state/api";
import { useTheme } from "../../state/ThemeContext";
import { useLang } from "../../state/LangContext";
import { Badge, Card, MutedText, PhotoViewer, Screen } from "../../components/ui";
import { photoUrl } from "../../components/PhotoPicker";
import { Header } from "../../components/Header";
import { TAB_BAR_CLEARANCE } from "../../components/GlassTabBar";

export default function AdminContactScreen() {
  const { tokens, radii } = useTheme();
  const { t } = useLang();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  const load = useCallback(() => {
    api.contactMessages().then(setMessages);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id: string, read: boolean) => {
    await api.markContactMessageRead(id, read);
    load();
  };

  return (
    <Screen>
      <Header title={t("contactMessagesTitle")} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_CLEARANCE + 16, gap: 10 }}>
        {messages.map((m) => (
          <Pressable key={m.id} onPress={() => markRead(m.id, !m.read)}>
            <Card style={{ gap: 6, borderColor: m.read ? tokens.bd : undefined }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: tokens.tx, fontWeight: "700" }}>
                  {m.resident.fullName} · {t("room")} {m.resident.room}
                </Text>
                <Badge label={t(m.read ? "markRead" : "markUnread")} tone={m.read ? "neutral" : "accent"} />
              </View>
              <MutedText>{m.text}</MutedText>
              {m.photo && (
                <Pressable onPress={() => setViewingPhoto(photoUrl(m.photo!))}>
                  <Image source={{ uri: photoUrl(m.photo) }} style={{ width: 80, height: 80, borderRadius: radii.sm }} />
                </Pressable>
              )}
              <MutedText>{new Date(m.createdAt).toLocaleString("ru-RU")}</MutedText>
            </Card>
          </Pressable>
        ))}
      </ScrollView>

      <PhotoViewer uri={viewingPhoto} onClose={() => setViewingPhoto(null)} />
    </Screen>
  );
}
