import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Image, Modal, Pressable, StyleProp, StyleSheet, Text, TextInput, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../state/ThemeContext";

export type IconName = React.ComponentProps<typeof Feather>["name"];

export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color?: string }) {
  const { tokens } = useTheme();
  return <Feather name={name} size={size} color={color || tokens.tx} />;
}

// expo-blur only supports real (gaussian) blur on iOS and web; on Android it
// renders a translucent view with no blur (its "dimezisBlurView" method needs
// a `blurTarget` wired to the exact sibling content behind it, which doesn't
// fit an arbitrary-scrolling-content overlay like this one — so we accept the
// documented Android fallback rather than fight it). The border, shadow, and
// floating placement over content carry the "glass" look on that platform.
export function GlassPanel({
  children,
  style,
  intensity = 96,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
}) {
  const { tokens, themeName, radii } = useTheme();
  return (
    <BlurView
      intensity={intensity}
      tint={themeName === "dark" ? "dark" : "light"}
      style={[
        {
          borderRadius: radii.xl,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: tokens.gbd,
          backgroundColor: tokens.glass,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: -8 },
          elevation: 12,
        },
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}

/** A bottom-sheet modal that closes when tapping the dimmed backdrop (not when
 * tapping the sheet itself) — the inner no-op Pressable "claims" the touch
 * responder for anything inside it, so it never bubbles to the backdrop. */
export function BottomSheet({
  visible,
  onClose,
  children,
  style,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const { radii } = useTheme();
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(40)).current;

  // animationType="none" + our own Animated entrance (instead of the native
  // "slide" transition) sidesteps an Android quirk where the Modal's opaque
  // window background briefly flashes before its transparent style paints —
  // letting the OS drive the open transition is what exposes that first frame;
  // driving it ourselves after the (already-transparent) Modal has mounted
  // doesn't.
  useEffect(() => {
    if (visible) {
      backdropOpacity.setValue(0);
      sheetY.setValue(40);
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(sheetY, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, backdropOpacity, sheetY]);

  return (
    <Modal visible={visible} animationType="none" transparent statusBarTranslucent hardwareAccelerated onRequestClose={onClose}>
      <Animated.View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,.5)", opacity: backdropOpacity }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={{ transform: [{ translateY: sheetY }] }}>
          <Pressable onPress={() => {}}>
            <GlassPanel
              style={[
                {
                  borderTopLeftRadius: radii.xl,
                  borderTopRightRadius: radii.xl,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  padding: 20,
                  gap: 12,
                },
                style,
              ]}
            >
              {children}
            </GlassPanel>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

/** Full-screen tap-to-enlarge photo viewer — pass the currently-open photo's
 * URL (or null to keep it closed) plus a close handler. Reused wherever a
 * screen shows small photo thumbnails (tickets, lost & found, etc.) so they're
 * actually openable, not just decorative. */
export function PhotoViewer({ uri, onClose }: { uri: string | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (uri) {
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    }
  }, [uri, opacity]);

  return (
    <Modal visible={!!uri} transparent animationType="none" statusBarTranslucent hardwareAccelerated onRequestClose={onClose}>
      <Animated.View style={{ flex: 1, backgroundColor: "rgba(0,0,0,.92)", opacity }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Pressable
          onPress={onClose}
          style={{
            position: "absolute",
            top: insets.top + 12,
            right: 16,
            zIndex: 1,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(255,255,255,.15)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="x" size={20} color="#fff" />
        </Pressable>
        {uri && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }} pointerEvents="none">
            <Image source={{ uri }} style={{ width: "100%", height: "80%" }} resizeMode="contain" />
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { tokens } = useTheme();
  return <View style={[{ flex: 1, backgroundColor: tokens.bg }, style]}>{children}</View>;
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void }) {
  const { tokens, radii } = useTheme();
  const content = (
    <View
      style={[
        {
          backgroundColor: tokens.card,
          borderColor: tokens.bd,
          borderWidth: 1,
          borderRadius: radii.lg,
          padding: 14,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
  if (!onPress) return content;
  return <Pressable onPress={onPress}>{content}</Pressable>;
}

export function ScreenTitle({ children }: { children: React.ReactNode }) {
  const { tokens } = useTheme();
  return <Text style={{ fontSize: 28, fontWeight: "700", color: tokens.tx, letterSpacing: -0.3 }}>{children}</Text>;
}

export function MutedText({
  children,
  style,
  numberOfLines,
}: {
  children: React.ReactNode;
  style?: any;
  numberOfLines?: number;
}) {
  const { tokens } = useTheme();
  return (
    <Text style={[{ color: tokens.mu, fontSize: 13 }, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

export function BodyText({ children, style }: { children: React.ReactNode; style?: any }) {
  const { tokens } = useTheme();
  return <Text style={[{ color: tokens.tx, fontSize: 15 }, style]}>{children}</Text>;
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const { accent, accentSoft, radii } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 20 }).start();
      }}
      onPressOut={() => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
      }}
      disabled={disabled || loading}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={[accent, accentSoft]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: radii.md,
            height: 50,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              style={{ color: "#fff", fontWeight: "700", fontSize: 15, paddingHorizontal: 10 }}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {label}
            </Text>
          )}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  icon,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
}) {
  const { tokens, radii } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 20 }).start();
      }}
      onPressOut={() => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
      }}
      disabled={disabled || loading}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Animated.View
        style={{
          flexDirection: "row",
          gap: 8,
          borderWidth: 1,
          borderColor: tokens.bd,
          backgroundColor: tokens.card,
          borderRadius: radii.pill,
          height: 44,
          paddingHorizontal: 16,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ scale }],
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={tokens.tx} />
        ) : (
          <>
            {icon && <Icon name={icon} size={15} color={tokens.tx} />}
            <Text
              style={{ color: tokens.tx, fontWeight: "700", fontSize: 13, flexShrink: 1 }}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {label}
            </Text>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

export function Input({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize = "none",
  keyboardType,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words";
  keyboardType?: "default" | "phone-pad" | "email-address" | "number-pad";
}) {
  const { tokens, radii } = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={tokens.mu}
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
      keyboardType={keyboardType}
      style={{
        borderWidth: 1,
        borderColor: tokens.bd,
        backgroundColor: tokens.inp,
        color: tokens.tx,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 0,
        height: 50,
        fontSize: 15,
        textAlignVertical: "center",
      }}
    />
  );
}

/** A round icon-only button — for actions that shouldn't carry a label
 * (e.g. "add" in a header row), instead of stretching SecondaryButton with
 * an empty label. */
export function IconButton({
  icon,
  onPress,
  size = 44,
  variant = "card",
}: {
  icon: IconName;
  onPress: () => void;
  size?: number;
  variant?: "card" | "accent";
}) {
  const { tokens, accent, radii } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: radii.pill,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: variant === "accent" ? accent : tokens.card,
        borderWidth: variant === "accent" ? 0 : 1,
        borderColor: tokens.bd,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Icon name={icon} size={18} color={variant === "accent" ? "#fff" : tokens.tx} />
    </Pressable>
  );
}

export function Avatar({ initials, size = 44 }: { initials: string; size?: number }) {
  const { accent, accentSoft } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: accent,
      }}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: size / 2, backgroundColor: accentSoft, opacity: 0.001 },
        ]}
      />
      <Text style={{ color: "#fff", fontWeight: "700", fontSize: size * 0.34 }}>{initials}</Text>
    </View>
  );
}

