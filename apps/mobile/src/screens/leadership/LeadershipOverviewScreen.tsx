import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { DormLeadershipOverview } from "@sfu/shared";
import { api } from "../../state/api";
import { useTheme } from "../../state/ThemeContext";
import { useLang } from "../../state/LangContext";
import { Card, MutedText, Screen, SecondaryButton } from "../../components/ui";
import { Header } from "../../components/Header";
import { TAB_BAR_CLEARANCE } from "../../components/GlassTabBar";

function StatBlock({ label, value, tone }: { label: string; value: number | string; tone?: "danger" | "warning" }) {
  const { tokens } = useTheme();
  const color = tone === "danger" ? "#DC2626" : tone === "warning" ? "#D97706" : tokens.tx;
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={{ color, fontWeight: "800", fontSize: 17 }}>{value}</Text>
      <MutedText style={{ fontSize: 11 }}>{label}</MutedText>
    </View>
  );
}

export default function LeadershipOverviewScreen() {
  const { tokens } = useTheme();
  const { t } = useLang();
  const navigation = useNavigation<any>();
  const [dorms, setDorms] = useState<DormLeadershipOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [chattingDormId, setChattingDormId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.leadershipDormsOverview().then(setDorms).finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const messageDormAdmin = async (dormId: number) => {
    setChattingDormId(dormId);
    try {
      const contacts = await api.leadershipContacts(dormId);
      if (contacts.length === 0) return;
      const channel = await api.startDM(contacts[0].id);
      navigation.navigate("ChatThread", { channelId: channel.id, title: contacts[0].fullName, canPost: true });
    } finally {
      setChattingDormId(null);
    }
  };

  return (
    <Screen>
      <Header title={t("dormsOverview")} />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_CLEARANCE + 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {dorms.map((d) => (
          <Card key={d.dormId} style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 16 }}>{d.nameRu}</Text>
              <MutedText>
                {d.residentsCount} {t("residents").toLowerCase()}
              </MutedText>
            </View>
            <View style={{ flexDirection: "row" }}>
              <StatBlock label={t("debt")} value={`${d.totalDebt.toLocaleString("ru-RU")} ₽`} tone={d.totalDebt > 0 ? "danger" : undefined} />
              <StatBlock label={t("explanatoryNotes")} value={d.explanatoryNotesCount} />
              <StatBlock label={t("openAppeals")} value={d.openAppealsCount} />
              <StatBlock label={t("pendingReports")} value={d.pendingReportsCount} tone={d.pendingReportsCount > 0 ? "warning" : undefined} />
            </View>
            {d.residentsCount > 0 && (
              <SecondaryButton
                icon="message-circle"
                label={t("chatWithAdmin")}
                onPress={() => messageDormAdmin(d.dormId)}
                loading={chattingDormId === d.dormId}
              />
            )}
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
