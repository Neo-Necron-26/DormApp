import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PublicUser, ResidentRole } from "@sfu/shared";
import { useAuth } from "../state/AuthContext";
import { useLang } from "../state/LangContext";
import { useTheme } from "../state/ThemeContext";
import { useNotifications } from "../state/NotificationsContext";
import { api } from "../state/api";
import { Card, MutedText, Screen, ScreenTitle, SecondaryButton, BottomSheet, Icon } from "../components/ui";
import { TAB_BAR_CLEARANCE } from "../components/GlassTabBar";

const NOTIF_PREFS_KEY = "sfu_admin_notif_prefs_mobile";
type NotifPrefs = { newTicket: boolean; newMessage: boolean; logins: boolean; dailySummary: boolean };
const DEFAULT_PREFS: NotifPrefs = { newTicket: true, newMessage: true, logins: false, dailySummary: false };

const RESIDENT_NOTIF_PREFS_KEY = "sfu_resident_notif_prefs_mobile";
type ResidentNotifPrefs = { tickets: boolean; appeals: boolean; announcements: boolean; lostFound: boolean };
const DEFAULT_RESIDENT_PREFS: ResidentNotifPrefs = { tickets: true, appeals: true, announcements: true, lostFound: true };

function ResidentNotifSection() {
  const { t } = useLang();
  const { tokens, accent } = useTheme();
  const [prefs, setPrefs] = useState<ResidentNotifPrefs>(DEFAULT_RESIDENT_PREFS);

  useEffect(() => {
    AsyncStorage.getItem(RESIDENT_NOTIF_PREFS_KEY).then((saved) => {
      if (saved) {
        try {
          setPrefs({ ...DEFAULT_RESIDENT_PREFS, ...JSON.parse(saved) });
        } catch {
          /* ignore */
        }
      }
    });
  }, []);

  const setPref = (key: keyof ResidentNotifPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    AsyncStorage.setItem(RESIDENT_NOTIF_PREFS_KEY, JSON.stringify(next));
  };

  return (
    <Card style={{ gap: 10 }}>
      <Text style={{ color: tokens.tx, fontWeight: "700" }}>{t("notifTypes")}</Text>
      {(
        [
          ["tickets", t("notifTickets")],
          ["appeals", t("notifAppeals")],
          ["announcements", t("notifAnnouncements")],
          ["lostFound", t("notifLostFound")],
        ] as [keyof ResidentNotifPrefs, string][]
      ).map(([key, label]) => (
        <View key={key} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: tokens.tx, fontSize: 13 }}>{label}</Text>
          <Switch value={prefs[key]} onValueChange={(v) => setPref(key, v)} trackColor={{ true: accent }} />
        </View>
      ))}
    </Card>
  );
}

function AdminSettingsSection() {
  const { t } = useLang();
  const { tokens, accent } = useTheme();
  const [staff, setStaff] = useState<PublicUser[]>([]);
  const [roleHolders, setRoleHolders] = useState<PublicUser[]>([]);
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);

  const ROLE_LABEL: Record<ResidentRole, string> = {
    FLOOR_MONITOR: t("roleFloorMonitor"),
    INSPECTOR: t("roleInspector"),
    NEWS_EDITOR: t("roleNewsEditor"),
    REGISTRAR: t("roleRegistrar"),
  };

  useEffect(() => {
    api.adminStaff().then(setStaff);
    api.adminResidents().then((all) => setRoleHolders(all.filter((r) => r.residentRole)));
    AsyncStorage.getItem(NOTIF_PREFS_KEY).then((saved) => {
      if (saved) {
        try {
          setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(saved) });
        } catch {
          /* ignore */
        }
      }
    });
  }, []);

  const setPref = (key: keyof NotifPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    AsyncStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(next));
  };

  return (
    <>
      <Card style={{ gap: 10 }}>
        <Text style={{ color: tokens.tx, fontWeight: "700" }}>{t("adminNotifPrefs")}</Text>
        {(
          [
            ["newTicket", t("notifNewTicket")],
            ["newMessage", t("notifNewMessage")],
            ["logins", t("notifLogins")],
            ["dailySummary", t("notifDailySummary")],
          ] as [keyof NotifPrefs, string][]
        ).map(([key, label]) => (
          <View key={key} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: tokens.tx, fontSize: 13 }}>{label}</Text>
            <Switch value={prefs[key]} onValueChange={(v) => setPref(key, v)} trackColor={{ true: accent }} />
          </View>
        ))}
      </Card>

      <Card style={{ gap: 8 }}>
        <Text style={{ color: tokens.tx, fontWeight: "700" }}>{t("dormStaff")}</Text>
        {staff.map((s) => (
          <MutedText key={s.id}>
            {s.fullName} {s.maxId ? `· ${s.maxId}` : ""}
          </MutedText>
        ))}
      </Card>

      <Card style={{ gap: 8 }}>
        <Text style={{ color: tokens.tx, fontWeight: "700" }}>{t("roleHolders")}</Text>
        {roleHolders.length === 0 && <MutedText>{t("noRoleHolders")}</MutedText>}
        {roleHolders.map((r) => (
          <MutedText key={r.id}>
            {r.fullName} · {r.residentRole && ROLE_LABEL[r.residentRole]}
          </MutedText>
        ))}
      </Card>
    </>
  );
}

