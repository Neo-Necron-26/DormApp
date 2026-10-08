import React from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../state/ThemeContext";
import { useLang } from "../../state/LangContext";
import { Card, Icon, IconName, Screen, ScreenTitle } from "../../components/ui";
import { Header } from "../../components/Header";

export default function AdminMoreScreen() {
  const { tokens } = useTheme();
  const { t } = useLang();
  const navigation = useNavigation<any>();

  const ITEMS: { key: string; icon: IconName; label: string }[] = [
    { key: "AdminBroadcast", icon: "volume-2", label: t("broadcasts") },
    { key: "AdminEvents", icon: "calendar", label: t("events") },
    { key: "AdminAppeals", icon: "file-text", label: t("appeals") },
    { key: "AdminContact", icon: "mail", label: t("contactMessagesTitle") },
    { key: "AdminAccounting", icon: "credit-card", label: t("departmentAccounting") },
    { key: "DormLife", icon: "home", label: t("canteenTab") },
    { key: "AdminChat", icon: "message-circle", label: t("chat") },
    { key: "AdminLeadership", icon: "briefcase", label: t("leadership") },
    { key: "Settings", icon: "settings", label: t("settings") },
  ];

  return (
    <Screen>
      <Header title={t("more")} />
      <View style={{ padding: 16, gap: 10 }}>
        <ScreenTitle>{t("admin")}</ScreenTitle>
        {ITEMS.map((item) => (
          <Pressable key={item.key} onPress={() => navigation.navigate(item.key)}>
            <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Icon name={item.icon} size={20} color={tokens.tx} />
              <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 15 }}>{item.label}</Text>
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
