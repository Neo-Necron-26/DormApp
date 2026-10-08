import React, { useState } from "react";
import { ScrollView } from "react-native";
import { api } from "../../state/api";
import { useLang } from "../../state/LangContext";
import { useToast } from "../../state/ToastContext";
import { Input, MutedText, PrimaryButton, Screen, ScreenTitle, SegmentedControl } from "../../components/ui";
import { PhotoPicker } from "../../components/PhotoPicker";
import { Header } from "../../components/Header";
import { TAB_BAR_CLEARANCE } from "../../components/GlassTabBar";

type Audience = "all" | "floor" | "room";

export default function AdminBroadcastScreen() {
  const { t } = useLang();
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [target, setTarget] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    try {
      const audienceValue = audience === "all" ? "all" : `${audience}:${target}`;
      const res = await api.broadcast({ title, text, audience: audienceValue, photos: photos.length ? photos : undefined });
      setTitle("");
      setText("");
      setTarget("");
      setPhotos([]);
      showToast(`${t("deliveryReport")}: ${res.deliveredCount}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen>
      <Header title={t("broadcasts")} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_CLEARANCE + 16, gap: 12 }}>
        <ScreenTitle>{t("broadcasts")}</ScreenTitle>
        <SegmentedControl
          value={audience}
          onChange={setAudience}
          options={[
            { value: "all", label: t("broadcastAudienceAll") },
            { value: "floor", label: t("broadcastAudienceFloor") },
            { value: "room", label: t("broadcastAudienceRoom") },
          ]}
        />
        {audience !== "all" && (
          <Input
            value={target}
            onChangeText={setTarget}
            placeholder={audience === "floor" ? t("broadcastAudienceFloor") : t("broadcastAudienceRoom")}
          />
        )}
        <Input value={title} onChangeText={setTitle} placeholder={t("broadcastTitle")} />
        <Input value={text} onChangeText={setText} placeholder={t("broadcastText")} />
        <PhotoPicker value={photos} onChange={setPhotos} />
        <PrimaryButton
          label={t("broadcastSend")}
          onPress={send}
          loading={sending}
          disabled={!title || !text || (audience !== "all" && !target)}
        />
      </ScrollView>
    </Screen>
  );
}