export default function SettingsScreen() {
  const { t, lang, setLang } = useLang();
  const { tokens, themeName, setThemeName, accentMode, setAccentMode, accent } = useTheme();
  const { user, logout } = useAuth();
  const { enabled, setEnabled } = useNotifications();
  const insets = useSafeAreaInsets();
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [accentModalOpen, setAccentModalOpen] = useState(false);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + TAB_BAR_CLEARANCE + 16, gap: 16 }}>
        <ScreenTitle>{t("settings")}</ScreenTitle>

        <Card style={{ gap: 10 }}>
          <Text style={{ color: tokens.tx, fontWeight: "700" }}>{t("language")}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["ru", "en"] as const).map((l) => (
              <Pressable
                key={l}
                onPress={() => setLang(l)}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: lang === l ? accent : tokens.sub,
                }}
              >
                <Text style={{ color: lang === l ? "#fff" : tokens.tx, fontWeight: "700" }}>{l.toUpperCase()}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card style={{ gap: 10 }}>
          <Text style={{ color: tokens.tx, fontWeight: "700" }}>Внешний вид</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={() => setThemeModalOpen(true)}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: tokens.sub,
                paddingHorizontal: 16,
                flexDirection: "row"
              }}
            >
              <Text style={{ color: tokens.tx, fontWeight: "600" }}>
                {themeName === "light" ? t("light") : themeName === "dark" ? t("dark") : themeName === "blue" ? t("themeBlue") : themeName === "monokai" ? t("themeMonokai") : themeName === "nord" ? t("themeNord" as any) : t("themeCatppuccin" as any)}
              </Text>
              <Icon name="chevron-down" size={20} color={tokens.mu} />
            </Pressable>

            <Pressable
              onPress={() => setAccentModalOpen(true)}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: tokens.sub,
                paddingHorizontal: 16,
                flexDirection: "row"
              }}
            >
              <Text style={{ color: tokens.tx, fontWeight: "600" }}>
                {accentMode === "orange" ? "Оранжевый" : accentMode === "blue" ? "Синий" : "Зеленый"}
              </Text>
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: accent }} />
            </Pressable>
          </View>
        </Card>

        <Card style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: tokens.tx, fontWeight: "700" }}>{t("notifications")}</Text>
          <Switch value={enabled} onValueChange={setEnabled} trackColor={{ true: accent }} />
        </Card>

        {enabled && user?.role === "STUDENT" && <ResidentNotifSection />}

        <Card style={{ gap: 6 }}>
          <Text style={{ color: tokens.tx, fontWeight: "700" }}>{t("account")}</Text>
          <MutedText>
            {t("login")}: {user?.login}
          </MutedText>
          {user?.role === "STUDENT" && (
            <MutedText>
              {t("room")}: {user.room}
              {user.section ? ` · ${t("section")} ${user.section}` : ""}
            </MutedText>
          )}
          {user?.role === "STUDENT" && <MutedText>MAX: {user.maxId || "—"}</MutedText>}
        </Card>

        {user?.role === "ADMIN" && <AdminSettingsSection />}

        <Card style={{ gap: 4 }}>
          <Text style={{ color: tokens.tx, fontWeight: "700" }}>{t("aboutApp")}</Text>
          <MutedText>{t("appName")} · v1.0.0</MutedText>
        </Card>

        <SecondaryButton label={t("logout")} onPress={logout} />
      </ScrollView>

      <BottomSheet visible={themeModalOpen} onClose={() => setThemeModalOpen(false)}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: tokens.tx, marginBottom: 16 }}>Фон приложения</Text>
        <View style={{ gap: 8 }}>
          {(["light", "dark", "blue", "monokai", "nord", "catppuccin"] as const).map((th) => (
            <Pressable
              key={th}
              onPress={() => {
                setThemeName(th);
                setThemeModalOpen(false);
              }}
              style={{
                height: 48,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                backgroundColor: themeName === th ? accent : tokens.sub,
              }}
            >
              <Text style={{ color: themeName === th ? "#fff" : tokens.tx, fontWeight: "600", fontSize: 16 }}>
                {th === "light" ? t("light") : th === "dark" ? t("dark") : th === "blue" ? t("themeBlue") : th === "monokai" ? t("themeMonokai") : th === "nord" ? t("themeNord" as any) : t("themeCatppuccin" as any)}
              </Text>
              {themeName === th && <Icon name="check" size={20} color="#fff" />}
            </Pressable>
          ))}
        </View>
      </BottomSheet>

      <BottomSheet visible={accentModalOpen} onClose={() => setAccentModalOpen(false)}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: tokens.tx, marginBottom: 16 }}>Цвет акцента</Text>
        <View style={{ gap: 8 }}>
          {(["orange", "blue", "green"] as const).map((acc) => (
            <Pressable
              key={acc}
              onPress={() => {
                setAccentMode(acc);
                setAccentModalOpen(false);
              }}
              style={{
                height: 48,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                backgroundColor: accentMode === acc ? accent : tokens.sub,
              }}
            >
              <Text style={{ color: accentMode === acc ? "#fff" : tokens.tx, fontWeight: "600", fontSize: 16 }}>
                {acc === "orange" ? "Оранжевый" : acc === "blue" ? "Синий" : "Зеленый"}
              </Text>
              {accentMode === acc && <Icon name="check" size={20} color="#fff" />}
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    </Screen>
  );
}
