import React, { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { Appeal, AppealStatus } from "@sfu/shared";
import { api } from "../state/api";
import { useLang } from "../state/LangContext";
import { useTheme } from "../state/ThemeContext";
import { useToast } from "../state/ToastContext";
import { Badge, BottomSheet, Card, Icon, Input, MutedText, PrimaryButton, Screen, ScreenTitle, SecondaryButton } from "../components/ui";
import { TAB_BAR_CLEARANCE } from "../components/GlassTabBar";
import { PhotoPicker } from "../components/PhotoPicker";
import { useRoute, RouteProp } from "@react-navigation/native";
import { Image } from "react-native";
import { API_BASE_URL } from "../state/api";

const STATUS_TONE: Record<AppealStatus, "warning" | "accent" | "success"> = {
  PENDING: "warning",
  IN_REVIEW: "accent",
  RESOLVED: "success",
};

const TOPICS: { key: string; labelKey: "appealTopicNoise" | "appealTopicConflict" | "appealTopicConditions" | "appealTopicRelocation" | "appealTopicCertificate" | "appealTopicMaterial" | "appealTopicOther" }[] = [
  { key: "Шумные соседи", labelKey: "appealTopicNoise" },
  { key: "Конфликт", labelKey: "appealTopicConflict" },
  { key: "Условия проживания", labelKey: "appealTopicConditions" },
  { key: "Переселение", labelKey: "appealTopicRelocation" },
  { key: "Справка", labelKey: "appealTopicCertificate" },
  { key: "Материальный пропуск", labelKey: "appealTopicMaterial" },
  { key: "Другое", labelKey: "appealTopicOther" },
];

const STATUS_LABEL_KEY: Record<AppealStatus, "appealStatusPending" | "appealStatusInReview" | "appealStatusResolved"> = {
  PENDING: "appealStatusPending",
  IN_REVIEW: "appealStatusInReview",
  RESOLVED: "appealStatusResolved",
};

export default function AppealsScreen() {
  const { t } = useLang();
  const { tokens, accent, radii } = useTheme();
  const { showToast } = useToast();
  const route = useRoute<RouteProp<{ params: { topic?: string } }, "params">>();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [creating, setCreating] = useState(false);
  const [topic, setTopic] = useState(route.params?.topic || TOPICS[0].key);
  const [text, setText] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (route.params?.topic) {
      setTopic(route.params.topic);
      setCreating(true);
    }
  }, [route.params?.topic]);

  const load = useCallback(() => {
    api.appeals().then(setAppeals);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.createAppeal({ topic, text, anonymous, photos });
      setText("");
      setAnonymous(false);
      setPhotos([]);
      setCreating(false);
      showToast(t("submit") + " ✓");
      load();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_CLEARANCE + 16, gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <ScreenTitle>{t("myAppeals")}</ScreenTitle>
          <SecondaryButton label={t("newAppeal")} onPress={() => setCreating(true)} />
        </View>

        {(appeals || []).length === 0 && <MutedText>{t("noNotifications")}</MutedText>}
        {(appeals || []).map((appeal) => (
          <Card key={appeal.id} style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: tokens.tx, fontWeight: "700" }}>{appeal.topic}</Text>
              <Badge label={t(STATUS_LABEL_KEY[appeal.status])} tone={STATUS_TONE[appeal.status]} />
            </View>
            <MutedText style={{ fontFamily: "monospace", fontSize: 11 }}>
              № {appeal.id.slice(-6).toUpperCase()} · {new Date(appeal.createdAt).toLocaleDateString("ru-RU")}
            </MutedText>
            <MutedText>{appeal.text}</MutedText>
            {appeal.photos && (appeal.photos || []).length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {(appeal.photos || []).map((p, i) => (
                  <Image key={i} source={{ uri: `${API_BASE_URL}${p}` }} style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: tokens.sub }} />
                ))}
              </ScrollView>
            )}
            {appeal.response && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Icon name="message-square" size={12} color={tokens.mu} />
                <MutedText style={{ fontStyle: "italic" }}>{appeal.response}</MutedText>
              </View>
            )}
          </Card>
        ))}
      </ScrollView>

      <BottomSheet visible={creating} onClose={() => setCreating(false)}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: tokens.tx, fontSize: 18, fontWeight: "700" }}>{t("newAppeal")}</Text>
          <Pressable
            onPress={() => setCreating(false)}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: tokens.sub, alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="x" size={16} color={tokens.mu} />
          </Pressable>
        </View>
        <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 10 }}>
          <MutedText>{t("appealTopic")}</MutedText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {TOPICS.map((topicOption) => (
              <Pressable
                key={topicOption.key}
                onPress={() => setTopic(topicOption.key)}
                style={{
                  paddingHorizontal: 12,
                  height: 34,
                  borderRadius: radii.pill,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: topic === topicOption.key ? accent : tokens.sub,
                }}
              >
                <Text style={{ color: topic === topicOption.key ? "#fff" : tokens.tx, fontSize: 12, fontWeight: "700" }}>
                  {t(topicOption.labelKey)}
                </Text>
              </Pressable>
            ))}
          </View>
          <Input value={text} onChangeText={setText} placeholder={t("appealText")} />
          <PhotoPicker value={photos} onChange={setPhotos} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <MutedText>{t("appealAnonymous")}</MutedText>
            <Switch value={anonymous} onValueChange={setAnonymous} />
          </View>
          <MutedText style={{ fontSize: 11 }}>{t("appealRoute")}</MutedText>
        </ScrollView>
        <PrimaryButton label={t("submit")} onPress={submit} loading={submitting} disabled={!text} />
      </BottomSheet>
    </Screen>
  );
}
