import React, { useCallback, useEffect, useRef, useState } from "react";
import { DimensionValue, Linking, LayoutAnimation, Platform, Pressable, ScrollView, Text, UIManager, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Appeal, DormEvent, PaymentsSummary, Ticket } from "@sfu/shared";
import { api } from "../state/api";
import { useLang } from "../state/LangContext";
import { useTheme } from "../state/ThemeContext";
import { Badge, BottomSheet, Card, Icon, IconName, MutedText, PrimaryButton, Screen, ScreenTitle } from "../components/ui";
import { Header } from "../components/Header";
import { TAB_BAR_CLEARANCE } from "../components/GlassTabBar";

const FAQ_RU = [
  { q: "Расписание прачечной", a: "Прачечная на 1 этаже работает ежедневно с 8:00 до 22:00. Запись через вахту, стирка бесплатна, свой порошок." },
  { q: "Правила для гостей", a: "Гости оформляются на вахте по паспорту, находятся в общежитии до 23:00. Для гостя с ночёвкой — согласование с комендантом лично." },
  { q: "Режим тишины", a: "Тишина соблюдается ежедневно с 23:00 до 7:00 и с 13:00 до 15:00 в будни. Нарушение — основание для заявления." },
  { q: "Продление договора", a: "Заявление на продление подаётся коменданту не позднее чем за 2 недели до окончания срока проживания." },
];

const FAQ_EN = [
  { q: "Laundry schedule", a: "The 1st-floor laundry room is open daily 8:00–22:00. Sign up at the front desk; washing is free, bring your own detergent." },
  { q: "Guest rules", a: "Guests are registered at the front desk by ID and must leave by 23:00. An overnight guest needs the commandant's personal approval." },
  { q: "Quiet hours", a: "Quiet hours are 23:00–7:00 daily and 13:00–15:00 on weekdays. Violations can be reported via an appeal." },
  { q: "Contract renewal", a: "Submit a renewal request to the commandant at least 2 weeks before your residency period ends." },
];

function SmallServiceCard({ icon, label, onPress, width = "22%" }: { icon: IconName; label: string; onPress: () => void, width?: DimensionValue }) {
  const { tokens, accent, radii } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{ width, backgroundColor: tokens.card, borderColor: tokens.bd, borderWidth: 1, borderRadius: radii.lg, paddingVertical: 12, paddingHorizontal: 4, gap: 8, alignItems: 'center' }}
    >
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: accent + "1F", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={22} color={accent} />
      </View>
      <Text style={{ color: tokens.tx, fontWeight: "600", fontSize: 11, textAlign: 'center', lineHeight: 14 }} numberOfLines={2}>{label}</Text>
    </Pressable>
  );
}

