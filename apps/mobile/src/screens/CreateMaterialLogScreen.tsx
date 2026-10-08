import React, { useState } from "react";
import { ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { api } from "../state/api";
import { useLang } from "../state/LangContext";
import { Header } from "../components/Header";
import { Input, PrimaryButton, Screen } from "../components/ui";
import { PhotoPicker } from "../components/PhotoPicker";

export default function CreateMaterialLogScreen() {
  const { t } = useLang();
  const navigation = useNavigation<any>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = title.trim().length > 0;

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.createMaterialLog({ title, description, photos });
      navigation.goBack();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Header title="Новая заявка на пронос" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Input value={title} onChangeText={setTitle} placeholder="Название (например, Холодильник)" />
        <Input value={description} onChangeText={setDescription} placeholder="Дополнительное описание (опционально)" />
        <PhotoPicker value={photos} onChange={setPhotos} />
        <PrimaryButton label="Отправить" onPress={submit} loading={submitting} disabled={!canSubmit} />
      </ScrollView>
    </Screen>
  );
}
