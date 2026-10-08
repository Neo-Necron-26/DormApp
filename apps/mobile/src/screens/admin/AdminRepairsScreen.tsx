import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { Ticket, TicketStatus } from "@sfu/shared";
import { api } from "../../state/api";
import { useLang } from "../../state/LangContext";
import { useTheme } from "../../state/ThemeContext";
import { Badge, BadgeTone, BottomSheet, Card, Chip, Input, MutedText, PhotoViewer, PrimaryButton, Screen } from "../../components/ui";
import { photoUrl } from "../../components/PhotoPicker";
import { TAB_BAR_CLEARANCE } from "../../components/GlassTabBar";
import { Header } from "../../components/Header";

const STATUS_TONE: Record<TicketStatus, BadgeTone> = { NEW: "warning", IN_PROGRESS: "accent", DONE: "success" };

export default function AdminRepairsScreen() {
  const { t } = useLang();
  const STATUS_LABEL: Record<TicketStatus, string> = {
    NEW: t("ticketStatusNew"),
    IN_PROGRESS: t("ticketStatusInProgress"),
    DONE: t("ticketStatusDone"),
  };
  const { tokens, radii } = useTheme();
  const { params } = useRoute<any>();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [status, setStatus] = useState<TicketStatus>("NEW");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  const load = useCallback(() => {
    api.tickets({ q: query || undefined }).then(setTickets);
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const openTicket = (tk: Ticket) => {
    setSelected(tk);
    setStatus(tk.status);
    setComment(tk.comment || "");
  };

  const handledOpenId = useRef<string | null>(null);
  useEffect(() => {
    if (!params?.openId || params.openId === handledOpenId.current || tickets.length === 0) return;
    const ticket = tickets.find((tk) => tk.id === params.openId);
    if (ticket) {
      handledOpenId.current = params.openId;
      openTicket(ticket);
    }
  }, [params?.openId, tickets]);

  const doSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.updateTicket(selected.id, { status, comment });
      setSelected(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const save = () => {
    if (!selected) return;
    if (status !== selected.status) {
      Alert.alert(t("confirmStatusChangeTitle"), t("confirmStatusChangeBody"), [
        { text: t("cancel"), style: "cancel" },
        { text: t("confirm"), onPress: doSave },
      ]);
    } else {
      doSave();
    }
  };

  return (
    <Screen>
      <Header title={t("repairs")} />
      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <Input value={query} onChangeText={setQuery} placeholder="Поиск по комнате, ID или категории" />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: TAB_BAR_CLEARANCE + 16, gap: 10 }}>
        {tickets.map((ticket) => (
          <Pressable key={ticket.id} onPress={() => openTicket(ticket)}>
            <Card style={{ gap: 4 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: tokens.tx, fontWeight: "700" }}>{ticket.category}</Text>
                <Badge label={STATUS_LABEL[ticket.status]} tone={STATUS_TONE[ticket.status]} />
              </View>
              <MutedText style={{ fontFamily: "monospace", fontSize: 11 }}>№{ticket.id.slice(-6).toUpperCase()}</MutedText>
              <MutedText>{ticket.resident.fullName} · комната {ticket.room}</MutedText>
            </Card>
          </Pressable>
        ))}
      </ScrollView>

      <BottomSheet visible={!!selected} onClose={() => setSelected(null)}>
        <Text style={{ color: tokens.tx, fontSize: 18, fontWeight: "700" }}>{selected?.category}</Text>
        <MutedText>{selected?.description}</MutedText>
        {!!selected?.photos.length && (
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
            {selected.photos.map((p) => (
              <Pressable key={p} onPress={() => setViewingPhoto(photoUrl(p))}>
                <Image source={{ uri: photoUrl(p) }} style={{ width: 56, height: 56, borderRadius: radii.sm }} />
              </Pressable>
            ))}
          </View>
        )}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {(["NEW", "IN_PROGRESS", "DONE"] as TicketStatus[]).map((s) => (
            <Chip key={s} label={STATUS_LABEL[s]} active={status === s} onPress={() => setStatus(s)} />
          ))}
        </View>
        <Input value={comment} onChangeText={setComment} placeholder={t("adminComment")} />
        <PrimaryButton label={t("save")} onPress={save} loading={saving} />
      </BottomSheet>

      <PhotoViewer uri={viewingPhoto} onClose={() => setViewingPhoto(null)} />
    </Screen>
  );
}
