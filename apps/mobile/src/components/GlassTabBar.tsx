import React from "react";
import { Pressable, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import type { NavVariant } from "@sfu/shared";
import { useTheme } from "../state/ThemeContext";
import { Icon, IconName } from "./ui";

// Matches the height of the pill + its own vertical padding, so screens can
// reserve exactly this much bottom clearance instead of guessing a number.
export const TAB_BAR_CLEARANCE = 92;

/**
 * Spec §6.5 describes 3 interchangeable nav-bar prototypes (pill-with-labels /
 * icon-only dock / expanding segment) as a component-level setting, not a
 * resident-facing preference — so it's a single constant, not exposed in
 * Settings. Change this to preview another variant.
 */
export const NAV_VARIANT: NavVariant = "pill";

export function GlassTabBar({
  state,
  navigation,
  icons,
  labels,
}: BottomTabBarProps & { icons: Record<string, IconName>; labels: Record<string, string> }) {
  const { tokens, accent, themeName } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={{ position: "absolute", left: 16, right: 16, bottom: insets.bottom + 10 }}>
      <BlurView
        intensity={85}
        tint={themeName === "light" ? "light" : "dark"}
        style={{
          flexDirection: "row",
          borderRadius: 999,
          borderWidth: 1,
          borderColor: tokens.gbd,
          backgroundColor: tokens.glass,
          paddingVertical: 8,
          paddingHorizontal: 8,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 30,
          shadowOffset: { width: 0, height: 12 },
          elevation: 14,
        }}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          const icon = icons[route.name] || "circle";
          const label = labels[route.name] || route.name;

          if (NAV_VARIANT === "dock") {
            return (
              <Pressable key={route.key} onPress={onPress} style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 6 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isFocused ? accent : "transparent",
                  }}
                >
                  <Icon name={icon} size={19} color={isFocused ? "#fff" : tokens.mu} />
                </View>
              </Pressable>
            );
          }

          if (NAV_VARIANT === "segment") {
            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={{
                  flex: isFocused ? 1.6 : 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: isFocused ? accent : "transparent",
                }}
              >
                <Icon name={icon} size={18} color={isFocused ? "#fff" : tokens.mu} />
                {isFocused && <Text style={{ fontSize: 12, fontWeight: "700", color: "#fff" }}>{label}</Text>}
              </Pressable>
            );
          }

          // "pill": icon + label stacked, current/default look.
          return (
            <Pressable key={route.key} onPress={onPress} style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 8, gap: 3 }}>
              <Icon name={icon} size={20} color={isFocused ? accent : tokens.mu} />
              <Text style={{ fontSize: 10, fontWeight: "700", color: isFocused ? accent : tokens.mu }}>{label}</Text>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}
