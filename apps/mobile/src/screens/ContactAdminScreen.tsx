import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { api } from "../state/api";
import { useLang } from "../state/LangContext";
import { useTheme } from "../state/ThemeContext";
import { Card, Icon, Input, MutedText, PrimaryButton, Screen, ScreenTitle } from "../components/ui";
import { PhotoPicker } from "../components/PhotoPicker";
import { TAB_BAR_CLEARANCE } from "../components/GlassTabBar";

export default function ContactAdminScreen() {
  const { t } = useLang();
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.sendContactMessage({ text, photo: photos[0] });
      setText("");
      setPhotos([]);
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_CLEARANCE + 16, gap: 12 }}>
        <ScreenTitle>{t("contactAdminTitle")}</ScreenTitle>
        <Card>
          <MutedText>Комендант общежития №6 — Наталья Сергеевна Орлова</MutedText>
        </Card>
        <Input value={text} onChangeText={setText} placeholder={t("contactAdminPlaceholder")} />
        <PhotoPicker value={photos} onChange={setPhotos} max={1} />
        {sent && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Icon name="check-circle" size={14} color="#22C55E" />
            <Text style={{ color: "#22C55E", fontWeight: "600", fontSize: 13 }}>{t("contactAdminSent")}</Text>
          </View>
        )}
        <PrimaryButton label={t("submit")} onPress={submit} loading={submitting} disabled={!text} />
      </ScrollView>
    </Screen>
  );
}
