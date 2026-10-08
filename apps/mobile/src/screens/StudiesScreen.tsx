import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  allowedDocumentTypes,
  CertificateRequest,
  DocumentCategory,
  FundingType,
  GradeRecord,
  InvoiceRequest,
  INVOICE_PURPOSES,
  ScheduleEntry,
  SealType,
  WeekParity,
} from "@sfu/shared";
import { api } from "../state/api";
import { useAuth } from "../state/AuthContext";
import { useLang } from "../state/LangContext";
import { useTheme } from "../state/ThemeContext";
import { useToast } from "../state/ToastContext";
import {
  Badge,
  BadgeTone,
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

type Tab = "schedule" | "grades" | "certificates" | "account";
type Department = "institute" | "accounting";
const DAY_KEYS = ["dayMon", "dayTue", "dayWed", "dayThu", "dayFri", "daySat"] as const;
const DOC_CATEGORY_ORDER: DocumentCategory[] = ["CERTIFICATE", "CONTRACT", "FOREIGN"];

const CERT_TONE: Record<string, BadgeTone> = { NEW: "warning", READY: "accent", ISSUED: "success" };
const CERT_LABEL_KEY: Record<string, "certificateStatusNew" | "certificateStatusReady" | "certificateStatusIssued"> = {
  NEW: "certificateStatusNew",
  READY: "certificateStatusReady",
  ISSUED: "certificateStatusIssued",
};

const INVOICE_TONE: Record<string, BadgeTone> = { REQUESTED: "warning", READY: "accent", PAID: "success" };
const INVOICE_LABEL_KEY: Record<string, "invoiceStatusRequested" | "invoiceStatusReady" | "invoiceStatusPaid"> = {
  REQUESTED: "invoiceStatusRequested",
  READY: "invoiceStatusReady",
  PAID: "invoiceStatusPaid",
};

const CATEGORY_LABEL_KEY: Record<DocumentCategory, "documentCategoryCertificates" | "documentCategoryContracts" | "documentCategoryForeign"> = {
  CERTIFICATE: "documentCategoryCertificates",
  CONTRACT: "documentCategoryContracts",
  FOREIGN: "documentCategoryForeign",
};

function ScheduleTab() {
  const { t } = useLang();
  const { tokens, accent, radii } = useTheme();
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [currentParity, setCurrentParity] = useState<WeekParity>("ODD");
  const [parity, setParity] = useState<"ODD" | "EVEN">("ODD");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .schedule()
      .then((res) => {
        setEntries(res.entries);
        const p = (res.currentParity === "ALL" ? "ODD" : res.currentParity) as "ODD" | "EVEN";
        setCurrentParity(res.currentParity);
        setParity(p);
      })
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const byDay: Record<number, ScheduleEntry[]> = {};
    entries
      .filter((e) => e.weekParity === "ALL" || e.weekParity === parity)
      .forEach((e) => {
        (byDay[e.dayOfWeek] ||= []).push(e);
      });
    return byDay;
  }, [entries, parity]);

  const todayDow = new Date().getDay(); // 0=Sun..6=Sat

  if (loading) return null;

  return (
    <View style={{ gap: 14 }}>
      <SegmentedControl
        value={parity}
        onChange={setParity}
        options={[
          { value: "ODD", label: t("weekOdd") },
          { value: "EVEN", label: t("weekEven") },
        ]}
      />
      {entries.length === 0 ? (
        <MutedText>{t("noScheduleForGroup")}</MutedText>
      ) : (
        DAY_KEYS.map((dayKey, i) => {
          const dow = i + 1;
          const dayEntries = (grouped[dow] || []).slice().sort((a, b) => (a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0));
          if (dayEntries.length === 0) return null;
          const isToday = dow === todayDow && parity === currentParity;
          return (
            <View key={dayKey} style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 14 }}>{t(dayKey)}</Text>
                {isToday && <Badge label={t("todayLabel")} tone="accent" />}
              </View>
              {dayEntries.map((e) => (
                <Card key={e.id} style={{ flexDirection: "row", gap: 12, borderLeftWidth: 4, borderLeftColor: accent, paddingLeft: 12 }}>
                  <View style={{ width: 56, alignItems: "center", justifyContent: "center", backgroundColor: tokens.ph1, borderRadius: 8, paddingVertical: 8 }}>
                    <Text style={{ color: accent, fontWeight: "800", fontSize: 14 }}>{e.startTime}</Text>
                    <MutedText style={{ fontSize: 10, fontWeight: "600" }}>{e.endTime}</MutedText>
                  </View>
                  <View style={{ flex: 1, gap: 4, justifyContent: "center" }}>
                    <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 15 }}>{e.subject}</Text>
                    <MutedText style={{ fontSize: 13 }}>
                      {e.type}
                      {e.room ? ` · ${e.room}` : ""}
                      {e.teacher ? ` · ${e.teacher}` : ""}
                    </MutedText>
                  </View>
                </Card>
              ))}
            </View>
          );
        })
      )}
    </View>
  );
}