function ListServiceCard({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { tokens, accent, radii } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: tokens.card, borderColor: tokens.bd, borderWidth: 1, borderRadius: radii.lg, padding: 14, gap: 12 }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: tokens.sub, alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={18} color={accent} />
      </View>
      <Text style={{ color: tokens.tx, fontWeight: "600", fontSize: 15, flex: 1 }}>{label}</Text>
      <Icon name="chevron-right" size={18} color={tokens.mu} />
    </Pressable>
  );
}

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ServicesHomeScreen() {
  const { t, lang } = useLang();
  const { tokens, accent } = useTheme();
  const navigation = useNavigation<any>();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [events, setEvents] = useState<DormEvent[]>([]);
  const [payments, setPayments] = useState<PaymentsSummary | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const faq = lang === "ru" ? FAQ_RU : FAQ_EN;
  const scrollRef = useRef<ScrollView>(null);

  const toggleFaq = (i: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenFaq((prev) => (prev === i ? null : i));
  };

  const [disabilityOpen, setDisabilityOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [commandantOpen, setCommandantOpen] = useState(false);

  const load = useCallback(async () => {
    const [e, p, tk, ap] = await Promise.all([api.events(), api.payments(), api.tickets(), api.appeals()]);
    setEvents(e);
    setPayments(p);
    setTickets(tk);
    setAppeals(ap);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeTickets = (tickets || []).filter((tk) => tk.status !== "DONE");
  const activeAppeals = (appeals || []).filter((a) => a.status !== "RESOLVED");
  const balanceLabel = payments ? (payments.balance < 0 ? t("paymentBalanceOwed") : payments.balance > 0 ? t("paymentBalanceCredit") : t("statusActive")) : "";
  const recentTickets = [...(tickets || [])].sort((a, b) => (b.createdAt < a.createdAt ? -1 : b.createdAt > a.createdAt ? 1 : 0)).slice(0, 3);

  return (
    <Screen>
      <Header title={t("servicesHub")} />
      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_CLEARANCE + 16, gap: 16 }}>
        {/* Two large lead cards, per spec §3.6: balance and appeals-in-progress up front. */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable onPress={() => navigation.navigate("Payment")} style={{ flex: 1 }}>
            <Card style={{ gap: 6 }}>
              <Icon name="credit-card" size={20} color={accent} />
              <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 15 }}>{t("payment")}</Text>
              {payments && (
                <Text style={{ color: payments.balance < 0 ? "#DC2626" : tokens.tx, fontWeight: "800", fontSize: 18 }}>
                  {Math.abs(payments.balance).toLocaleString("ru-RU")} ₽
                </Text>
              )}
              <MutedText>{balanceLabel}</MutedText>
            </Card>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("Appeals")} style={{ flex: 1 }}>
            <Card style={{ gap: 6 }}>
              <Icon name="file-text" size={20} color={accent} />
              <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 15 }}>{t("appeals")}</Text>
              <Text style={{ color: tokens.tx, fontWeight: "800", fontSize: 18 }}>{activeAppeals.length}</Text>
              <MutedText>{t("appealStatusInReview")}</MutedText>
            </Card>
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.navigate("Repairs")}>
          <View style={{ backgroundColor: accent, borderRadius: 22, padding: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Icon name="tool" size={24} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>{t("repair")}</Text>
            </View>
            {activeTickets.length > 0 && (
              <View style={{ backgroundColor: "rgba(255,255,255,.25)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>{activeTickets.length}</Text>
              </View>
            )}
          </View>
        </Pressable>

        <View>
          <View style={{ marginBottom: 12 }}>
            <ScreenTitle>Сервисы и информация</ScreenTitle>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
            <SmallServiceCard icon="home" label={t("dormLife")} onPress={() => navigation.navigate("DormLife")} />
            <SmallServiceCard icon="package" label="Мат. пропуск" onPress={() => navigation.navigate("MaterialList")} />
            <SmallServiceCard icon="search" label={t("lostFound")} onPress={() => navigation.navigate("LostFound")} />
            <SmallServiceCard icon="mail" label="Связь с админ." onPress={() => navigation.navigate("ContactAdmin")} />
            <SmallServiceCard icon="info" label="Инвалидам" onPress={() => setDisabilityOpen(true)} />
            <SmallServiceCard icon="file-text" label="Правила" onPress={() => setRulesOpen(true)} />
            <SmallServiceCard icon="help-circle" label="FAQ" onPress={() => setFaqOpen(true)} />
            <SmallServiceCard icon="phone" label="Комендант" onPress={() => setCommandantOpen(true)} />
          </View>
        </View>

        {(events || []).length > 0 && (
          <View style={{ gap: 8 }}>
            <ScreenTitle>{t("events")}</ScreenTitle>
            {(events || []).map((e) => (
              <Card key={e.id}>
                <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 14 }}>{e.title}</Text>
                <MutedText style={{ marginTop: 4 }}>{new Date(e.date).toLocaleDateString("ru-RU")}</MutedText>
                <MutedText style={{ marginTop: 4 }}>{e.description}</MutedText>
              </Card>
            ))}
          </View>
        )}

        <Pressable onPress={() => navigation.navigate("MyTickets")}>
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <ScreenTitle>{t("myTicketsAndAppeals")}</ScreenTitle>
              <Icon name="chevron-right" size={18} color={tokens.mu} />
            </View>
            {recentTickets.length === 0 && <MutedText>{t("noNotifications")}</MutedText>}
            {(recentTickets || []).map((tk) => (
              <Card key={tk.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: tokens.tx, fontWeight: "600" }}>{tk.category}</Text>
                <Badge label={t(tk.status === "DONE" ? "ticketStatusDone" : tk.status === "IN_PROGRESS" ? "ticketStatusInProgress" : "ticketStatusNew")} tone={tk.status === "DONE" ? "success" : tk.status === "IN_PROGRESS" ? "accent" : "warning"} />
              </Card>
            ))}
          </View>
        </Pressable>
      </ScrollView>

      <BottomSheet visible={disabilityOpen} onClose={() => setDisabilityOpen(false)}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: tokens.tx, marginBottom: 16 }}>Помощь инвалидам</Text>
        <ScrollView style={{ maxHeight: 400 }}>
           <Text style={{ fontSize: 15, color: tokens.tx, marginBottom: 8, fontWeight: "600" }}>Документы для оформления льгот:</Text>
           <Text style={{ fontSize: 14, color: tokens.tx, marginBottom: 12 }}>1. Справка, подтверждающая факт установления инвалидности.</Text>
           <Text style={{ fontSize: 14, color: tokens.tx, marginBottom: 12 }}>2. Индивидуальная программа реабилитации (ИПР).</Text>
           <Text style={{ fontSize: 14, color: tokens.tx, marginBottom: 12 }}>3. Заявление на имя ректора.</Text>
           <Text style={{ fontSize: 15, color: tokens.tx, marginTop: 12, marginBottom: 8, fontWeight: "600" }}>Куда обратиться:</Text>
           <Text style={{ fontSize: 14, color: tokens.tx }}>Единый социальный центр СФУ, каб. 104. Вы можете оставить заявку через раздел "Обращения".</Text>
        </ScrollView>
        <View style={{ marginTop: 16 }}>
           <PrimaryButton label="Закрыть" onPress={() => setDisabilityOpen(false)} />
        </View>
      </BottomSheet>

      <BottomSheet visible={rulesOpen} onClose={() => setRulesOpen(false)}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: tokens.tx, marginBottom: 16 }}>Правила проживания</Text>
        <ScrollView style={{ maxHeight: 400 }}>
           <Text style={{ fontSize: 15, color: tokens.tx, marginBottom: 8, fontWeight: "600" }}>Основные правила:</Text>
           <Text style={{ fontSize: 14, color: tokens.tx, marginBottom: 12 }}>• Соблюдение тишины с 23:00 до 7:00.</Text>
           <Text style={{ fontSize: 14, color: tokens.tx, marginBottom: 12 }}>• Запрещено курение, распитие алкоголя и хранение запрещенных веществ.</Text>
           <Text style={{ fontSize: 14, color: tokens.tx, marginBottom: 12 }}>• Гости могут находиться в общежитии с 8:00 до 23:00 по предъявлению документов.</Text>
           <Text style={{ fontSize: 14, color: tokens.tx, marginBottom: 12 }}>• Регулярная уборка в комнатах и блоках — обязанность проживающих.</Text>
           <Text style={{ fontSize: 14, color: tokens.tx, marginBottom: 12 }}>• Крупногабаритная техника подлежит обязательному оформлению через коменданта.</Text>
           <Text style={{ fontSize: 14, color: tokens.tx, marginBottom: 12 }}>• Использование обогревателей кустарного производства запрещено.</Text>
        </ScrollView>
        <View style={{ marginTop: 16 }}>
           <PrimaryButton label="Закрыть" onPress={() => setRulesOpen(false)} />
        </View>
      </BottomSheet>

      <BottomSheet visible={faqOpen} onClose={() => setFaqOpen(false)}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: tokens.tx, marginBottom: 16 }}>{t("faq")}</Text>
        <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ gap: 8 }}>
          {(faq || []).map((item, i) => (
            <Pressable key={i} onPress={() => toggleFaq(i)}>
              <View style={{ backgroundColor: tokens.ph1, borderRadius: 12, padding: 14 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                   <Text style={{ color: tokens.tx, fontWeight: "600", fontSize: 14, flex: 1 }}>{item.q}</Text>
                   <Icon name={openFaq === i ? "chevron-up" : "chevron-down"} size={16} color={tokens.mu} />
                </View>
                {openFaq === i && <MutedText style={{ marginTop: 6 }}>{item.a}</MutedText>}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>

      <BottomSheet visible={commandantOpen} onClose={() => setCommandantOpen(false)}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: tokens.tx, marginBottom: 16 }}>Контакты коменданта</Text>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
             <Icon name="user" size={20} color={tokens.tx} />
             <Text style={{ color: tokens.tx, fontSize: 15 }}>Наталья Сергеевна Орлова</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
             <Icon name="phone" size={20} color={tokens.tx} />
             <Pressable onPress={() => Linking.openURL("tel:+73912441090")}>
               <Text style={{ color: accent, fontWeight: "600", fontSize: 15 }}>+7 391 244-10-90</Text>
             </Pressable>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
             <Icon name="clock" size={20} color={tokens.tx} />
             <Text style={{ color: tokens.tx, fontSize: 15 }}>пн–пт, 10:00–17:00, каб. 101</Text>
          </View>
        </View>
        <View style={{ marginTop: 24 }}>
           <PrimaryButton label="Закрыть" onPress={() => setCommandantOpen(false)} />
        </View>
      </BottomSheet>
    </Screen>
  );
}
