import React from "react";
import { Text, View } from "react-native";
import { evictionInfo, EvictionTier } from "@sfu/shared";
import { useAuth } from "../state/AuthContext";
import { useLang } from "../state/LangContext";
import { useTheme } from "../state/ThemeContext";
import { Icon, IconName } from "./ui";

const TIER_COLOR: Record<EvictionTier, string> = {
  NEUTRAL: "#3B82F6",
  REMINDER: "#F59E0B",
  WARNING: "#F97316",
  OVERDUE: "#EF4444",
};

const TIER_ICON: Record<EvictionTier, IconName> = {
  NEUTRAL: "bell",
  REMINDER: "bell",
  WARNING: "alert-triangle",
  OVERDUE: "alert-octagon",
};

export function EvictionBanner() {
  const { user } = useAuth();
  const { t } = useLang();
  const { tokens, radii } = useTheme();

  const info = evictionInfo(user?.checkoutDate ?? null);
  // The neutral tier (>30 days out) isn't worth surfacing yet.
  if (!info || info.tier === "NEUTRAL") return null;

  const color = TIER_COLOR[info.tier];
  const text =
    info.tier === "OVERDUE"
      ? t("checkoutOverdue")
      : `${t("checkoutSoon")}: ${info.daysLeft} ${info.daysLeft === 1 ? "день" : "дн."}`;

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: color,
        backgroundColor: color + "18",
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <Icon name={TIER_ICON[info.tier]} size={20} color={color} />
      <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 13, flex: 1 }}>{text}</Text>
    </View>
  );
}
