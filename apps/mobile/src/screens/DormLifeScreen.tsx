import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  Facility,
  FacilityBooking,
  FacilitySlot,
  MealType,
  MenuItem,
  RoommateRequest,
  RoommateRequestType,
} from "@sfu/shared";
import { api } from "../state/api";
import { useAuth } from "../state/AuthContext";
import { useLang } from "../state/LangContext";
import { useTheme } from "../state/ThemeContext";
import { useToast } from "../state/ToastContext";
import {
  Avatar,
  Badge,
  BottomSheet,
  Card,
  Chip,
  Icon,
  Input,
  MutedText,
  PrimaryButton,
  Screen,
  ScreenTitle,
  SecondaryButton,
  SegmentedControl,
} from "../components/ui";

type Tab = "facilities" | "canteen" | "roommates";
const DAY_KEYS = ["dayMon", "dayTue", "dayWed", "dayThu", "dayFri", "daySat"] as const;
const MEAL_KEYS: Record<MealType, "mealBreakfast" | "mealLunch" | "mealDinner"> = {
  BREAKFAST: "mealBreakfast",
  LUNCH: "mealLunch",
  DINNER: "mealDinner",
};

function nextDays(n: number): { date: string; label: string }[] {
  const out: { date: string; label: string }[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    out.push({ date: d.toISOString().slice(0, 10), label: d.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" }) });
  }
  return out;
}

function FacilitiesTab() {
  const { t } = useLang();
  const { tokens, accent, radii } = useTheme();
  const { showToast } = useToast();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilityId, setFacilityId] = useState<string | null>(null);
  const dates = useMemo(() => nextDays(7), []);
  const [date, setDate] = useState(dates[0].date);
  const [slots, setSlots] = useState<FacilitySlot[]>([]);
  const [myBookings, setMyBookings] = useState<FacilityBooking[]>([]);

  useEffect(() => {
    api.facilities().then((fs) => {
      setFacilities(fs);
      if (fs.length > 0) setFacilityId(fs[0].id);
    });
  }, []);

  const loadMine = useCallback(() => {
    api.myFacilityBookings().then(setMyBookings);
  }, []);

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  const loadSlots = useCallback(() => {
    if (!facilityId) return;
    api.facilitySlots(facilityId, date).then(setSlots);
  }, [facilityId, date]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const book = async (startTime: string) => {
    if (!facilityId) return;
    try {
      await api.bookFacilitySlot(facilityId, { date, startTime });
      showToast(t("slotBookedToast"));
      loadSlots();
      loadMine();
    } catch {
      showToast(t("slotTakenError"));
      loadSlots();
    }
  };

  const cancel = async (id: string) => {
    await api.cancelFacilityBooking(id);
    loadSlots();
    loadMine();
  };

  if (facilities.length === 0) return <MutedText>{t("noFacilities")}</MutedText>;

  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {facilities.map((f) => (
          <Chip key={f.id} label={f.type === "LAUNDRY" ? t("laundry") : f.name} active={facilityId === f.id} onPress={() => setFacilityId(f.id)} />
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {dates.map((d) => (
            <Chip key={d.date} label={d.label} active={date === d.date} onPress={() => setDate(d.date)} />
          ))}
        </View>
      </ScrollView>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {slots.map((s) => (
          <Pressable
            key={s.startTime}
            disabled={s.booked && !s.mine}
            onPress={() => (s.mine ? undefined : book(s.startTime))}
            style={{
              paddingHorizontal: 12,
              height: 38,
              borderRadius: radii.md,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: s.mine ? accent : s.booked ? tokens.sub : tokens.card,
              borderWidth: 1,
              borderColor: s.mine ? accent : tokens.bd,
              opacity: s.booked && !s.mine ? 0.5 : 1,
            }}
          >
            <Text style={{ color: s.mine ? "#fff" : tokens.tx, fontWeight: "700", fontSize: 12 }}>{s.startTime}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 14 }}>{t("myBookings")}</Text>
      {myBookings.length === 0 && <MutedText>{t("noBookings")}</MutedText>}
      {myBookings.map((b) => (
        <Card key={b.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ color: tokens.tx, fontWeight: "700" }}>{b.facility.type === "LAUNDRY" ? t("laundry") : b.facility.name}</Text>
            <MutedText>
              {new Date(b.date).toLocaleDateString("ru-RU")} · {b.startTime}
            </MutedText>
          </View>
          <SecondaryButton icon="x" label={t("cancelBooking")} onPress={() => cancel(b.id)} />
        </Card>
      ))}
    </View>
  );
}

function CanteenTab() {
  const { t } = useLang();
  const { user } = useAuth();
  const { tokens, accent } = useTheme();
  const { showToast } = useToast();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ dayOfWeek: "1", mealType: "BREAKFAST" as MealType, name: "", price: "" });

  const load = useCallback(() => {
    api.canteenMenu().then(setItems);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    const byDay: Record<number, MenuItem[]> = {};
    items.forEach((i) => {
      (byDay[i.dayOfWeek] ||= []).push(i);
    });
    return byDay;
  }, [items]);

  const addItem = async () => {
    if (!form.name || !form.price) return;
    await api.addMenuItem({ dayOfWeek: Number(form.dayOfWeek), mealType: form.mealType, name: form.name, price: Number(form.price) });
    setForm({ dayOfWeek: "1", mealType: "BREAKFAST", name: "", price: "" });
    load();
  };

  const removeItem = async (id: string) => {
    await api.deleteMenuItem(id);
    showToast(t("save") + " ✓");
    load();
  };

  if (items.length === 0 && user?.role !== "ADMIN") return <MutedText>{t("noMenuYet")}</MutedText>;

  return (
    <View style={{ gap: 16 }}>
      {DAY_KEYS.map((dayKey, i) => {
        const dow = i + 1;
        const dayItems = grouped[dow] || [];
        if (dayItems.length === 0) return null;
        return (
          <View key={dayKey} style={{ gap: 8 }}>
            <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 14 }}>{t(dayKey)}</Text>
            <Card style={{ gap: 8 }}>
              {dayItems.map((mi) => (
                <View key={mi.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <MutedText style={{ fontSize: 11 }}>{t(MEAL_KEYS[mi.mealType])}</MutedText>
                    <Text style={{ color: tokens.tx, fontSize: 13 }}>{mi.name}</Text>
                  </View>
                  <Text style={{ color: accent, fontWeight: "700", fontSize: 13 }}>{mi.price} ₽</Text>
                  {user?.role === "ADMIN" && (
                    <Pressable onPress={() => removeItem(mi.id)}>
                      <Icon name="x" size={16} color={tokens.mu} />
                    </Pressable>
                  )}
                </View>
              ))}
            </Card>
          </View>
        );
      })}

      {user?.role === "ADMIN" && (
        <Card style={{ gap: 10 }}>
          <Text style={{ color: tokens.tx, fontWeight: "700" }}>+ {t("weeklyMenu")}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {DAY_KEYS.map((dk, i) => (
              <Chip key={dk} label={t(dk)} active={form.dayOfWeek === String(i + 1)} onPress={() => setForm((f) => ({ ...f, dayOfWeek: String(i + 1) }))} />
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["BREAKFAST", "LUNCH", "DINNER"] as MealType[]).map((mt) => (
              <Chip key={mt} label={t(MEAL_KEYS[mt])} active={form.mealType === mt} onPress={() => setForm((f) => ({ ...f, mealType: mt }))} />
            ))}
          </View>
          <Input value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} placeholder={t("dishNamePlaceholder")} />
          <Input value={form.price} onChangeText={(v) => setForm((f) => ({ ...f, price: v }))} placeholder="₽" />
          <PrimaryButton label={t("save")} onPress={addItem} disabled={!form.name || !form.price} />
        </Card>
      )}
    </View>
  );
}

function RoommatesTab() {
  const { t } = useLang();
  const { user } = useAuth();
  const { tokens } = useTheme();
  const { showToast } = useToast();
  const navigation = useNavigation<any>();
  const [requests, setRequests] = useState<RoommateRequest[]>([]);
  const [mine, setMine] = useState<RoommateRequest[]>([]);
  const [posting, setPosting] = useState(false);
  const [form, setForm] = useState<{ type: RoommateRequestType; desiredRoom: string; description: string }>({
    type: "SWAP",
    desiredRoom: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [contacting, setContacting] = useState<string | null>(null);

  const load = useCallback(() => {
    api.roommateRequests().then(setRequests);
    api.myRoommateRequests().then(setMine);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!form.description) return;
    setSubmitting(true);
    try {
      await api.createRoommateRequest({ type: form.type, desiredRoom: form.desiredRoom || undefined, description: form.description });
      setForm({ type: "SWAP", desiredRoom: "", description: "" });
      setPosting(false);
      showToast(t("roommateRequestPosted"));
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const close = async (id: string) => {
    await api.updateRoommateRequestStatus(id, "CLOSED");
    showToast(t("requestClosed"));
    load();
  };

  const contact = async (residentId: string, fullName: string) => {
    setContacting(residentId);
    try {
      const channel = await api.startDM(residentId);
      navigation.navigate("ChatThread", { channelId: channel.id, title: fullName, canPost: true });
    } finally {
      setContacting(null);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
        <SecondaryButton icon="plus" label={t("postRoommateRequest")} onPress={() => setPosting(true)} />
      </View>

      {requests
        .filter((r) => r.resident.id !== user?.id)
        .map((r) => (
          <Card key={r.id} style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Avatar initials={r.resident.initials} size={28} />
                <Text style={{ color: tokens.tx, fontWeight: "700" }}>
                  {r.resident.fullName} · {t("room")} {r.resident.room}
                </Text>
              </View>
              <Badge label={t(r.type === "SWAP" ? "roommateTypeSwap" : "roommateTypeSeek")} tone={r.type === "SWAP" ? "accent" : "neutral"} />
            </View>
            <MutedText>{r.description}</MutedText>
            {r.desiredRoom && <MutedText>{t("desiredRoomPlaceholder")}: {r.desiredRoom}</MutedText>}
            <SecondaryButton
              icon="message-circle"
              label={t("writeInApp")}
              onPress={() => contact(r.resident.id, r.resident.fullName)}
              loading={contacting === r.resident.id}
            />
          </Card>
        ))}
      {requests.filter((r) => r.resident.id !== user?.id).length === 0 && <MutedText>{t("noRoommateRequests")}</MutedText>}

      {mine.length > 0 && (
        <>
          <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 14, marginTop: 8 }}>{t("myRoommateRequests")}</Text>
          {mine.map((r) => (
            <Card key={r.id} style={{ gap: 6, opacity: r.status === "CLOSED" ? 0.6 : 1 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <Badge label={t(r.type === "SWAP" ? "roommateTypeSwap" : "roommateTypeSeek")} tone={r.type === "SWAP" ? "accent" : "neutral"} />
                {r.status === "ACTIVE" && <SecondaryButton label={t("closeRequest")} onPress={() => close(r.id)} />}
              </View>
              <MutedText>{r.description}</MutedText>
            </Card>
          ))}
        </>
      )}

      <BottomSheet visible={posting} onClose={() => setPosting(false)}>
        <Text style={{ color: tokens.tx, fontSize: 18, fontWeight: "700" }}>{t("postRoommateRequest")}</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Chip label={t("roommateTypeSwap")} active={form.type === "SWAP"} onPress={() => setForm((f) => ({ ...f, type: "SWAP" }))} />
          <Chip label={t("roommateTypeSeek")} active={form.type === "SEEK_ROOMMATE"} onPress={() => setForm((f) => ({ ...f, type: "SEEK_ROOMMATE" }))} />
        </View>
        {form.type === "SWAP" && (
          <Input value={form.desiredRoom} onChangeText={(v) => setForm((f) => ({ ...f, desiredRoom: v }))} placeholder={t("desiredRoomPlaceholder")} />
        )}
        <Input value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} placeholder={t("roommateDescriptionPlaceholder")} />
        <PrimaryButton label={t("postRoommateRequest")} onPress={submit} loading={submitting} disabled={!form.description} />
      </BottomSheet>
    </View>
  );
}

export default function DormLifeScreen() {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>("facilities");

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <ScreenTitle>{t("dormLife")}</ScreenTitle>
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: "facilities", label: t("facilitiesTab") },
            { value: "canteen", label: t("canteenTab") },
            { value: "roommates", label: t("roommatesTab") },
          ]}
        />
        {tab === "facilities" && <FacilitiesTab />}
        {tab === "canteen" && <CanteenTab />}
        {tab === "roommates" && <RoommatesTab />}
      </ScrollView>
    </Screen>
  );
}
