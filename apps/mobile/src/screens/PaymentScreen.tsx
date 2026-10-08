import React, { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { PaymentMethod, PaymentPeriod, PaymentsSummary } from "@sfu/shared";
import { api } from "../state/api";
import { useAuth } from "../state/AuthContext";
import { useLang } from "../state/LangContext";
import { useTheme } from "../state/ThemeContext";
import { useToast } from "../state/ToastContext";
import { Card, Input, MutedText, PrimaryButton, Screen, ScreenTitle } from "../components/ui";
import { TAB_BAR_CLEARANCE } from "../components/GlassTabBar";

const PERIODS: { key: PaymentPeriod; labelKey: "paymentPeriodMonth" | "paymentPeriodQuarter" | "paymentPeriodYear"; multiplier: number }[] = [
  { key: "MONTH", labelKey: "paymentPeriodMonth", multiplier: 1 },
  { key: "QUARTER", labelKey: "paymentPeriodQuarter", multiplier: 3 },
  { key: "YEAR", labelKey: "paymentPeriodYear", multiplier: 12 },
];

function floorOf(room: string): string {
  const m = /^(\d)\d{2,3}$/.exec(room);
  return m ? m[1] : "—";
}

export default function PaymentScreen() {
  const { user } = useAuth();
  const { t } = useLang();
  const { tokens, accent, radii } = useTheme();
  const { showToast } = useToast();
  const [summary, setSummary] = useState<PaymentsSummary | null>(null);
  const [period, setPeriod] = useState<PaymentPeriod>("MONTH");
  const [method, setMethod] = useState<PaymentMethod>("SBP");
  const [customAmount, setCustomAmount] = useState("");
  const [paying, setPaying] = useState(false);

  const load = useCallback(() => {
    api.payments().then(setSummary);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!summary || !user) return null;

  const selected = PERIODS.find((p) => p.key === period)!;
  const defaultAmount = summary.monthlyRate * selected.multiplier;
  const amount = customAmount ? Number(customAmount) || 0 : defaultAmount;

  const pay = async () => {
    setPaying(true);
    try {
      const updated = await api.pay({ period, method, amount: customAmount ? amount : undefined });
      setSummary(updated);
      setCustomAmount("");
      showToast(`${t("paymentSuccess")} ✓`);
    } finally {
      setPaying(false);
    }
  };

  const balanceLabel = summary.balance < 0 ? t("paymentBalanceOwed") : summary.balance === 0 ? t("paymentPaid") : t("paymentBalanceCredit");
  const balanceColor = summary.balance < 0 ? "#E5484D" : "#22C55E";

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_CLEARANCE + 16, gap: 16 }}>
        <ScreenTitle>{t("payment")}</ScreenTitle>

        <Card style={{ gap: 4 }}>
          <MutedText>{t("balance")}</MutedText>
          <Text style={{ color: balanceColor, fontSize: 28, fontWeight: "800" }}>
            {Math.abs(summary.balance).toLocaleString("ru-RU")} ₽
          </Text>
          <MutedText>{balanceLabel}</MutedText>
        </Card>

        <Card style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <MutedText>Плательщик</MutedText>
            <Text style={{ color: tokens.tx }}>{user.fullName}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <MutedText>Лицевой счёт</MutedText>
            <Text style={{ color: tokens.tx, fontFamily: "monospace" }}>{user.login}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <MutedText>{t("dormNumber")}</MutedText>
            <Text style={{ color: tokens.tx }}>
              №{user.dormId}, {t("room")} {user.room} · этаж {floorOf(user.room)}
            </Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <MutedText>{t("contractNumber")}</MutedText>
            <Text style={{ color: tokens.tx, fontFamily: "monospace" }}>{user.login}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <MutedText>{t("phone")}</MutedText>
            <Text style={{ color: tokens.tx }} numberOfLines={1}>{user.phone || "—"}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <MutedText>{t("email")}</MutedText>
            <Text style={{ color: tokens.tx }} numberOfLines={1}>{user.email || "—"}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <MutedText>{t("monthlyRate")}</MutedText>
            <Text style={{ color: tokens.tx }}>{summary.monthlyRate.toLocaleString("ru-RU")} ₽/мес</Text>
          </View>
        </Card>

        <View style={{ gap: 8 }}>
          <MutedText>{t("payment")}</MutedText>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {PERIODS.map((p) => (
              <Pressable
                key={p.key}
                onPress={() => {
                  setPeriod(p.key);
                  setCustomAmount("");
                }}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: radii.md,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: period === p.key ? accent : tokens.sub,
                }}
              >
                <Text style={{ color: period === p.key ? "#fff" : tokens.tx, fontWeight: "700", fontSize: 13 }}>{t(p.labelKey)}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["SBP", "CARD"] as PaymentMethod[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMethod(m)}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: radii.md,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: method === m ? accent : tokens.bd,
                  backgroundColor: tokens.card,
                }}
              >
                <Text style={{ color: method === m ? accent : tokens.tx, fontWeight: "700", fontSize: 13 }}>
                  {t(m === "SBP" ? "paymentMethodSbp" : "paymentMethodCard")}
                </Text>
              </Pressable>
            ))}
          </View>
          <Input
            value={customAmount}
            onChangeText={setCustomAmount}
            placeholder={`${t("customAmount")} (${defaultAmount.toLocaleString("ru-RU")} ₽)`}
            keyboardType="phone-pad"
          />
        </View>

        <PrimaryButton label={`${t("payNow")} · ${(amount || defaultAmount).toLocaleString("ru-RU")} ₽`} onPress={pay} loading={paying} />

        {summary.history.length > 0 && (
          <View style={{ gap: 8 }}>
            <MutedText>{t("paymentHistory")}</MutedText>
            {summary.history.map((p) => (
              <Card key={p.id} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View>
                  <Text style={{ color: tokens.tx, fontWeight: "600" }}>{p.amount.toLocaleString("ru-RU")} ₽</Text>
                  <MutedText>{p.receiptNo}</MutedText>
                  <MutedText>
                    {t(p.method === "SBP" ? "paymentMethodSbp" : "paymentMethodCard")} ·{" "}
                    {t(p.period === "MONTH" ? "paymentPeriodMonth" : p.period === "QUARTER" ? "paymentPeriodQuarter" : "paymentPeriodYear")}
                  </MutedText>
                </View>
                <MutedText>{new Date(p.createdAt).toLocaleDateString("ru-RU")}</MutedText>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
