import React, { useCallback, useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { Ticket, TicketStatus } from "@sfu/shared";
import { api } from "../state/api";
import { useLang } from "../state/LangContext";
import { useTheme } from "../state/ThemeContext";
import { useToast } from "../state/ToastContext";
import { Badge, BadgeTone, BottomSheet, Card, Chip, Icon, Input, MutedText, PhotoViewer, PrimaryButton, Screen, ScreenTitle, SecondaryButton, StatusTracker } from "../components/ui";
import { PhotoPicker, photoUrl } from "../components/PhotoPicker";
import { TAB_BAR_CLEARANCE } from "../components/GlassTabBar";

// Category set matches spec §3.9 exactly.
const CATEGORIES = ["Электрика", "Сантехника", "Мебель", "Другое"];

const STATUS_LABEL_KEY: Record<TicketStatus, "ticketStatusNew" | "ticketStatusInProgress" | "ticketStatusDone"> = {
  NEW: "ticketStatusNew",
  IN_PROGRESS: "ticketStatusInProgress",
  DONE: "ticketStatusDone",
};
const STATUS_TONE: Record<TicketStatus, BadgeTone> = { NEW: "warning", IN_PROGRESS: "accent", DONE: "success" };
const STATUS_STEP: Record<TicketStatus, number> = { NEW: 0, IN_PROGRESS: 1, DONE: 2 };

export default function RepairsScreen() {
  const { t } = useLang();
  const { tokens } = useTheme();
  const { showToast } = useToast();
  const floor = (useRoute().params as { floor?: string } | undefined)?.floor;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [creating, setCreating] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  const load = useCallback(() => {
    api.tickets(floor ? { floor } : undefined).then(setTickets);
  }, [floor]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.createTicket({ category, description, photos });
      setDescription("");
      setPhotos([]);
      setCreating(false);
      showToast(t("submit") + " ✓");
      load();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_CLEARANCE + 16, gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <ScreenTitle>{floor ? t("floorTickets") : t("myTickets")}</ScreenTitle>
          {!floor && <SecondaryButton label={t("newTicket")} onPress={() => setCreating(true)} />}
        </View>

        {tickets.length === 0 && <MutedText>{t("noNotifications")}</MutedText>}
        {tickets.map((ticket) => (
          <Card key={ticket.id} style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ gap: 2 }}>
                <Text style={{ color: tokens.tx, fontWeight: "700" }}>{ticket.category}</Text>
                {floor && <MutedText>{t("room")} {ticket.room} · {ticket.resident.fullName}</MutedText>}
              </View>
              <Badge label={t(STATUS_LABEL_KEY[ticket.status])} tone={STATUS_TONE[ticket.status]} />
            </View>
            <MutedText>{ticket.description}</MutedText>
            {ticket.photos.length > 0 && (
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                {ticket.photos.map((p, i) => (
                  <Pressable key={i} onPress={() => setViewingPhoto(photoUrl(p))}>
                    <PhotoThumb url={p} />
                  </Pressable>
                ))}
              </View>
            )}
            <StatusTracker steps={[t("repairStep1"), t("repairStep2"), t("repairStep3")]} activeIndex={STATUS_STEP[ticket.status]} />
            {ticket.comment && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Icon name="message-square" size={12} color={tokens.mu} />
                <MutedText style={{ fontStyle: "italic" }}>{ticket.comment}</MutedText>
              </View>
            )}
          </Card>
        ))}
      </ScrollView>

      <BottomSheet visible={creating} onClose={() => setCreating(false)}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: tokens.tx, fontSize: 18, fontWeight: "700" }}>{t("newTicket")}</Text>
          <Pressable
            onPress={() => setCreating(false)}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: tokens.sub, alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="x" size={16} color={tokens.mu} />
          </Pressable>
        </View>
        <MutedText>{t("ticketCategory")}</MutedText>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {CATEGORIES.map((c) => (
            <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>
        <Input value={description} onChangeText={setDescription} placeholder={t("ticketDescription")} />
        <PhotoPicker value={photos} onChange={setPhotos} />
        <PrimaryButton label={t("submit")} onPress={submit} loading={submitting} disabled={!description} />
      </BottomSheet>

      <PhotoViewer uri={viewingPhoto} onClose={() => setViewingPhoto(null)} />
    </Screen>
  );
}

function PhotoThumb({ url }: { url: string }) {
  const { radii } = useTheme();
  return <Image source={{ uri: photoUrl(url) }} style={{ width: 56, height: 56, borderRadius: radii.sm }} />;
}
