import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LeadershipReport } from "@sfu/shared";
import { api } from "../../state/api";
import { useTheme } from "../../state/ThemeContext";
import { useLang } from "../../state/LangContext";
import { useToast } from "../../state/ToastContext";
import { Badge, Card, Icon, Input, MutedText, PrimaryButton, Screen, ScreenTitle, SecondaryButton, SegmentedControl } from "../../components/ui";
import { Header } from "../../components/Header";
import { TAB_BAR_CLEARANCE } from "../../components/GlassTabBar";

type Tab = "report" | "note";

export default function AdminLeadershipScreen() {
  const { tokens } = useTheme();
  const { t } = useLang();
  const { showToast } = useToast();
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<Tab>("report");
  const [startingChat, setStartingChat] = useState(false);

  const [reportTitle, setReportTitle] = useState("");
  const [reportText, setReportText] = useState("");
  const [sendingReport, setSendingReport] = useState(false);
  const [myReports, setMyReports] = useState<LeadershipReport[]>([]);

  const [room, setRoom] = useState("");
  const [residentName, setResidentName] = useState("");
  const [reason, setReason] = useState("");
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    api.leadershipReportsMine().then(setMyReports);
  }, []);

  const sendReport = async () => {
    setSendingReport(true);
    try {
      await api.createLeadershipReport({ title: reportTitle, text: reportText });
      setReportTitle("");
      setReportText("");
      showToast(t("reportSent"));
      api.leadershipReportsMine().then(setMyReports);
    } finally {
      setSendingReport(false);
    }
  };

  const openLeadershipChat = async () => {
    setStartingChat(true);
    try {
      const contacts = await api.leadershipContacts();
      if (contacts.length === 0) return;
      const channel = await api.startDM(contacts[0].id);
      navigation.navigate("ChatThread", { channelId: channel.id, title: contacts[0].fullName, canPost: true });
    } finally {
      setStartingChat(false);
    }
  };

  const saveNote = async () => {
    setSavingNote(true);
    try {
      await api.createExplanatoryNote({ room, residentName, reason, text: noteText });
      setRoom("");
      setResidentName("");
      setReason("");
      setNoteText("");
      showToast(t("noteSaved"));
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <Screen>
      <Header title={t("leadership")} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_CLEARANCE + 16, gap: 14 }}>
        <SecondaryButton icon="message-circle" label={t("chatWithLeadership")} onPress={openLeadershipChat} loading={startingChat} />

        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: "report", label: t("writeToLeadershipShort") },
            { value: "note", label: t("addExplanatoryNoteShort") },
          ]}
        />

        {tab === "report" ? (
          <>
            <Input value={reportTitle} onChangeText={setReportTitle} placeholder={t("reportTitlePlaceholder")} />
            <Input value={reportText} onChangeText={setReportText} placeholder={t("reportTextPlaceholder")} />
            <PrimaryButton label={t("sendReport")} onPress={sendReport} loading={sendingReport} disabled={!reportTitle || !reportText} />

            <ScreenTitle>{t("myReports")}</ScreenTitle>
            {myReports.length === 0 && <MutedText>{t("noReports")}</MutedText>}
            {myReports.map((r) => (
              <Card key={r.id} style={{ gap: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <Text style={{ color: tokens.tx, fontWeight: "700", flex: 1 }} numberOfLines={1}>
                    {r.title}
                  </Text>
                  <View style={{ flexShrink: 0 }}>
                    <Badge label={t(r.read ? "markRead" : "unread")} tone={r.read ? "success" : "warning"} />
                  </View>
                </View>
                <MutedText>{r.text}</MutedText>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Input value={residentName} onChangeText={setResidentName} placeholder={t("residentNamePlaceholder")} />
            <Input value={room} onChangeText={setRoom} placeholder={t("room")} />
            <Input value={reason} onChangeText={setReason} placeholder={t("reasonPlaceholder")} />
            <Input value={noteText} onChangeText={setNoteText} placeholder={t("notePlaceholder")} />
            <PrimaryButton
              label={t("addExplanatoryNote")}
              onPress={saveNote}
              loading={savingNote}
              disabled={!residentName || !room || !reason || !noteText}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
