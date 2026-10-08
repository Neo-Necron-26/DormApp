import React, { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";
import { DormEvent } from "@sfu/shared";
import { api } from "../../state/api";
import { useTheme } from "../../state/ThemeContext";
import { useLang } from "../../state/LangContext";
import { useToast } from "../../state/ToastContext";
import { Card, Input, MutedText, PrimaryButton, Screen, ScreenTitle } from "../../components/ui";
import { PhotoPicker } from "../../components/PhotoPicker";
import { Header } from "../../components/Header";
import { TAB_BAR_CLEARANCE } from "../../components/GlassTabBar";

export default function AdminEventsScreen() {
  const { tokens } = useTheme();
  const { t } = useLang();
  const { showToast } = useToast();
  const [events, setEvents] = useState<DormEvent[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const load = () => api.events().then(setEvents);

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    setCreating(true);
    try {
      const res = await api.createEvent({ title, description, date: new Date(date).toISOString(), photos: photos.length ? photos : undefined });
      setTitle("");
      setDescription("");
      setDate("");
      setPhotos([]);
      load();
      showToast(`${t("deliveryReport")}: ${res.deliveredCount}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Screen>
      <Header title={t("events")} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_CLEARANCE + 16, gap: 12 }}>
        <ScreenTitle>{t("eventCreate")}</ScreenTitle>
        <Input value={title} onChangeText={setTitle} placeholder={t("eventTitle")} />
        <Input value={description} onChangeText={setDescription} placeholder={t("eventDescription")} />
        <Input value={date} onChangeText={setDate} placeholder={t("eventDatePlaceholder")} />
        <PhotoPicker value={photos} onChange={setPhotos} />
        <PrimaryButton label={t("eventCreate")} onPress={create} loading={creating} disabled={!title || !description || !date} />

        <ScreenTitle>{t("upcomingEvents")}</ScreenTitle>
        {events.map((e) => (
          <Card key={e.id}>
            <Text style={{ color: tokens.tx, fontWeight: "700" }}>{e.title}</Text>
            <MutedText>{new Date(e.date).toLocaleDateString("ru-RU")}</MutedText>
            <MutedText style={{ marginTop: 4 }}>{e.description}</MutedText>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