function GradesTab() {
  const { t } = useLang();
  const { tokens } = useTheme();
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.grades().then(setGrades).finally(() => setLoading(false));
  }, []);

  const bySemester = useMemo(() => {
    const map = new Map<string, GradeRecord[]>();
    grades.forEach((g) => {
      if (!map.has(g.semesterLabel)) map.set(g.semesterLabel, []);
      map.get(g.semesterLabel)!.push(g);
    });
    return Array.from(map.entries());
  }, [grades]);

  if (loading) return null;
  if (grades.length === 0) return <MutedText>{t("noGrades")}</MutedText>;

  return (
    <View style={{ gap: 16 }}>
      {bySemester.map(([semester, rows]) => (
        <View key={semester} style={{ gap: 8 }}>
          <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 14 }}>{semester}</Text>
          <Card style={{ gap: 8 }}>
            {rows.map((g, idx) => (
              <View key={g.id}>
                {idx > 0 && <View style={{ height: 1, backgroundColor: tokens.bd, marginVertical: 8 }} />}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: tokens.ph1, alignItems: "center", justifyContent: "center" }}>
                      <Icon name="book" size={16} color={tokens.tx} />
                    </View>
                    <Text style={{ color: tokens.tx, fontSize: 14, fontWeight: "500", flex: 1 }}>{g.subject}</Text>
                  </View>
                  <View style={{ backgroundColor: /^(Отл|Хор|Зачет|Зачёт)/i.test(g.grade) ? "rgba(34, 197, 94, 0.15)" : /Неуд/i.test(g.grade) ? "rgba(220, 38, 38, 0.15)" : tokens.ph1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                    <Text
                      style={{
                        color: /^(Отл|Хор|Зачет|Зачёт)/i.test(g.grade) ? "#22C55E" : /Неуд/i.test(g.grade) ? "#DC2626" : tokens.mu,
                        fontWeight: "800",
                        fontSize: 13,
                      }}
                    >
                      {g.grade}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </Card>
        </View>
      ))}
    </View>
  );
}

