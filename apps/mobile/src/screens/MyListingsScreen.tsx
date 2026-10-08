import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Listing } from "@sfu/shared";
import { api } from "../state/api";
import { useLang } from "../state/LangContext";
import { useTheme } from "../state/ThemeContext";
import { Card, MutedText, PrimaryButton, Screen, ScreenTitle, SecondaryButton } from "../components/ui";

type Tab = "mine" | "favorites";

export default function MyListingsScreen() {
  const { t } = useLang();
  const { tokens, accent, radii } = useTheme();
  const navigation = useNavigation<any>();

  const [tab, setTab] = useState<Tab>("mine");
  const [mine, setMine] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, f] = await Promise.all([api.myListings(), api.favoriteListings()]);
      setMine(m);
      setFavorites(f);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markSold = async (id: string) => {
    await api.updateListing(id, { status: "SOLD" });
    load();
  };

  const data = tab === "mine" ? mine : favorites;

  return (
    <Screen>
      <View style={{ padding: 16, gap: 12 }}>
        <ScreenTitle>{tab === "mine" ? t("myListings") : t("favorites")}</ScreenTitle>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["mine", "favorites"] as const).map((v) => (
            <Pressable
              key={v}
              onPress={() => setTab(v)}
              style={{
                paddingHorizontal: 16,
                height: 36,
                borderRadius: radii.pill,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: tab === v ? accent : tokens.card,
                borderWidth: 1,
                borderColor: tab === v ? accent : tokens.bd,
              }}
            >
              <Text style={{ color: tab === v ? "#fff" : tokens.tx, fontSize: 13, fontWeight: "700" }}>
                {v === "mine" ? t("myListings") : t("favorites")}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 10 }}
        ListEmptyComponent={
          !loading ? (
            <MutedText style={{ textAlign: "center", marginTop: 40 }}>
              {tab === "mine" ? t("noMyListings") : t("noFavorites")}
            </MutedText>
          ) : undefined
        }
        renderItem={({ item }) => (
          <Card onPress={() => navigation.navigate("ListingDetail", { id: item.id })} style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 15, flex: 1 }} numberOfLines={1}>
                {item.title}
              </Text>
              {item.status === "SOLD" && (
                <View style={{ backgroundColor: tokens.sub, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
                  <Text style={{ color: tokens.mu, fontSize: 11, fontWeight: "700" }}>{t("statusSold")}</Text>
                </View>
              )}
            </View>
            <MutedText>{item.price.toLocaleString("ru-RU")} ₽</MutedText>
            {tab === "mine" && item.status !== "SOLD" && (
              <SecondaryButton label={t("markSold")} onPress={() => markSold(item.id)} />
            )}
          </Card>
        )}
      />
    </Screen>
  );
}
