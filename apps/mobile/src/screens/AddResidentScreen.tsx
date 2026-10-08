import React, { useState } from "react";
import { ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { api } from "../state/api";
import { useLang } from "../state/LangContext";
import { useToast } from "../state/ToastContext";
import { Input, PrimaryButton, Screen, ScreenTitle } from "../components/ui";

export default function AddResidentScreen() {
  const { t } = useLang();
  const { showToast } = useToast();
  const navigation = useNavigation<any>();
  const [fullName, setFullName] = useState("");
  const [login, setLogin] = useState("");
  const [room, setRoom] = useState("");
  const [section, setSection] = useState("");
  const [password, setPassword] = useState("sfu2026");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const result = await api.adminCreateResident({ login, fullName, room, section: section || undefined, password });
      navigation.goBack();
      if (result.replaced) showToast(t("duplicateLoginReplaced"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <ScreenTitle>{t("addResident")}</ScreenTitle>
        <Input value={fullName} onChangeText={setFullName} placeholder={t("fullName")} autoCapitalize="words" />
        <Input value={login} onChangeText={setLogin} placeholder={t("login")} />
        <Input value={room} onChangeText={setRoom} placeholder={t("room")} />
        <Input value={section} onChangeText={setSection} placeholder={t("section")} />
        <Input value={password} onChangeText={setPassword} placeholder={t("password")} />
        <PrimaryButton label={t("addResident")} onPress={submit} loading={submitting} disabled={!fullName || !login || !room} />
      </ScrollView>
    </Screen>
  );
}
