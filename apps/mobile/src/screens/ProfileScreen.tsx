import React, { useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../state/AuthContext";
import { useLang } from "../state/LangContext";
import { useTheme } from "../state/ThemeContext";
import { useToast } from "../state/ToastContext";
import { Avatar, BottomSheet, Card, Icon, IconName, Input, MutedText, PrimaryButton, Screen, SecondaryButton, VerifiedBadge } from "../components/ui";
import { EvictionBanner } from "../components/EvictionBanner";
import { TAB_BAR_CLEARANCE } from "../components/GlassTabBar";
import { ResidentRole } from "@sfu/shared";

const ROLE_LABEL_KEY: Record<ResidentRole, "roleFloorMonitor" | "roleInspector" | "roleNewsEditor" | "roleRegistrar"> = {
  FLOOR_MONITOR: "roleFloorMonitor",
  INSPECTOR: "roleInspector",
  NEWS_EDITOR: "roleNewsEditor",
  REGISTRAR: "roleRegistrar",
};

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  const { tokens } = useTheme();
  if (!value || value.trim() === "") return null;
  return (
    <View style={{ gap: 2 }}>
      <MutedText>{label}</MutedText>
      <Text style={{ color: tokens.tx, fontSize: 15 }} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function ProfileMenuRow({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { tokens } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Icon name={icon} size={18} color={tokens.tx} />
        <Text style={{ color: tokens.tx, fontWeight: "600", fontSize: 16 }}>{label}</Text>
      </View>
      <Icon name="chevron-right" size={18} color={tokens.mu} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { user, updateProfile } = useAuth();
  const { t } = useLang();
  const { tokens } = useTheme();
  const { showToast } = useToast();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => ({
    phone: user?.phone || "",
    email: user?.email || "",
    emergencyContactName: user?.emergencyContactName || "",
    emergencyContactPhone: user?.emergencyContactPhone || "",
    emergencyContactRelation: user?.emergencyContactRelation || "",
    medicalNotes: user?.medicalNotes || "",
    maxId: user?.maxId || "",
    maxVisible: user?.maxVisible || false,
    carPlate: user?.carPlate || "",
    inn: user?.inn || "",
    snils: user?.snils || "",
    birthDate: user?.birthDate || "",
    passportSeries: "",
    passportIssuer: "",
    passportCode: "",
  }));
  const [passOpen, setPassOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [passportModalOpen, setPassportModalOpen] = useState(false);

  if (!user) return null;

  let age = 0;
  if (user.birthDate) {
    const parts = user.birthDate.split("."); // assume DD.MM.YYYY
    if (parts.length === 3) {
      const bDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      const ageDifMs = Date.now() - bDate.getTime();
      const ageDate = new Date(ageDifMs);
      age = Math.abs(ageDate.getUTCFullYear() - 1970);
    }
  }
  const needsPassport = age >= 20 && !user.passportReplacementConfirmed;

  const save = async () => {
    await updateProfile(form);
    setEditing(false);
    showToast(`${t("save")} ✓`);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: TAB_BAR_CLEARANCE + 16, gap: 16 }}>
        <View style={{ marginHorizontal: -16 }}>
           <EvictionBanner />
        </View>

        {needsPassport && (
          <Card style={{ backgroundColor: "#ef44441A", borderColor: "#ef4444", borderWidth: 1, gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Icon name="alert-triangle" size={18} color="#ef4444" />
              <Text style={{ color: "#ef4444", fontWeight: "700", fontSize: 16 }}>{t("passportReplacement" as any) || "Замена паспорта"}</Text>
            </View>
            <Text style={{ color: tokens.tx, fontSize: 14 }}>
              Вам исполнилось 20 лет. Пожалуйста, обновите паспортные данные в течение 90 дней.
            </Text>
            <PrimaryButton label="Обновить данные" onPress={() => setPassportModalOpen(true)} />
          </Card>
        )}

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, flex: 1 }}>
            <Avatar initials={user.initials} size={64} />
            <View style={{ gap: 4, flex: 1 }}>
              <Text style={{ color: tokens.tx, fontSize: 20, fontWeight: "800" }} numberOfLines={1}>{user.fullName}</Text>
              <MutedText>
                Общежитие №{user.dormId} · Комната {user.room}
                {user.section ? ` · Секция ${user.section}` : ""}
              </MutedText>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
                {user.verified && <VerifiedBadge label={t("verified")} />}
                {user.residentRole && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: tokens.sub, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <Icon name="award" size={12} color={tokens.tx} />
                    <Text style={{ color: tokens.tx, fontSize: 11, fontWeight: "600" }}>{t(ROLE_LABEL_KEY[user.residentRole])}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          <Pressable onPress={() => navigation.navigate("Settings")} style={{ padding: 8, backgroundColor: tokens.card, borderRadius: 999, borderWidth: 1, borderColor: tokens.bd }}>
            <Icon name="settings" size={20} color={tokens.tx} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => setPassOpen(true)}
          style={{
            backgroundColor: tokens.card,
            padding: 16,
            borderRadius: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderWidth: 1,
            borderColor: tokens.bd
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: tokens.sub, alignItems: "center", justifyContent: "center" }}>
              <Icon name="credit-card" size={18} color={tokens.tx} />
            </View>
            <Text style={{ color: tokens.tx, fontSize: 16, fontWeight: "700" }}>{t("digitalPass" as any) || "Цифровой пропуск"}</Text>
          </View>
          <Icon name="chevron-right" size={18} color={tokens.mu} />
        </Pressable>

        <Card style={{ paddingVertical: 6, gap: 4 }}>
          <ProfileMenuRow icon="shopping-bag" label={`${t("myListings")} / ${t("favorites")}`} onPress={() => navigation.navigate("MyListings")} />
          <ProfileMenuRow icon="clipboard" label={t("myTicketsAndAppeals")} onPress={() => navigation.navigate("MyTickets")} />
          <ProfileMenuRow icon="book-open" label={t("studies")} onPress={() => navigation.navigate("Studies")} />

          {user.residentRole === "FLOOR_MONITOR" && (
            <ProfileMenuRow icon="tool" label={t("floorTickets")} onPress={() => navigation.navigate("Repairs", { floor: user.room[0] })} />
          )}
          {user.residentRole === "INSPECTOR" && (
            <ProfileMenuRow icon="check-square" label={t("roomChecks")} onPress={() => navigation.navigate("RoomChecks")} />
          )}
          {user.residentRole === "REGISTRAR" && (
            <ProfileMenuRow icon="user-plus" label={t("addResident")} onPress={() => navigation.navigate("AddResident")} />
          )}
        </Card>

        <Card style={{ paddingVertical: 6, gap: 4 }}>
          <ProfileMenuRow icon="user" label={t("contactsCard")} onPress={() => setEditing(true)} />
          <ProfileMenuRow icon="file-text" label="Документы (ИНН, СНИЛС)" onPress={() => setDocsOpen(true)} />
          <ProfileMenuRow icon="message-square" label={`MAX ID: ${user.maxId || "не указан"}`} onPress={() => setEditing(true)} />
        </Card>
      </ScrollView>

      <BottomSheet visible={editing} onClose={() => setEditing(false)}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: tokens.tx, fontSize: 18, fontWeight: "700" }}>{t("contactsCard")}</Text>
          <Pressable
            onPress={() => setEditing(false)}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: tokens.sub, alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="x" size={16} color={tokens.mu} />
          </Pressable>
        </View>
        <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 10 }}>
          <Input value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder={t("phone")} keyboardType="phone-pad" />
          <Input value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} placeholder={t("email")} keyboardType="email-address" />
          <Input value={form.inn} onChangeText={(v) => setForm((f) => ({ ...f, inn: v }))} placeholder="ИНН" keyboardType="number-pad" />
          <Input value={form.snils} onChangeText={(v) => setForm((f) => ({ ...f, snils: v }))} placeholder="СНИЛС" keyboardType="number-pad" />
          <Input value={form.birthDate} onChangeText={(v) => setForm((f) => ({ ...f, birthDate: v }))} placeholder="Дата рождения (ДД.ММ.ГГГГ)" />
          <Input value={form.carPlate} onChangeText={(v) => setForm((f) => ({ ...f, carPlate: v }))} placeholder="Марка машины и гос. номер" />
          <Input value={form.emergencyContactName} onChangeText={(v) => setForm((f) => ({ ...f, emergencyContactName: v }))} placeholder={t("emergencyContact")} />
          <Input value={form.emergencyContactRelation} onChangeText={(v) => setForm((f) => ({ ...f, emergencyContactRelation: v }))} placeholder={t("emergencyContactRelation")} />
          <Input value={form.emergencyContactPhone} onChangeText={(v) => setForm((f) => ({ ...f, emergencyContactPhone: v }))} placeholder={t("phone")} keyboardType="phone-pad" />
          <Input value={form.medicalNotes} onChangeText={(v) => setForm((f) => ({ ...f, medicalNotes: v }))} placeholder={t("medicalNotes")} />
          <Input value={form.maxId} onChangeText={(v) => setForm((f) => ({ ...f, maxId: v }))} placeholder={t("maxLink")} />
        </ScrollView>
        <PrimaryButton label={t("save")} onPress={save} />
      </BottomSheet>

      <BottomSheet visible={passOpen} onClose={() => setPassOpen(false)}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Text style={{ color: tokens.tx, fontSize: 18, fontWeight: "700" }}>{t("digitalPass" as any) || "Цифровой пропуск"}</Text>
          <Pressable
            onPress={() => setPassOpen(false)}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: tokens.sub, alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="x" size={16} color={tokens.mu} />
          </Pressable>
        </View>

        <View style={{ backgroundColor: tokens.card, padding: 24, borderRadius: 20, alignItems: "center", borderWidth: 1, borderColor: tokens.bd }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: tokens.sub, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
             <Text style={{ fontSize: 24, fontWeight: "700", color: tokens.tx }}>{user.initials}</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: "800", color: tokens.tx, textAlign: "center", marginBottom: 4 }}>{user.fullName}</Text>
          <Text style={{ fontSize: 16, color: tokens.mu, marginBottom: 24 }}>Проживающий</Text>

          <View style={{ width: "100%", flexDirection: "row", justifyContent: "space-between", marginBottom: 24 }}>
             <View>
               <Text style={{ color: tokens.mu, fontSize: 12, marginBottom: 2 }}>Общежитие</Text>
               <Text style={{ color: tokens.tx, fontSize: 18, fontWeight: "700" }}>№{user.dormId}</Text>
             </View>
             <View style={{ alignItems: "flex-end" }}>
               <Text style={{ color: tokens.mu, fontSize: 12, marginBottom: 2 }}>Комната</Text>
               <Text style={{ color: tokens.tx, fontSize: 18, fontWeight: "700" }}>{user.room}</Text>
             </View>
          </View>

          {/* Visual pass identifier used by the local development profile. */}
          <View style={{ width: "100%", height: 60, flexDirection: "row", justifyContent: "center", alignItems: "center", overflow: "hidden", opacity: 0.8 }}>
             {[...Array(40)].map((_, i) => (
                <View key={i} style={{ width: Math.random() * 4 + 1, height: "100%", backgroundColor: tokens.tx, marginHorizontal: 1 }} />
             ))}
          </View>
          <Text style={{ color: tokens.mu, fontSize: 14, marginTop: 8, letterSpacing: 2 }}>{user.id.toUpperCase()}</Text>
        </View>
      </BottomSheet>

      <BottomSheet visible={docsOpen} onClose={() => setDocsOpen(false)}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Text style={{ color: tokens.tx, fontSize: 18, fontWeight: "700" }}>Документы и доп. информация</Text>
          <Pressable
            onPress={() => setDocsOpen(false)}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: tokens.sub, alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="x" size={16} color={tokens.mu} />
          </Pressable>
        </View>
        <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ gap: 14 }}>
          <Row label="ИНН" value={user.inn} />
          <Row label="СНИЛС" value={user.snils} />
          <Row label="Машина и номера" value={user.carPlate} />
          <Row label="Дата рождения" value={user.birthDate} />
          <Row
            label={t("emergencyContact")}
            value={[user.emergencyContactName, user.emergencyContactRelation, user.emergencyContactPhone].filter(Boolean).join(" · ")}
          />
          <Row label={t("medicalNotes")} value={user.medicalNotes} />
        </ScrollView>
      </BottomSheet>

      <BottomSheet visible={passportModalOpen} onClose={() => setPassportModalOpen(false)}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Text style={{ color: tokens.tx, fontSize: 18, fontWeight: "700" }}>Обновление паспорта</Text>
          <Pressable onPress={() => setPassportModalOpen(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: tokens.sub, alignItems: "center", justifyContent: "center" }}>
            <Icon name="x" size={16} color={tokens.mu} />
          </Pressable>
        </View>
        <Text style={{ color: tokens.mu, marginBottom: 16, fontSize: 14 }}>Прикрепите фото нового паспорта и укажите новые серию и номер.</Text>
        <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ gap: 10 }}>
          <Pressable style={{ height: 120, backgroundColor: tokens.sub, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 6, borderWidth: 1, borderColor: tokens.bd, borderStyle: "dashed" }}>
            <Icon name="camera" size={24} color={tokens.mu} />
            <Text style={{ color: tokens.mu, marginTop: 8 }}>Прикрепить фото (главный разворот)</Text>
          </Pressable>
          <Input value={form.passportSeries || ""} onChangeText={(v) => setForm((f) => ({ ...f, passportSeries: v }))} placeholder="Серия и номер" keyboardType="number-pad" />
          <Input value={form.passportIssuer || ""} onChangeText={(v) => setForm((f) => ({ ...f, passportIssuer: v }))} placeholder="Кем выдан" />
          <Input value={form.passportCode || ""} onChangeText={(v) => setForm((f) => ({ ...f, passportCode: v }))} placeholder="Код подразделения" keyboardType="number-pad" />
        </ScrollView>
        <View style={{ marginTop: 16 }}>
          <PrimaryButton label="Отправить данные" onPress={() => { setPassportModalOpen(false); updateProfile({ passportReplacementConfirmed: true }); }} />
        </View>
      </BottomSheet>
    </Screen>
  );
}
