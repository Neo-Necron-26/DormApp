import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { Appeal, AppealStatus, Ticket, TicketStatus } from "@sfu/shared";
import { api } from "../state/api";
import { useLang } from "../state/LangContext";
import { useTheme } from "../state/ThemeContext";
import { Badge, BadgeTone, Card, MutedText, Screen, ScreenTitle } from "../components/ui";

const TICKET_STATUS_KEY: Record<TicketStatus, "ticketStatusNew" | "ticketStatusInProgress" | "ticketStatusDone"> = {
  NEW: "ticketStatusNew",
  IN_PROGRESS: "ticketStatusInProgress",
  DONE: "ticketStatusDone",
};
const TICKET_TONE: Record<TicketStatus, BadgeTone> = { NEW: "warning", IN_PROGRESS: "accent", DONE: "success" };
const APPEAL_STATUS_KEY: Record<AppealStatus, "appealStatusPending" | "appealStatusInReview" | "appealStatusResolved"> = {
  PENDING: "appealStatusPending",
  IN_REVIEW: "appealStatusInReview",
  RESOLVED: "appealStatusResolved",
};
const APPEAL_TONE: Record<AppealStatus, BadgeTone> = { PENDING: "warning", IN_REVIEW: "accent", RESOLVED: "success" };

type Row = {
  id: string;
  kind: "ticket" | "appeal";
  title: string;
  text: string;
  statusLabel: string;
  tone: BadgeTone;
  date: string;
  comment: string | null;
};

export default function MyTicketsScreen() {
  const { t } = useLang();
  const { tokens } = useTheme();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tickets, appeals] = await Promise.all([api.tickets(), api.appeals()]);
      const merged: Row[] = [
        ...(tickets || []).map(
          (tk: Ticket): Row => ({
            id: tk.id,
            kind: "ticket",
            title: tk.category,
            text: tk.description,
            statusLabel: t(TICKET_STATUS_KEY[tk.status]),
            tone: TICKET_TONE[tk.status],
            date: tk.createdAt,
            comment: tk.comment,
          })
        ),
        ...(appeals || []).map(
          (a: Appeal): Row => ({
            id: a.id,
            kind: "appeal",
            title: a.topic,
            text: a.text,
            statusLabel: t(APPEAL_STATUS_KEY[a.status]),
            tone: APPEAL_TONE[a.status],
            date: a.createdAt,
            comment: a.response,
          })
        ),
      ];
      merged.sort((a, b) => (b.date < a.date ? -1 : b.date > a.date ? 1 : 0));
      setRows(merged);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen>
      <View style={{ padding: 16 }}>
        <ScreenTitle>{t("myTicketsAndAppeals")}</ScreenTitle>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(r) => `${r.kind}-${r.id}`}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 10 }}
        renderItem={({ item }) => (
          <Card style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: tokens.tx, fontWeight: "700" }}>
                {item.kind === "ticket" ? "🛠 " : "📝 "}
                {item.title}
              </Text>
              <Badge label={item.statusLabel} tone={item.tone} />
            </View>
            <MutedText style={{ fontFamily: "monospace", fontSize: 11 }}>
              № {item.id.slice(-6).toUpperCase()} · {new Date(item.date).toLocaleDateString("ru-RU")}
            </MutedText>
            <MutedText>{item.text}</MutedText>
            {item.comment && <MutedText style={{ fontStyle: "italic" }}>{item.comment}</MutedText>}
          </Card>
        )}
      />
    </Screen>
  );
}
