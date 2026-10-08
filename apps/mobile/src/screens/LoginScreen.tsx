import React, { useEffect, useRef, useState } from "react";
import { Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../state/AuthContext";
import { useLang } from "../state/LangContext";
import { useTheme } from "../state/ThemeContext";
import { BodyText, GlassPanel, Icon, Input, MutedText, PrimaryButton } from "../components/ui";

export default function LoginScreen() {
  const { login, error } = useAuth();
  const { t, lang, setLang } = useLang();
  const { tokens } = useTheme();
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dupModal, setDupModal] = useState(false);
  const dupOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (error === "account_linked") setDupModal(true);
  }, [error]);

  useEffect(() => {
    if (dupModal) {
      dupOpacity.setValue(0);
      Animated.timing(dupOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [dupModal, dupOpacity]);

  const onSubmit = async () => {
    setSubmitting(true);
    await login(loginValue.trim(), password);
    setSubmitting(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: tokens.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24, gap: 20 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: tokens.tx, fontSize: 20, fontWeight: "800" }}>{t("appName")}</Text>
          <Text onPress={() => setLang(lang === "ru" ? "en" : "ru")} style={{ color: tokens.mu, fontWeight: "700" }}>
            {lang === "ru" ? "RU" : "EN"}
          </Text>
        </View>

        <View style={{ gap: 14 }}>
          <View style={{ gap: 6 }}>
            <MutedText>{t("sfuLogin")}</MutedText>
            <Input value={loginValue} onChangeText={setLoginValue} placeholder="Example-TT26" />
          </View>
          <View style={{ gap: 6 }}>
            <MutedText>{t("sfuPassword")}</MutedText>
            <Input value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
          </View>
        </View>

        {error === "invalid_credentials" && (
          <BodyText style={{ color: "#E5484D" }}>{t("signInError")}</BodyText>
        )}

        <PrimaryButton label={t("signIn")} onPress={onSubmit} loading={submitting} disabled={!loginValue || !password} />

        <MutedText style={{ textAlign: "center" }}>{t("loginHint")}</MutedText>
      </ScrollView>

      <Modal visible={dupModal} animationType="none" transparent statusBarTranslucent hardwareAccelerated onRequestClose={() => setDupModal(false)}>
        <Animated.View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,.4)", padding: 16, opacity: dupOpacity }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDupModal(false)} />
          <Pressable onPress={(e) => e.stopPropagation()}>
            <GlassPanel style={{ padding: 22, gap: 12 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  backgroundColor: "rgba(220,38,38,.12)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="alert-triangle" size={22} color="#DC2626" />
              </View>
              <Text style={{ color: tokens.tx, fontSize: 19, fontWeight: "700" }}>{t("accountLinkedTitle")}</Text>
              <BodyText>{t("accountLinked")}</BodyText>
              <PrimaryButton label={t("ok")} onPress={() => setDupModal(false)} />
            </GlassPanel>
          </Pressable>
        </Animated.View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
