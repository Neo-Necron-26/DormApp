import React, { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { LeadershipReport } from "@sfu/shared";
import { api } from "../../state/api";
import { useTheme } from "../../state/ThemeContext";
import { useLang } from "../../state/LangContext";
import { DORMS } from "@sfu/shared";
import { Badge, Card, MutedText, Screen } from "../../components/ui";
import { Header } from "../../components/Header";
import { TAB_BAR_CLEARANCE } from "../../components/GlassTabBar";

export default function LeadershipReportsScreen() {
  const { tokens } = useTheme();
  const { t } = useLang();
  const [reports, setReports] = useState<LeadershipReport[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.leadershipReports().then(setReports).finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const markRead = async (id: string) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, read: true } : r)));
    await api.markLeadershipReportRead(id);
  };

  return (
    <Screen>
      <Header title={t("leadershipReportsInbox")} />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_CLEARANCE + 16, gap: 10 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {reports.length === 0 && !loading && <MutedText>{t("noReports")}</MutedText>}
        {reports.map((r) => (
          <Pressable key={r.id} onPress={() => !r.read && markRead(r.id)}>
            <Card style={{ gap: 6, opacity: r.read ? 0.7 : 1 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <Text style={{ color: tokens.tx, fontWeight: "700", flex: 1 }} numberOfLines={1}>
                  {r.title}
                </Text>
                {!r.read && (
                  <View style={{ flexShrink: 0 }}>
                    <Badge label={t("unread")} tone="warning" />
                  </View>
                )}
              </View>
              <MutedText>
                {DORMS.find((d) => d.id === r.dormId)?.nameRu ?? `№${r.dormId}`} · {r.author.fullName}
              </MutedText>
              <MutedText>{r.text}</MutedText>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}
