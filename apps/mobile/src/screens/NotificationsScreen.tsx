import React from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppNotification } from "@sfu/shared";
import { useNotifications } from "../state/NotificationsContext";
import { useAuth } from "../state/AuthContext";
import { useLang } from "../state/LangContext";
import { useTheme } from "../state/ThemeContext";
import { Card, Icon, IconName, MutedText, Screen, ScreenTitle, SecondaryButton } from "../components/ui";

function iconFor(type: AppNotification["type"]): IconName {
  switch (type) {
    case "TICKET_STATUS":
      return "tool";
    case "APPEAL_RESPONSE":
      return "file-text";
    case "ANNOUNCEMENT":
      return "volume-2";
    case "EVENT":
      return "calendar";
    case "ROLE_ASSIGNED":
      return "award";
    case "LOST_FOUND":
      return "search";
    case "ROOM_CHECK":
      return "check-square";
    case "CHECKOUT_REMINDER":
      return "log-out";
    case "MESSAGE":
      return "message-square";
    case "INVOICE_STATUS":
      return "file-text";
    default:
      return "bell";
  }
}

export default function NotificationsScreen() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const { user } = useAuth();
  const { t } = useLang();
  const { tokens, accent } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const isAdmin = user?.role === "ADMIN";
  const isStudent = user?.role === "STUDENT";

  // NotificationsScreen is a top-level screen pushed over the Tabs navigator
  // (not nested inside it), so a bare navigate("Services") etc. has nothing
  // to bubble to — it must name "Tabs" explicitly and nest params down.
  // Branches are gated by role, not just `isAdmin`/`!isAdmin`: several of
  // these target screens (Repairs, Appeals, Studies, ListingDetail, ...) only
  // exist for STUDENT, so a LEADERSHIP viewer must fall through instead of
  // hitting a screen that isn't registered for their nav tree.
  const onPress = async (n: AppNotification) => {
    if (!n.read) await markRead(n.id);
    if (n.linkType === "ticket") {
      if (isAdmin) navigation.navigate("Tabs", { screen: "Repairs" });
      else if (isStudent) navigation.navigate("Repairs");
    } else if (n.linkType === "appeal") {
      if (isAdmin) navigation.navigate("Tabs", { screen: "More", params: { screen: "AdminAppeals" } });
      else if (isStudent) navigation.navigate("Appeals");
    } else if (n.linkType === "announcement") {
      if (isAdmin) navigation.navigate("Tabs", { screen: "More", params: { screen: "AdminChat" } });
      else if (isStudent) navigation.navigate("Tabs", { screen: "News" });
    } else if (n.linkType === "listing" && isStudent) {
      navigation.navigate("ListingDetail", { id: n.linkId });
    } else if (n.linkType === "lostfound" && isStudent) {
      navigation.navigate("Tabs", { screen: "Services", params: { screen: "LostFound" } });
    } else if (n.linkType === "contact" && isAdmin) {
      navigation.navigate("Tabs", { screen: "More", params: { screen: "AdminContact" } });
    } else if (n.linkType === "certificate" && isStudent) {
      navigation.navigate("Studies");
    } else if (n.linkType === "invoice") {
      if (isStudent) navigation.navigate("Studies", { initialTab: "certificates" });
      else if (isAdmin) navigation.navigate("Tabs", { screen: "More", params: { screen: "AdminAccounting" } });
    }
  };

  return (
    <Screen>
      <View style={{ padding: 16, paddingTop: insets.top + 16, gap: 12, flex: 1 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <ScreenTitle>{t("notifications")}</ScreenTitle>
          {unreadCount > 0 && <SecondaryButton label={t("markAllRead")} onPress={markAllRead} />}
        </View>
        {notifications.length === 0 && <MutedText>{t("noNotifications")}</MutedText>}
        {notifications.map((n) => (
          <Pressable key={n.id} onPress={() => onPress(n)}>
            <Card style={{ flexDirection: "row", gap: 10, borderColor: n.read ? tokens.bd : accent }}>
              <Icon name={iconFor(n.type)} size={18} color={tokens.tx} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 14 }}>{n.title}</Text>
                <MutedText style={{ marginTop: 2 }}>{n.body}</MutedText>
              </View>
              {!n.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accent, marginTop: 4 }} />}
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