export function VerifiedBadge({ label }: { label: string }) {
  const { accent } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Icon name="check-circle" size={13} color={accent} />
      <Text style={{ color: accent, fontSize: 12, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

/** A single filter/selection pill — replaces the hand-rolled Pressable+View chip
 * pattern that used to be duplicated across most screens. */
export function Chip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
}) {
  const { tokens, accent, radii } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        height: 40,
        paddingHorizontal: 14,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: active ? accent : tokens.bd,
        backgroundColor: active ? accent : tokens.card,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {icon && <Icon name={icon} size={14} color={active ? "#fff" : tokens.tx} />}
      <Text style={{ color: active ? "#fff" : tokens.tx, fontWeight: "600", fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

/** A small colored status label — replaces the per-screen inline View+Text
 * "status badge" pattern (ticket status, listing sold, lost/found kind, etc). */
export function Badge({ label, tone = "neutral" }: { label: string; tone?: BadgeTone }) {
  const { tokens, accent } = useTheme();
  const colors: Record<BadgeTone, { bg: string; fg: string }> = {
    neutral: { bg: tokens.sub, fg: tokens.mu },
    accent: { bg: accent + "22", fg: accent },
    success: { bg: "#1a9e5c22", fg: "#1a9e5c" },
    warning: { bg: "#F59E0B22", fg: "#B45309" },
    danger: { bg: "#DC262622", fg: "#DC2626" },
  };
  const c = colors[tone];
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ color: c.fg, fontSize: 11, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

/** A 3-stage horizontal progress tracker, used by repair tickets and any other
 * flow with a fixed linear status sequence. */
export function StatusTracker({ steps, activeIndex }: { steps: string[]; activeIndex: number }) {
  const { tokens, accent } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          <View style={{ alignItems: "center", gap: 4, width: 64 }}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: i <= activeIndex ? accent : tokens.sub,
              }}
            >
              {i < activeIndex ? (
                <Icon name="check" size={12} color="#fff" />
              ) : (
                <Text style={{ color: i <= activeIndex ? "#fff" : tokens.mu, fontSize: 11, fontWeight: "700" }}>{i + 1}</Text>
              )}
            </View>
            <Text
              style={{ fontSize: 10, textAlign: "center", color: i <= activeIndex ? tokens.tx : tokens.mu, fontWeight: i === activeIndex ? "700" : "400" }}
              numberOfLines={2}
            >
              {step}
            </Text>
          </View>
          {i < steps.length - 1 && (
            <View style={{ flex: 1, height: 2, backgroundColor: i < activeIndex ? accent : tokens.sub, marginBottom: 14 }} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

/** A pill-style segmented control (list/map toggle, LOST/FOUND toggle, etc). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { tokens, accent, radii } = useTheme();
  return (
    <View style={{ flexDirection: "row", backgroundColor: tokens.sub, borderRadius: radii.pill, padding: 3 }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 6,
              borderRadius: radii.pill,
              alignItems: "center",
              backgroundColor: active ? accent : "transparent",
            }}
          >
            <Text
              style={{ color: active ? "#fff" : tokens.mu, fontWeight: "700", fontSize: 13, textAlign: "center" }}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
