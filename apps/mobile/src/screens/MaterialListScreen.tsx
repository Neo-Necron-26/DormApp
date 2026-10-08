import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialLog } from "@sfu/shared";
import { api } from "../state/api";
import { useLang } from "../state/LangContext";
import { useTheme } from "../state/ThemeContext";
import { Header } from "../components/Header";
import { Badge, Card, Icon, MutedText, Screen } from "../components/ui";
import { photoUrl } from "../components/PhotoPicker";
import { TAB_BAR_CLEARANCE } from "../components/GlassTabBar";

export default function MaterialListScreen() {
  const { t } = useLang();
  const { tokens, accent, radii } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState<MaterialLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (api.materialLogs) {
        const data = await api.materialLogs();
        setLogs(data);
      } else {
        console.warn("api.materialLogs is undefined - please restart Expo with -c to clear cache");
      }
    } catch (e) {
      console.warn("Failed to load material logs", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  const renderStatus = (status: MaterialLog["status"]) => {
    switch (status) {
      case "PENDING":
        return <Badge label="На рассмотрении" tone="warning" />;
      case "APPROVED":
        return <Badge label="Одобрено" tone="success" />;
      case "REJECTED":
        return <Badge label="Отклонено" tone="warning" />;
      default:
        return null;
    }
  };

  return (
    <Screen>
      <Header title="Материальный пропуск" />
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_CLEARANCE + 16, gap: 12 }}
        ListEmptyComponent={
          !loading ? (
            <MutedText style={{ textAlign: "center", marginTop: 40 }}>Нет добавленных вещей</MutedText>
          ) : undefined
        }
        renderItem={({ item }) => (
          <Card style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 16 }}>{item.title}</Text>
              {renderStatus(item.status)}
            </View>
            <MutedText>{new Date(item.createdAt).toLocaleDateString("ru-RU")}</MutedText>
            {!!item.description && <Text style={{ color: tokens.tx, fontSize: 14 }}>{item.description}</Text>}
            {item.photos.length > 0 && (
              <Image
                source={{ uri: photoUrl(item.photos[0]) }}
                style={{ width: "100%", height: 160, borderRadius: radii.md, marginTop: 4 }}
                resizeMode="cover"
              />
            )}
          </Card>
        )}
      />
      <Pressable
        onPress={() => navigation.navigate("CreateMaterialLog")}
        style={{
          position: "absolute",
          right: 20,
          bottom: insets.bottom + TAB_BAR_CLEARANCE,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: accent,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}
      >
        <Icon name="plus" size={26} color="#fff" />
      </Pressable>
    </Screen>
  );
}
