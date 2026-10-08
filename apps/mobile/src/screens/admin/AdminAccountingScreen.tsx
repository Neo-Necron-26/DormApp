import React, { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { InvoiceRequest, InvoiceStatus } from "@sfu/shared";
import { api } from "../../state/api";
import { useTheme } from "../../state/ThemeContext";
import { useLang } from "../../state/LangContext";
import { useToast } from "../../state/ToastContext";
import { Badge, BadgeTone, BottomSheet, Card, Input, MutedText, PrimaryButton, Screen } from "../../components/ui";
import { Header } from "../../components/Header";
import { TAB_BAR_CLEARANCE } from "../../components/GlassTabBar";

const INVOICE_NEXT: Record<InvoiceStatus, InvoiceStatus | null> = { REQUESTED: "READY", READY: "PAID", PAID: null };
const INVOICE_TONE: Record<InvoiceStatus, BadgeTone> = { REQUESTED: "warning", READY: "accent", PAID: "success" };
const INVOICE_KEY: Record<InvoiceStatus, "invoiceStatusRequested" | "invoiceStatusReady" | "invoiceStatusPaid"> = {
  REQUESTED: "invoiceStatusRequested",
  READY: "invoiceStatusReady",
  PAID: "invoiceStatusPaid",
};

export default function AdminAccountingScreen() {
  const { tokens } = useTheme();
  const { t } = useLang();
  const { showToast } = useToast();
  const [requests, setRequests] = useState<InvoiceRequest[]>([]);
  const [settingAmountFor, setSettingAmountFor] = useState<InvoiceRequest | null>(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    api.invoices().then(setRequests);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const advance = async (r: InvoiceRequest) => {
    const next = INVOICE_NEXT[r.status];
    if (!next) return;
    if (next === "READY") {
      setAmount("");
      setSettingAmountFor(r);
      return;
    }
    await api.updateInvoiceRequest(r.id, { status: next });
    load();
  };

  const confirmReady = async () => {
    if (!settingAmountFor) return;
    const parsed = Number(amount.replace(/[^\d]/g, ""));
    if (!parsed || parsed <= 0) return;
    setSubmitting(true);
    try {
      await api.updateInvoiceRequest(settingAmountFor.id, { status: "READY", amount: parsed });
      setSettingAmountFor(null);
      showToast(t("markReady"));
      load();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Header title={t("departmentAccounting")} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_CLEARANCE + 16, gap: 10 }}>
        {requests.length === 0 && <MutedText>{t("noInvoices")}</MutedText>}
        {requests.map((r) => {
          const next = INVOICE_NEXT[r.status];
          return (
            <Pressable key={r.id} onPress={() => advance(r)} disabled={!next}>
              <Card style={{ gap: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <Text style={{ color: tokens.tx, fontWeight: "700", flex: 1 }} numberOfLines={1}>
                    {r.purpose}
                  </Text>
                  <View style={{ flexShrink: 0 }}>
                    <Badge label={t(INVOICE_KEY[r.status])} tone={INVOICE_TONE[r.status]} />
                  </View>
                </View>
                {r.amount != null && <MutedText>{t("invoiceAmountLabel")}: {r.amount.toLocaleString("ru-RU")} ₽</MutedText>}
                <MutedText>
                  {r.resident.fullName} · {t("room")} {r.resident.room}
                </MutedText>
                <MutedText>{new Date(r.createdAt).toLocaleString("ru-RU")}</MutedText>
                {next && <MutedText style={{ fontStyle: "italic" }}>→ {t(INVOICE_KEY[next])}</MutedText>}
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>

      <BottomSheet visible={!!settingAmountFor} onClose={() => setSettingAmountFor(null)}>
        <Text style={{ color: tokens.tx, fontSize: 18, fontWeight: "700" }}>{t("setAmountTitle")}</Text>
        <MutedText>{settingAmountFor?.purpose}</MutedText>
        <Input value={amount} onChangeText={setAmount} placeholder={t("invoiceAmountPlaceholder")} />
        <PrimaryButton label={t("markReady")} onPress={confirmReady} loading={submitting} disabled={!amount} />
      </BottomSheet>
    </Screen>
  );
}
