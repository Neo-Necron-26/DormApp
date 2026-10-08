import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { Appeal, AppealStatus } from "@sfu/shared";
import { api } from "../../state/api";
import { useLang } from "../../state/LangContext";
import { useTheme } from "../../state/ThemeContext";
import { Badge, BadgeTone, BottomSheet, Card, Input, MutedText, PrimaryButton, Screen, SecondaryButton } from "../../components/ui";
import { TAB_BAR_CLEARANCE } from "../../components/GlassTabBar";
import { Header } from "../../components/Header";

const STATUS_TONE: Record<AppealStatus, BadgeTone> = { PENDING: "warning", IN_REVIEW: "accent", RESOLVED: "success" };

export default function AdminAppealsScreen() {
  const { t } = useLang();
  const STATUS_LABEL: Record<AppealStatus, string> = {
    PENDING: t("appealStatusPending"),
    IN_REVIEW: t("appealStatusInReview"),
    RESOLVED: t("appealStatusResolved"),
  };
  const { tokens } = useTheme();
  const { params } = useRoute<any>();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [selected, setSelected] = useState<Appeal | null>(null);
  const [response, setResponse] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.appeals().then(setAppeals);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handledOpenId = useRef<string | null>(null);
  useEffect(() => {
    if (!params?.openId || params.openId === handledOpenId.current || appeals.length === 0) return;
    const appeal = appeals.find((a) => a.id === params.openId);
    if (appeal) {
      handledOpenId.current = params.openId;
      setSelected(appeal);
      setResponse(appeal.response || "");
    }
  }, [params?.openId, appeals]);

  const respond = async (resolve: boolean) => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.respondAppeal(selected.id, { status: resolve ? "RESOLVED" : "IN_REVIEW", response });
      setSelected(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Header title={t("appeals")} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_CLEARANCE + 16, gap: 10 }}>
        {appeals.map((appeal) => (
          <Pressable
            key={appeal.id}
            onPress={() => {
              setSelected(appeal);
              setResponse(appeal.response || "");
            }}
          >
            <Card style={{ gap: 4 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: tokens.tx, fontWeight: "700" }}>{appeal.topic}</Text>
                <Badge label={STATUS_LABEL[appeal.status]} tone={STATUS_TONE[appeal.status]} />
              </View>
              <MutedText style={{ fontFamily: "monospace", fontSize: 11 }}>№{appeal.id.slice(-6).toUpperCase()}</MutedText>
              <MutedText>{appeal.resident ? appeal.resident.fullName : "Анонимно"}</MutedText>
            </Card>
          </Pressable>
        ))}
      </ScrollView>

      <BottomSheet visible={!!selected} onClose={() => setSelected(null)}>
        <Text style={{ color: tokens.tx, fontSize: 18, fontWeight: "700" }}>{selected?.topic}</Text>
        <MutedText>{selected?.text}</MutedText>
        <Input value={response} onChangeText={setResponse} placeholder="Ответ жильцу" />
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <SecondaryButton label={t("appealStatusInReview")} onPress={() => respond(false)} />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton label="Ответить и закрыть" onPress={() => respond(true)} loading={saving} disabled={!response} />
          </View>
        </View>
      </BottomSheet>
    </Screen>
  );
}
