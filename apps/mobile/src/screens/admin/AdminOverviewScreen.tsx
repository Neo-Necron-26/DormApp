import React, { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ActivityItem, AdminStats, PublicUser, Ticket } from "@sfu/shared";
import { api } from "../../state/api";
import { useTheme } from "../../state/ThemeContext";
import { useLang } from "../../state/LangContext";
import { useToast } from "../../state/ToastContext";
import { Badge, BadgeTone, Card, Icon, Input, MutedText, Screen, ScreenTitle, SecondaryButton } from "../../components/ui";
import { Header } from "../../components/Header";
import { TAB_BAR_CLEARANCE } from "../../components/GlassTabBar";

function Kpi({ label, value, accentValue }: { label: string; value: number; accentValue?: boolean }) {
  const { tokens, accent, radii } = useTheme();
  return (
    <View style={{ flex: 1, minWidth: 100, backgroundColor: tokens.card, borderColor: tokens.bd, borderWidth: 1, borderRadius: radii.lg, padding: 12 }}>
      <MutedText>{label}</MutedText>
      <Text style={{ color: accentValue ? accent : tokens.tx, fontSize: 24, fontWeight: "800", marginTop: 4 }}>{value}</Text>
    </View>
  );
}

const TICKET_STATUS_TONE: Record<Ticket["status"], BadgeTone> = { NEW: "warning", IN_PROGRESS: "accent", DONE: "success" };

const ACTIVITY_ICON: Record<ActivityItem["type"], string> = {
  TICKET: "🛠️",
  APPEAL: "📝",
  CONTACT: "📮",
  REGISTRATION: "🆕",
  LOGIN: "🔓",
  MESSAGE: "💬",
};

export default function AdminOverviewScreen() {
  const { tokens, accent, radii } = useTheme();
  const { t } = useLang();
  const { showToast } = useToast();
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [residents, setResidents] = useState<PublicUser[]>([]);
  const [checkouts, setCheckouts] = useState<PublicUser[]>([]);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [reminded, setReminded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<{ residents: PublicUser[] } | null>(null);

  const load = useCallback(async () => {
    const [s, a, r, c, tk] = await Promise.all([
      api.adminStats(),
      api.adminActivity(),
      api.adminResidents(),
      api.adminCheckouts(),
      api.tickets(),
    ]);
    setStats(s);
    setActivity(a);
    setResidents(r);
    setCheckouts(c);
    setRecentTickets(tk.slice(0, 5));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!search.trim()) return setSearchResults(null);
    const timer = setTimeout(() => api.adminSearch(search).then(setSearchResults), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const remind = async (id: string) => {
    await api.sendCheckoutReminder(id);
    setReminded((p) => ({ ...p, [id]: true }));
    showToast(t("checkoutReminderSent"));
  };

  const openTicket = (id: string) => navigation.navigate("Repairs", { openId: id });

  const openActivityItem = (item: ActivityItem) => {
    switch (item.type) {
      case "TICKET":
        return navigation.navigate("Repairs", { openId: item.id });
      case "APPEAL":
        return navigation.navigate("More", { screen: "AdminAppeals", params: { openId: item.id } });
      case "CONTACT":
        return navigation.navigate("More", { screen: "AdminContact" });
      case "REGISTRATION":
        return navigation.navigate("Residents", { openId: item.id });
      case "LOGIN": {
        const userId = item.id.replace(/^login-/, "").replace(/-\d+$/, "");
        return navigation.navigate("Residents", { openId: userId });
      }
      case "MESSAGE":
        return navigation.navigate("More", { screen: "AdminChat" });
    }
  };

  // Occupancy by floor, derived client-side from room numbers — mirrors admin web.
  const floorCounts: Record<string, number> = {};
  residents.forEach((r) => {
    const m = /^(\d)\d{2,3}$/.exec(r.room);
    if (m) floorCounts[m[1]] = (floorCounts[m[1]] || 0) + 1;
  });
  const maxFloorCount = Math.max(1, ...Object.values(floorCounts));

  return (
    <Screen>
      <Header title={t("overview")} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_CLEARANCE + 16, gap: 16 }}>
        <Input value={search} onChangeText={setSearch} placeholder={t("globalSearchPlaceholder")} />
        {searchResults && searchResults.residents.length > 0 && (
          <View style={{ gap: 6 }}>
            {searchResults.residents.map((r) => (
              <Card key={r.id}>
                <Text style={{ color: tokens.tx, fontWeight: "600" }}>{r.fullName}</Text>
                <MutedText>{t("room")} {r.room}</MutedText>
              </Card>
            ))}
          </View>
        )}

        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          <Kpi label={t("kpiStudents")} value={stats?.studentsCount ?? 0} />
          <Kpi label={t("kpiTickets")} value={stats?.openTicketsCount ?? 0} />
          <Kpi label={t("kpiAppeals")} value={stats?.pendingAppealsCount ?? 0} />
          <Kpi label={t("kpiListings")} value={stats?.listingsCount ?? 0} />
          <Kpi label={t("kpiNotLoggedIn")} value={stats?.notLoggedInCount ?? 0} />
        </View>

        <View style={{ gap: 8 }}>
          <ScreenTitle>Последние заявки</ScreenTitle>
          {recentTickets.map((tk) => (
            <Pressable key={tk.id} onPress={() => openTicket(tk.id)}>
              <Card style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={{ color: tokens.tx, fontWeight: "600" }}>{tk.category} · {tk.resident.fullName}</Text>
                  <MutedText>{t("room")} {tk.room}</MutedText>
                </View>
                <Badge
                  label={t(tk.status === "DONE" ? "ticketStatusDone" : tk.status === "IN_PROGRESS" ? "ticketStatusInProgress" : "ticketStatusNew")}
                  tone={TICKET_STATUS_TONE[tk.status]}
                />
              </Card>
            </Pressable>
          ))}
        </View>

        <View style={{ gap: 8 }}>
          <ScreenTitle>{t("occupancyByFloor")}</ScreenTitle>
          <Card style={{ gap: 8 }}>
            {Object.entries(floorCounts)
              .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
              .map(([floor, count]) => (
                <View key={floor} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <MutedText style={{ width: 20 }}>{floor}</MutedText>
                  <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: tokens.sub, overflow: "hidden" }}>
                    <View style={{ width: `${(count / maxFloorCount) * 100}%`, height: 8, backgroundColor: accent }} />
                  </View>
                  <MutedText style={{ width: 24, textAlign: "right" }}>{count}</MutedText>
                </View>
              ))}
          </Card>
        </View>

        {checkouts.length > 0 && (
          <View style={{ gap: 8 }}>
            <ScreenTitle>{t("checkoutSoon")}</ScreenTitle>
            {checkouts.map((r) => (
              <Card key={r.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={{ color: tokens.tx, fontWeight: "600" }}>{r.fullName}</Text>
                  <MutedText>{t("room")} {r.room}</MutedText>
                </View>
                <SecondaryButton
                  label={reminded[r.id] ? "✓" : t("sendReminder")}
                  onPress={() => remind(r.id)}
                />
              </Card>
            ))}
          </View>
        )}

        <View style={{ gap: 8 }}>
          <ScreenTitle>{t("activityFeed")}</ScreenTitle>
          {activity.map((item) => (
            <Pressable key={item.id} onPress={() => openActivityItem(item)}>
              <Card style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
                <Text>{ACTIVITY_ICON[item.type]}</Text>
                <Text style={{ color: tokens.tx, fontSize: 13, flex: 1 }}>{item.text}</Text>
                <Icon name="chevron-right" size={16} color={tokens.mu} />
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
