import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { RoomCheck, RoomCheckResult } from "@sfu/shared";
import { api } from "../state/api";
import { useLang } from "../state/LangContext";
import { useTheme } from "../state/ThemeContext";
import { Badge, Card, Input, MutedText, PrimaryButton, Screen, ScreenTitle, SegmentedControl } from "../components/ui";

export default function RoomChecksScreen() {
  const { t } = useLang();
  const { tokens } = useTheme();
  const [checks, setChecks] = useState<RoomCheck[]>([]);
  const [room, setRoom] = useState("");
  const [result, setResult] = useState<RoomCheckResult>("OK");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    api.roomChecks().then(setChecks);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!room) return;
    setSubmitting(true);
    try {
      await api.createRoomCheck({ room, result, notes: notes || undefined });
      setRoom("");
      setNotes("");
      setResult("OK");
      load();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <ScreenTitle>{t("roomChecks")}</ScreenTitle>

        <Card style={{ gap: 10 }}>
          <Input value={room} onChangeText={setRoom} placeholder={t("room")} />
          <SegmentedControl
            value={result}
            onChange={setResult}
            options={[
              { value: "OK", label: t("roomCheckResultOk") },
              { value: "ISSUES", label: t("roomCheckResultIssues") },
            ]}
          />
          {result === "ISSUES" && <Input value={notes} onChangeText={setNotes} placeholder={t("roomCheckNotes")} />}
          <PrimaryButton label={t("roomCheckSubmit")} onPress={submit} loading={submitting} disabled={!room} />
        </Card>

        <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 15 }}>{t("roomCheckHistory")}</Text>
        {checks.map((c) => (
          <Card key={c.id} style={{ gap: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: tokens.tx, fontWeight: "700" }}>{t("room")} {c.room}</Text>
              <Badge label={t(c.result === "OK" ? "roomCheckResultOk" : "roomCheckResultIssues")} tone={c.result === "OK" ? "success" : "danger"} />
            </View>
            {c.notes && <MutedText>{c.notes}</MutedText>}
            <MutedText>{new Date(c.createdAt).toLocaleDateString("ru-RU")}</MutedText>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
