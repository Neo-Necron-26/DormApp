import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { api } from "../state/api";
import { useLang } from "../state/LangContext";
import { useTheme } from "../state/ThemeContext";
import { Input, MutedText, PrimaryButton, Screen, ScreenTitle, SegmentedControl } from "../components/ui";
import { PhotoPicker } from "../components/PhotoPicker";

type Kind = "announcement" | "event";

export default function CreateNewsScreen() {
  const { t } = useLang();
  const navigation = useNavigation<any>();
  const [kind, setKind] = useState<Kind>("announcement");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [date, setDate] = useState("");
  const [level, setLevel] = useState<"dorm" | "sfu">("dorm");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = kind === "announcement" ? text.trim().length > 0 : title.trim().length > 0 && text.trim().length > 0 && date.trim().length > 0;

  const submit = async () => {
    setSubmitting(true);
    try {
      if (kind === "event") {
        await api.createEvent({ title, description: text, date: new Date(date).toISOString(), photos, isSfu: level === "sfu" });
      } else {
        const channels = await api.chatChannels();
        const targetType = level === "sfu" ? "SFU_ANNOUNCEMENTS" : "ANNOUNCEMENTS";
        const announcements = channels.find((c) => c.type === targetType);
        if (announcements) await api.sendChatMessage(announcements.id, { text, photos });
      }
      navigation.goBack();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <ScreenTitle>{t("createNews")}</ScreenTitle>
        <SegmentedControl
          value={kind}
          onChange={setKind}
          options={[
            { value: "announcement", label: t("newsAnnouncement") },
            { value: "event", label: t("newsEvent") },
          ]}
        />
        <SegmentedControl
          value={level}
          onChange={setLevel as any}
          options={[
            { value: "dorm", label: "Общежитие" },
            { value: "sfu", label: "СФУ" },
          ]}
        />
        {kind === "event" && <Input value={title} onChangeText={setTitle} placeholder={t("eventTitle")} />}
        <Input value={text} onChangeText={setText} placeholder={kind === "event" ? t("listingDescription") : t("chatMessagePlaceholder")} />
        {kind === "event" && (
          <View style={{ gap: 4 }}>
            <Input value={date} onChangeText={setDate} placeholder="ГГГГ-ММ-ДД" />
            <MutedText>{t("eventDate")}</MutedText>
          </View>
        )}
        <PhotoPicker value={photos} onChange={setPhotos} />
        <PrimaryButton label={t("createNews")} onPress={submit} loading={submitting} disabled={!canSubmit} />
      </ScrollView>
    </Screen>
  );
}
