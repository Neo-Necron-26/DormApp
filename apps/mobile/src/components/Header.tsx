import React from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../state/AuthContext";
import { useTheme } from "../state/ThemeContext";
import { useNotifications } from "../state/NotificationsContext";
import { Avatar, Icon } from "./ui";

export function Header({ title }: { title: string }) {
  const { tokens, accent } = useTheme();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const isAdmin = user?.role === "ADMIN";
  const isLeadership = user?.role === "LEADERSHIP";

  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: insets.top + 8 }}>
      <Text numberOfLines={1} style={{ flex: 1, fontSize: 26, fontWeight: "700", color: tokens.tx, letterSpacing: -0.4, marginRight: 8 }}>{title}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <Pressable
          onPress={() => navigation.navigate("Notifications")}
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: tokens.card,
            borderWidth: 1,
            borderColor: tokens.bd,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="bell" size={19} color={tokens.tx} />
          {unreadCount > 0 && (
            <View
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: accent,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 3,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 9, fontWeight: "700" }}>{unreadCount}</Text>
            </View>
          )}
        </Pressable>
        <Pressable
          onPress={() =>
            isAdmin
              ? navigation.navigate("More", { screen: "Settings" })
              : isLeadership
                ? navigation.navigate("Settings")
                : navigation.navigate("Profile")
          }
        >
          <Avatar initials={user?.initials || "?"} size={46} />
        </Pressable>
      </View>
    </View>
  );
}
