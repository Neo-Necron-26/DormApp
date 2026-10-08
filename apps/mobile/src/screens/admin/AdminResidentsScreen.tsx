import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { PublicUser, ResidentRole } from "@sfu/shared";
import { api } from "../../state/api";
import { useTheme } from "../../state/ThemeContext";
import { useLang } from "../../state/LangContext";
import { useToast } from "../../state/ToastContext";
import { BottomSheet, Card, Chip, Icon, IconButton, Input, MutedText, PrimaryButton, Screen, SecondaryButton } from "../../components/ui";
import { TAB_BAR_CLEARANCE } from "../../components/GlassTabBar";
import { Header } from "../../components/Header";

const ROLE_LABEL_KEY: Record<ResidentRole, "roleFloorMonitor" | "roleInspector" | "roleNewsEditor" | "roleRegistrar"> = {
  FLOOR_MONITOR: "roleFloorMonitor",
  INSPECTOR: "roleInspector",
  NEWS_EDITOR: "roleNewsEditor",
  REGISTRAR: "roleRegistrar",
};

export default function AdminResidentsScreen() {
  const { tokens } = useTheme();
  const { t } = useLang();
  const { showToast } = useToast();
  const { params } = useRoute<any>();
  const [residents, setResidents] = useState<PublicUser[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PublicUser | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ fullName: "", login: "", room: "", section: "", password: "sfu2026" });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    api.adminResidents(query || undefined).then(setResidents);
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const handledOpenId = useRef<string | null>(null);
  useEffect(() => {
    if (!params?.openId || params.openId === handledOpenId.current || residents.length === 0) return;
    const resident = residents.find((r) => r.id === params.openId);
    if (resident) {
      handledOpenId.current = params.openId;
      setSelected(resident);
    }
  }, [params?.openId, residents]);

  const patch = async (id: string, body: Partial<PublicUser>) => {
    const updated = await api.adminUpdateResident(id, body);
    setResidents((prev) => prev.map((r) => (r.id === id ? updated : r)));
    setSelected(updated);
  };

  const addResident = async () => {
    setSubmitting(true);
    try {
      const result = await api.adminCreateResident({ ...form, section: form.section || undefined });
      setForm({ fullName: "", login: "", room: "", section: "", password: "sfu2026" });
      setAdding(false);
      load();
      if (result.replaced) showToast(t("duplicateLoginReplaced"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Header title={t("residents")} />
      <View style={{ paddingHorizontal: 16, marginBottom: 8, flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Input value={query} onChangeText={setQuery} placeholder={t("globalSearchPlaceholder")} />
        </View>
        <IconButton icon="user-plus" onPress={() => setAdding(true)} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: TAB_BAR_CLEARANCE + 16, gap: 10 }}>
        {residents.map((r) => (
          <Pressable key={r.id} onPress={() => setSelected(r)}>
            <Card style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={{ color: tokens.tx, fontWeight: "700" }}>{r.fullName}</Text>
                <MutedText>
                  {t("room")} {r.room}
                  {r.section ? ` · ${t("section")} ${r.section}` : ""}
                </MutedText>
              </View>
              <Icon name={r.verified ? "check-circle" : "clock"} size={16} color={r.verified ? "#22C55E" : tokens.mu} />
            </Card>
          </Pressable>
        ))}
      </ScrollView>

      <BottomSheet visible={!!selected} onClose={() => setSelected(null)}>
        <Text style={{ color: tokens.tx, fontSize: 18, fontWeight: "700" }}>{selected?.fullName}</Text>
        <MutedText>{selected?.login} · {t("room")} {selected?.room}</MutedText>
        <MutedText>{t("phone")}: {selected?.phone || "—"} · MAX: {selected?.maxId || "—"}</MutedText>
        <MutedText>
          {t("emergencyContact")}: {[selected?.emergencyContactName, selected?.emergencyContactRelation, selected?.emergencyContactPhone].filter(Boolean).join(" · ") || "—"}
        </MutedText>

        <Text style={{ color: tokens.tx, fontWeight: "700", marginTop: 6 }}>{t("verified")}</Text>
        <SecondaryButton
          icon={selected?.verified ? "check-circle" : undefined}
          label={selected?.verified ? t("verified") : t("edit")}
          onPress={() => selected && patch(selected.id, { verified: !selected.verified })}
        />

        <Text style={{ color: tokens.tx, fontWeight: "700", marginTop: 6 }}>{t("role")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Chip label={t("roleNone")} active={!selected?.residentRole} onPress={() => selected && patch(selected.id, { residentRole: null })} />
          {(Object.keys(ROLE_LABEL_KEY) as ResidentRole[]).map((role) => (
            <Chip
              key={role}
              label={t(ROLE_LABEL_KEY[role])}
              active={selected?.residentRole === role}
              onPress={() => selected && patch(selected.id, { residentRole: role })}
            />
          ))}
        </View>
      </BottomSheet>

      <BottomSheet visible={adding} onClose={() => setAdding(false)}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: tokens.tx, fontSize: 18, fontWeight: "700" }}>{t("addResident")}</Text>
          <Pressable
            onPress={() => setAdding(false)}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: tokens.sub, alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="x" size={16} color={tokens.mu} />
          </Pressable>
        </View>
        <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: 10 }}>
          <Input value={form.fullName} onChangeText={(v) => setForm((f) => ({ ...f, fullName: v }))} placeholder={t("fullName")} autoCapitalize="words" />
          <Input value={form.login} onChangeText={(v) => setForm((f) => ({ ...f, login: v }))} placeholder={t("login")} />
          <Input value={form.room} onChangeText={(v) => setForm((f) => ({ ...f, room: v }))} placeholder={t("room")} />
          <Input value={form.section} onChangeText={(v) => setForm((f) => ({ ...f, section: v }))} placeholder={t("section")} />
          <Input value={form.password} onChangeText={(v) => setForm((f) => ({ ...f, password: v }))} placeholder={t("password")} />
        </ScrollView>
        <PrimaryButton label={t("addResident")} onPress={addResident} loading={submitting} disabled={!form.fullName || !form.login || !form.room} />
      </BottomSheet>
    </Screen>
  );
}
