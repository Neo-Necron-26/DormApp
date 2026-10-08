import React, { useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChatMessage } from "@sfu/shared";
import { api } from "../state/api";
import { useAuth } from "../state/AuthContext";
import { useLang } from "../state/LangContext";
import { useTheme } from "../state/ThemeContext";
import { useSocket } from "../state/SocketContext";
import { Avatar, Icon, Input, MutedText, Screen } from "../components/ui";

export default function ChatThreadScreen() {
  const { params } = useRoute<any>();
  const navigation = useNavigation<any>();
  const { channelId, title, canPost } = params as { channelId: string; title: string; canPost: boolean };
  const { user } = useAuth();
  const { t } = useLang();
  const { tokens, accent, radii } = useTheme();
  const socket = useSocket();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    navigation.setOptions({ title });
  }, [title]);

  useEffect(() => {
    api.chatMessages(channelId).then(setMessages);
  }, [channelId]);

  useEffect(() => {
    if (!socket) return;
    socket.emit("join-channel", channelId);
    const onMessage = (m: ChatMessage) => {
      if (m.channelId === channelId) setMessages((prev) => [...prev, m]);
    };
    socket.on("chat-message", onMessage);
    return () => {
      socket.emit("leave-channel", channelId);
      socket.off("chat-message", onMessage);
    };
  }, [socket, channelId]);

  const send = async () => {
    if (!text.trim()) return;
    const body = text;
    setText("");
    const message = await api.sendChatMessage(channelId, { text: body });
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
        <FlatList
          ref={listRef}
          style={{ flex: 1 }}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1, justifyContent: "flex-end" }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const mine = item.author.id === user?.id;
            return (
              <View style={{ flexDirection: "row", gap: 8, justifyContent: mine ? "flex-end" : "flex-start" }}>
                {!mine && <Avatar initials={item.author.initials} size={30} />}
                <View
                  style={{
                    maxWidth: "75%",
                    backgroundColor: mine ? accent : tokens.card,
                    borderWidth: mine ? 0 : 1,
                    borderColor: tokens.bd,
                    borderRadius: radii.md,
                    padding: 10,
                  }}
                >
                  {!mine && (
                    <Text style={{ fontSize: 11, fontWeight: "700", color: item.author.role === "ADMIN" ? accent : tokens.mu, marginBottom: 2 }}>
                      {item.author.fullName}
                    </Text>
                  )}
                  <Text style={{ color: mine ? "#fff" : tokens.tx, fontSize: 14 }}>{item.text}</Text>
                </View>
              </View>
            );
          }}
        />

        {canPost ? (
          <View style={{ flexDirection: "row", gap: 8, padding: 12, paddingBottom: insets.bottom + 12, alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Input value={text} onChangeText={setText} placeholder={t("chatMessagePlaceholder")} />
            </View>
            <Pressable
              onPress={send}
              style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: accent, alignItems: "center", justifyContent: "center" }}
            >
              <Icon name="send" size={18} color="#fff" />
            </Pressable>
          </View>
        ) : (
          <View style={{ padding: 14, paddingBottom: insets.bottom + 14 }}>
            <MutedText style={{ textAlign: "center" }}>{t("chatReadOnly")}</MutedText>
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}
