import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChatMessage, DormEvent } from "@sfu/shared";
import { api } from "../state/api";
import { useAuth } from "../state/AuthContext";
import { useLang } from "../state/LangContext";
import { useTheme } from "../state/ThemeContext";
import { Header } from "../components/Header";
import { Badge, BottomSheet, Card, Icon, MutedText, Screen } from "../components/ui";
import { photoUrl } from "../components/PhotoPicker";
import { TAB_BAR_CLEARANCE } from "../components/GlassTabBar";

type NewsItem =
  | { kind: "announcement"; id: string; date: string; text: string; photos: string[]; isSfu: boolean }
  | { kind: "event"; id: string; date: string; title: string; description: string; place?: string; photos: string[]; isSfu: boolean };

const NEWS_TABS = ["Все", "СФУ", "Общежитие"];

export default function NewsScreen() {
  const { t } = useLang();
  const { tokens, accent, radii } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState<NewsItem | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const channels = await api.chatChannels();
      const announcements = channels.find((c) => c.type === "ANNOUNCEMENTS");
      const sfuAnnouncements = channels.find((c) => c.type === "SFU_ANNOUNCEMENTS");
      const [messages, sfuMessages, events] = await Promise.all([
        announcements ? api.chatMessages(announcements.id) : Promise.resolve<ChatMessage[]>([]),
        sfuAnnouncements ? api.chatMessages(sfuAnnouncements.id) : Promise.resolve<ChatMessage[]>([]),
        api.events(),
      ]);

      const merged: NewsItem[] = [
        ...messages.map(
          (m): NewsItem => ({ kind: "announcement", id: m.id, date: m.createdAt, text: m.text, photos: m.photos, isSfu: false })
        ),
        ...sfuMessages.map(
          (m): NewsItem => ({ kind: "announcement", id: m.id, date: m.createdAt, text: m.text, photos: m.photos, isSfu: true })
        ),
        ...events.map(
          // For now assume events are dorm specific unless we modify backend to return isSfu or dormId.
          // Let's rely on dormId returned from API or default to false.
          (e: any): NewsItem => ({ kind: "event", id: e.id, date: e.date, title: e.title, description: e.description, photos: e.photos, isSfu: e.dormId === 0 || e.isSfu })
        ),
      ];
      merged.sort((a, b) => (b.date < a.date ? -1 : b.date > a.date ? 1 : 0));
      setItems(merged);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const canPost = user?.residentRole === "NEWS_EDITOR";

  const filteredItems = items.filter(item => {
    if (activeTab === 0) return true;
    if (activeTab === 1) return item.isSfu;
    if (activeTab === 2) return !item.isSfu;
    return true;
  });

  return (
    <Screen>
      <Header title={t("news")} />

      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
        <View style={{ flexDirection: "row", backgroundColor: tokens.card, borderRadius: radii.md, padding: 4 }}>
          {NEWS_TABS.map((tab, i) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(i)}
              style={{
                flex: 1,
                paddingVertical: 8,
                alignItems: "center",
                backgroundColor: activeTab === i ? accent : "transparent",
                borderRadius: radii.sm,
              }}
            >
              <Text style={{ color: activeTab === i ? "#fff" : tokens.tx, fontWeight: "600" }}>{tab}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_CLEARANCE + 16, gap: 12 }}
        ListEmptyComponent={!loading ? <MutedText style={{ textAlign: "center", marginTop: 40 }}>{t("noNews")}</MutedText> : undefined}
        renderItem={({ item }) => (
          <Pressable onPress={() => setOpened(item)}>
            <Card style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <Badge
                    label={item.isSfu ? "СФУ" : "Общежитие"}
                    tone={item.isSfu ? "warning" : "neutral"}
                  />
                  <Badge
                    label={item.kind === "event" ? t("newsEvent") : t("newsAnnouncement")}
                    tone={item.kind === "event" ? "accent" : "neutral"}
                  />
                </View>
                <MutedText>{new Date(item.date).toLocaleDateString("ru-RU")}</MutedText>
              </View>
              {item.kind === "event" ? (
                <>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Icon name="calendar" size={14} color={accent} />
                    <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 15 }}>{item.title}</Text>
                  </View>
                  <MutedText>{item.description}</MutedText>
                </>
              ) : (
                <Text style={{ color: tokens.tx, fontSize: 14, lineHeight: 20 }}>{item.text}</Text>
              )}
              {item.photos[0] && (
                <Image source={{ uri: photoUrl(item.photos[0]) }} style={{ width: "100%", height: 140, borderRadius: radii.md }} resizeMode="cover" />
              )}
            </Card>
          </Pressable>
        )}
      />
      {canPost && (
        <Pressable
          onPress={() => navigation.navigate("CreateNews")}
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
      )}

      <BottomSheet visible={!!opened} onClose={() => setOpened(null)}>
        {opened && (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <Badge
                  label={opened.isSfu ? "СФУ" : "Общежитие"}
                  tone={opened.isSfu ? "warning" : "neutral"}
                />
                <Badge
                  label={opened.kind === "event" ? t("newsEvent") : t("newsAnnouncement")}
                  tone={opened.kind === "event" ? "accent" : "neutral"}
                />
              </View>
              <MutedText>{new Date(opened.date).toLocaleDateString("ru-RU")}</MutedText>
            </View>
            {opened.kind === "event" ? (
              <>
                <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 18 }}>{opened.title}</Text>
                <Text style={{ color: tokens.tx, fontSize: 15, lineHeight: 22 }}>{opened.description}</Text>
              </>
            ) : (
              <Text style={{ color: tokens.tx, fontSize: 15, lineHeight: 22 }}>{opened.text}</Text>
            )}
            {opened.photos[0] && (
              <Image source={{ uri: photoUrl(opened.photos[0]) }} style={{ width: "100%", height: 240, borderRadius: radii.lg }} resizeMode="cover" />
            )}
          </>
        )}
      </BottomSheet>
    </Screen>
  );
}
