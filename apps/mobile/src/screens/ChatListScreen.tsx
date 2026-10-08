import React, { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { ChatChannelSummary, PublicUser } from "@sfu/shared";
import { api } from "../state/api";
import { useAuth } from "../state/AuthContext";
import { useLang } from "../state/LangContext";
import { useTheme } from "../state/ThemeContext";
import { useSocket } from "../state/SocketContext";
import { Card, Icon, IconName, MutedText, Screen } from "../components/ui";
import { Header } from "../components/Header";

const CHANNEL_ICON: Record<string, IconName> = { SECTION: "layers", DORM: "home", ANNOUNCEMENTS: "volume-2", CAMPUS: "book-open", DM: "user" };

function labelFor(channel: ChatChannelSummary, t: (k: any) => string, user: { dormId: number; section: string | null } | null) {
  switch (channel.type) {
    case "SECTION":
      return `${t("chatSection")} ${channel.section ?? ""}`.trim();
    case "DORM":
      return `${t("chatDorm")} №${channel.dormId ?? user?.dormId ?? ""}`;
    case "ANNOUNCEMENTS":
      return t("chatAnnouncements");
    case "CAMPUS":
      return t("chatCampus");
    case "DM":
      return channel.peer?.fullName ?? t("chat");
    default:
      return t("chat");
  }
}

export default function ChatListScreen() {
  const { t } = useLang();
  const { tokens, accent } = useTheme();
  const { user } = useAuth();
  const socket = useSocket();
  const navigation = useNavigation<any>();
  const [channels, setChannels] = useState<ChatChannelSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PublicUser[]>([]);

  const load = useCallback(() => {
    api.chatChannels().then(setChannels);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (!socket) return;
    const onMessage = () => load();
    socket.on("chat-message", onMessage);
    return () => {
      socket.off("chat-message", onMessage);
    };
  }, [socket, load]);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timer = setTimeout(() => {
        api.searchUsers(searchQuery).then(setSearchResults);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const startDM = async (peer: PublicUser) => {
    const channel = await api.startDM(peer.id);
    setSearchQuery("");
    navigation.navigate("ChatThread", { channelId: channel.id, title: peer.fullName, canPost: true });
  };

  return (
    <Screen>
      <Header title={t("chat")} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: tokens.inp,
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 44,
            marginBottom: 10,
          }}
        >
          <Icon name="search" size={18} color={tokens.mu} />
          <TextInput
            style={{ flex: 1, color: tokens.tx, marginLeft: 8, fontSize: 15 }}
            placeholder={t("globalSearchPlaceholder")}
            placeholderTextColor={tokens.mu}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {searchQuery.trim().length > 0 ? (
          searchResults.length > 0 ? (
            searchResults.map((u) => (
              <Pressable key={u.id} onPress={() => startDM(u)}>
                <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Icon name="user" size={22} color={tokens.tx} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 15 }}>{u.fullName}</Text>
                    {u.verified && <MutedText>{t("verified")}</MutedText>}
                  </View>
                </Card>
              </Pressable>
            ))
          ) : (
            <MutedText style={{ textAlign: "center", marginTop: 20 }}>Ничего не найдено</MutedText>
          )
        ) : (
          channels.map((channel) => (
            <Pressable
              key={channel.id}
              onPress={() =>
                navigation.navigate("ChatThread", { channelId: channel.id, title: labelFor(channel, t, user), canPost: channel.canPost })
              }
            >
              <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Icon name={CHANNEL_ICON[channel.type]} size={22} color={tokens.tx} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 15 }}>{labelFor(channel, t, user)}</Text>
                  <MutedText numberOfLines={1} style={{ marginTop: 2 }}>
                    {channel.lastMessage ? `${channel.lastMessage.author.fullName.split(" ")[0]}: ${channel.lastMessage.text}` : "…"}
                  </MutedText>
                </View>
                {channel.unreadCount > 0 && (
                  <View
                    style={{
                      minWidth: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: accent,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 6,
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{channel.unreadCount}</Text>
                  </View>
                )}
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