function InstituteTab() {
  const { t } = useLang();
  const { user } = useAuth();
  const { tokens } = useTheme();
  const { showToast } = useToast();
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [requesting, setRequesting] = useState(false);
  const [type, setType] = useState<string | null>(null);
  const [sealType, setSealType] = useState<SealType | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const allowedTypes = useMemo(() => allowedDocumentTypes((user?.fundingType ?? "BUDGET") as FundingType), [user?.fundingType]);
  const byCategory = useMemo(() => {
    const map = new Map<DocumentCategory, typeof allowedTypes>();
    DOC_CATEGORY_ORDER.forEach((c) => map.set(c, allowedTypes.filter((d) => d.category === c)));
    return map;
  }, [allowedTypes]);
  const selectedDoc = allowedTypes.find((d) => d.label === type) ?? null;

  const load = useCallback(() => {
    api.certificates().then(setRequests);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!type || (selectedDoc?.requiresSeal && !sealType)) return;
    setSubmitting(true);
    try {
      await api.createCertificateRequest({ type, comment: comment || undefined, sealType: sealType ?? undefined });
      setType(null);
      setSealType(null);
      setComment("");
      setRequesting(false);
      showToast(t("certificateRequested"));
      load();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 14 }}>{t("myCertificates")}</Text>
        <SecondaryButton icon="plus" label={t("requestCertificate")} onPress={() => setRequesting(true)} />
      </View>
      {requests.length === 0 && <MutedText>{t("noCertificates")}</MutedText>}
      {requests.map((r) => (
        <Card key={r.id} style={{ gap: 4 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <Icon name="file-text" size={20} color={tokens.mu} />
              <Text style={{ color: tokens.tx, fontWeight: "700", flex: 1, fontSize: 15 }} numberOfLines={1}>
                {r.type}
              </Text>
            </View>
            <View style={{ flexShrink: 0 }}>
              <Badge label={t(CERT_LABEL_KEY[r.status])} tone={CERT_TONE[r.status]} />
            </View>
          </View>
          {r.sealType && <MutedText>{t("sealTypeLabel")}: {t(r.sealType === "OFFICIAL" ? "sealTypeOfficial" : "sealTypeInstitute")}</MutedText>}
          <MutedText>{new Date(r.createdAt).toLocaleDateString("ru-RU")}</MutedText>
        </Card>
      ))}

      <BottomSheet visible={requesting} onClose={() => setRequesting(false)}>
        <Text style={{ color: tokens.tx, fontSize: 18, fontWeight: "700" }}>{t("requestCertificate")}</Text>
        <MutedText>{t("certificateTypeLabel")}</MutedText>
        <View style={{ gap: 12 }}>
          {DOC_CATEGORY_ORDER.map((cat) => {
            const docs = byCategory.get(cat) ?? [];
            if (docs.length === 0) return null;
            return (
              <View key={cat} style={{ gap: 6 }}>
                <MutedText style={{ fontWeight: "700" }}>{t(CATEGORY_LABEL_KEY[cat])}</MutedText>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {docs.map((d) => (
                    <Chip
                      key={d.key}
                      label={d.label}
                      active={type === d.label}
                      onPress={() => {
                        setType(d.label);
                        setSealType(null);
                      }}
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
        {selectedDoc?.requiresSeal && (
          <View style={{ gap: 6 }}>
            <MutedText>{t("sealTypeLabel")}</MutedText>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <Chip label={t("sealTypeOfficial")} active={sealType === "OFFICIAL"} onPress={() => setSealType("OFFICIAL")} />
              <Chip label={t("sealTypeInstitute")} active={sealType === "INSTITUTE"} onPress={() => setSealType("INSTITUTE")} />
            </View>
          </View>
        )}
        <Input value={comment} onChangeText={setComment} placeholder={t("certificateCommentPlaceholder")} />
        <MutedText style={{ fontSize: 11 }}>{t("instituteRoutingNote")}</MutedText>
        <PrimaryButton
          label={t("requestCertificate")}
          onPress={submit}
          loading={submitting}
          disabled={!type || (!!selectedDoc?.requiresSeal && !sealType)}
        />
      </BottomSheet>
    </View>
  );
}

function AccountingTab() {
  const { t } = useLang();
  const { tokens, accent } = useTheme();
  const { showToast } = useToast();
  const navigation = useNavigation<any>();
  const [requests, setRequests] = useState<InvoiceRequest[]>([]);
  const [requesting, setRequesting] = useState(false);
  const [purpose, setPurpose] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    api.invoices().then(setRequests);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!purpose) return;
    setSubmitting(true);
    try {
      await api.createInvoiceRequest({ purpose, comment: comment || undefined });
      setPurpose(null);
      setComment("");
      setRequesting(false);
      showToast(t("invoiceRequested"));
      load();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 14 }}>{t("myInvoices")}</Text>
        <SecondaryButton icon="plus" label={t("requestInvoice")} onPress={() => setRequesting(true)} />
      </View>
      {requests.length === 0 && <MutedText>{t("noInvoices")}</MutedText>}
      {requests.map((r) => (
        <Card key={r.id} style={{ gap: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <Icon name="file-text" size={20} color={tokens.mu} />
              <Text style={{ color: tokens.tx, fontWeight: "700", flex: 1, fontSize: 15 }} numberOfLines={1}>
                {r.purpose}
              </Text>
            </View>
            <View style={{ flexShrink: 0 }}>
              <Badge label={t(INVOICE_LABEL_KEY[r.status])} tone={INVOICE_TONE[r.status]} />
            </View>
          </View>
          <MutedText>{new Date(r.createdAt).toLocaleDateString("ru-RU")}</MutedText>
          {r.amount != null && (
            <Text style={{ color: tokens.tx, fontWeight: "800", fontSize: 16 }}>{r.amount.toLocaleString("ru-RU")} ₽</Text>
          )}
          {r.status !== "REQUESTED" && (
            <View style={{ gap: 6, borderTopWidth: 1, borderTopColor: tokens.bd, paddingTop: 8, marginTop: 2 }}>
              <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 12 }}>{t("invoiceRequisitesTitle")}</Text>
              <MutedText style={{ fontSize: 11 }}>{t("invoiceRequisites")}</MutedText>
              <Pressable onPress={() => navigation.navigate("Tabs", { screen: "Services", params: { screen: "Payment" } })}>
                <Text style={{ color: accent, fontWeight: "700", fontSize: 13 }}>{t("goToPayment")}</Text>
              </Pressable>
            </View>
          )}
        </Card>
      ))}

      <BottomSheet visible={requesting} onClose={() => setRequesting(false)}>
        <Text style={{ color: tokens.tx, fontSize: 18, fontWeight: "700" }}>{t("requestInvoice")}</Text>
        <MutedText>{t("invoicePurposeLabel")}</MutedText>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {INVOICE_PURPOSES.map((p) => (
            <Chip key={p} label={p} active={purpose === p} onPress={() => setPurpose(p)} />
          ))}
        </View>
        <Input value={comment} onChangeText={setComment} placeholder={t("invoiceCommentPlaceholder")} />
        <PrimaryButton label={t("requestInvoice")} onPress={submit} loading={submitting} disabled={!purpose} />
      </BottomSheet>
    </View>
  );
}

function CertificatesTab() {
  const { t } = useLang();
  const [department, setDepartment] = useState<Department>("institute");

  return (
    <View style={{ gap: 14 }}>
      <SegmentedControl
        value={department}
        onChange={setDepartment}
        options={[
          { value: "institute", label: t("departmentInstitute") },
          { value: "accounting", label: t("departmentAccounting") },
        ]}
      />
      {department === "institute" ? <InstituteTab /> : <AccountingTab />}
    </View>
  );
}

function AccountHelpTab() {
  const { t } = useLang();
  const { user } = useAuth();
  const { tokens, accent } = useTheme();
  const { showToast } = useToast();

  return (
    <View style={{ gap: 12 }}>
      <Card style={{ gap: 8 }}>
        <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 15 }}>{t("accountHelp")}</Text>
        <MutedText>{t("accountHelpIntro")}</MutedText>
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 15 }}>{t("programLabel")}</Text>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Icon name="briefcase" size={16} color={tokens.mu} />
            <MutedText style={{ flex: 1 }}>{t("instituteLabel")}: <Text style={{ color: tokens.tx, fontWeight: "600" }}>{user?.institute || "—"}</Text></MutedText>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Icon name="users" size={16} color={tokens.mu} />
            <MutedText style={{ flex: 1 }}>{t("studyGroupLabel")}: <Text style={{ color: tokens.tx, fontWeight: "600" }}>{user?.studyGroup || "—"}</Text></MutedText>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Icon name="check-circle" size={16} color={tokens.mu} />
            <MutedText style={{ flex: 1 }}>{t("studyStatusLabel")}: <Text style={{ color: tokens.tx, fontWeight: "600" }}>{user?.studyStatus || "—"}</Text></MutedText>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Icon name="award" size={16} color={tokens.mu} />
            <MutedText style={{ flex: 1 }}>{t("programLevelLabel")}: <Text style={{ color: tokens.tx, fontWeight: "600" }}>{user?.programLevel || "—"}</Text></MutedText>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Icon name="book-open" size={16} color={tokens.mu} />
            <MutedText style={{ flex: 1 }}>{t("studyFormLabel")}: <Text style={{ color: tokens.tx, fontWeight: "600" }}>{user?.studyForm || "—"}</Text></MutedText>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Icon name="dollar-sign" size={16} color={tokens.mu} />
            <MutedText style={{ flex: 1 }}>{t("fundingTypeLabel")}: <Text style={{ color: tokens.tx, fontWeight: "600" }}>{user?.fundingType === "PAID" ? t("fundingTypePaid") : t("fundingTypeBudget")}</Text></MutedText>
          </View>
        </View>
      </Card>

      <Pressable onPress={() => showToast(t("findLogin"))}>
        <Card style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: tokens.tx, fontWeight: "600" }}>{t("findLogin")}</Text>
          <Icon name="chevron-right" size={16} color={tokens.mu} />
        </Card>
      </Pressable>
      <Pressable onPress={() => showToast(t("resetPassword"))}>
        <Card style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: tokens.tx, fontWeight: "600" }}>{t("resetPassword")}</Text>
          <Icon name="chevron-right" size={16} color={tokens.mu} />
        </Card>
      </Pressable>
      <Pressable onPress={() => showToast(t("wifiVpnHelp"))}>
        <Card style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: tokens.tx, fontWeight: "600" }}>{t("wifiVpnHelp")}</Text>
          <Icon name="chevron-right" size={16} color={tokens.mu} />
        </Card>
      </Pressable>

      <Card style={{ gap: 6 }}>
        <Text style={{ color: tokens.tx, fontWeight: "700" }}>{t("supportContactTitle")}</Text>
        <MutedText>{t("supportContactHours")}</MutedText>
        <Pressable onPress={() => Linking.openURL("tel:+73912062424")}>
          <Text style={{ color: accent, fontWeight: "700" }}>+7 (391) 206-24-24</Text>
        </Pressable>
        <MutedText>it-help@sfu-kras.ru</MutedText>
      </Card>
    </View>
  );
}

export default function StudiesScreen() {
  const { t } = useLang();
  const route = useRoute<any>();
  const [tab, setTab] = useState<Tab>((route.params?.initialTab as Tab) ?? "schedule");

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <ScreenTitle>{t("studies")}</ScreenTitle>
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: "schedule", label: t("schedule") },
            { value: "grades", label: t("gradebook") },
            { value: "certificates", label: t("certificates") },
            { value: "account", label: t("accountHelp") },
          ]}
        />
        {tab === "schedule" && <ScheduleTab />}
        {tab === "grades" && <GradesTab />}
        {tab === "certificates" && <CertificatesTab />}
        {tab === "account" && <AccountHelpTab />}
      </ScrollView>
    </Screen>
  );
}
