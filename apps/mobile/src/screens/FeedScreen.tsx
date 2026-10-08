import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DormWithDistance, Listing } from "@sfu/shared";
import { api } from "../state/api";
import { useAuth } from "../state/AuthContext";
import { useTheme } from "../state/ThemeContext";
import { useLang } from "../state/LangContext";
import { Header } from "../components/Header";
import { ListingCard } from "../components/ListingCard";
import { EvictionBanner } from "../components/EvictionBanner";
import { BottomSheet, Chip, Icon, Input, MutedText, PrimaryButton, Screen, SegmentedControl } from "../components/ui";
import { DormMapView } from "../components/DormMapView";
import { TAB_BAR_CLEARANCE } from "../components/GlassTabBar";
import { LISTING_CATEGORIES } from "../utils/listing";

type Sort = "newest" | "cheapest";
type Area = "all" | "dorm" | "floor";

function userFloor(room: string): string | null {
  const m = /^(\d)\d{2,3}$/.exec(room);
  return m ? m[1] : null;
}

export default function FeedScreen() {
  const { tokens, accent, radii } = useTheme();
  const { t, lang } = useLang();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [listings, setListings] = useState<Listing[]>([]);
  const [dorms, setDorms] = useState<DormWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<Sort>("newest");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [area, setArea] = useState<Area>("all");
  const [dormFilter, setDormFilter] = useState<number | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [uShopOnly, setUShopOnly] = useState(false);
  const activeFilterCount = (category ? 1 : 0) + (area !== "all" ? 1 : 0) + (uShopOnly ? 1 : 0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const floor = area === "floor" && user ? userFloor(user.room) ?? undefined : undefined;
      const dormId = area !== "all" && user ? user.dormId : dormFilter || undefined;
      const [l, d] = await Promise.all([
        api.listings({ sort, q: query || undefined, dormId, floor, status: undefined }).then((all) => {
          let res = all;
          if (category) res = res.filter((x) => x.category === category);
          if (uShopOnly) res = res.filter((x) => x.isUShop);
          return res;
        }),
        api.dorms(lang),
      ]);
      setListings(l);
      setDorms(d);
    } finally {
      setLoading(false);
    }
  }, [sort, query, category, area, dormFilter, lang, user, uShopOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const distanceForDorm = (dormId: number) => dorms.find((d) => d.id === dormId)?.distanceText;

  const toggleFavorite = async (id: string) => {
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, isFavorited: !l.isFavorited } : l)));
    await api.toggleFavorite(id);
  };

  return (
    <Screen>
      <Header title={t("feed")} />
      <EvictionBanner />

      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Input value={query} onChangeText={setQuery} placeholder={t("searchPlaceholder")} />
          </View>
          <Pressable
            onPress={() => setSort(sort === "newest" ? "cheapest" : "newest")}
            style={{
              borderWidth: 1,
              borderColor: tokens.bd,
              backgroundColor: tokens.card,
              borderRadius: radii.md,
              paddingHorizontal: 12,
              justifyContent: "center",
            }}
          >
            <Text style={{ color: tokens.tx, fontSize: 12, fontWeight: "600" }}>
              {sort === "newest" ? t("sortNewest") : t("sortCheapest")}
            </Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={() => setFiltersOpen(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 14,
              height: 36,
              borderRadius: radii.pill,
              borderWidth: 1,
              borderColor: activeFilterCount > 0 ? accent : tokens.bd,
              backgroundColor: activeFilterCount > 0 ? accent + "1A" : tokens.card,
            }}
          >
            <Icon name="sliders" size={14} color={activeFilterCount > 0 ? accent : tokens.tx} />
            <Text style={{ color: activeFilterCount > 0 ? accent : tokens.tx, fontSize: 13, fontWeight: "700" }}>
              {t("filters")}
              {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Text>
          </Pressable>
          {(["list", "map"] as const).map((v) => (
            <Pressable
              key={v}
              onPress={() => setView(v)}
              style={{
                paddingHorizontal: 16,
                height: 36,
                borderRadius: radii.pill,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: view === v ? accent : tokens.card,
                borderWidth: 1,
                borderColor: view === v ? accent : tokens.bd,
              }}
            >
              <Text style={{ color: view === v ? "#fff" : tokens.tx, fontSize: 13, fontWeight: "700" }}>
                {v === "list" ? t("feed") : t("map")}
              </Text>
            </Pressable>
          ))}
          {dormFilter && area === "all" && (
            <Pressable
              onPress={() => setDormFilter(null)}
              style={{
                paddingHorizontal: 12,
                height: 36,
                borderRadius: radii.pill,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 6,
                backgroundColor: tokens.sub,
              }}
            >
              <Text style={{ color: tokens.tx, fontSize: 12, fontWeight: "600" }}>№{dormFilter}</Text>
              <Icon name="x" size={13} color={tokens.mu} />
            </Pressable>
          )}
        </View>
      </View>

      <BottomSheet visible={filtersOpen} onClose={() => setFiltersOpen(false)}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: tokens.tx, fontSize: 18, fontWeight: "700" }}>{t("filters")}</Text>
          <Pressable
            onPress={() => setFiltersOpen(false)}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: tokens.sub, alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="x" size={16} color={tokens.mu} />
          </Pressable>
        </View>
        <MutedText>{t("listingCategory")}</MutedText>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Chip label={t("categoryAll")} active={category === null} onPress={() => setCategory(null)} />
          {LISTING_CATEGORIES.map((c) => (
            <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>
        <Pressable
          onPress={() => setUShopOnly(!uShopOnly)}
          style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16, marginBottom: 8 }}
        >
          <View style={{ width: 24, height: 24, borderRadius: radii.sm, borderWidth: 2, borderColor: uShopOnly ? accent : tokens.mu, backgroundColor: uShopOnly ? accent : "transparent", alignItems: "center", justifyContent: "center" }}>
            {uShopOnly && <Icon name="check" size={16} color="#fff" />}
          </View>
          <Text style={{ color: tokens.tx, fontSize: 16, fontWeight: "600" }}>Только объявления U-Shop</Text>
        </Pressable>
        <MutedText>{t("areaAll")}</MutedText>
        <SegmentedControl
          value={area}
          onChange={setArea}
          options={[
            { value: "all", label: t("areaAll") },
            { value: "dorm", label: t("areaDorm") },
            { value: "floor", label: t("areaFloor") },
          ]}
        />
        <PrimaryButton label={t("save")} onPress={() => setFiltersOpen(false)} />
      </BottomSheet>

      {view === "map" ? (
        <DormMapView
          dorms={dorms}
          selectedDormId={dormFilter}
          onSelectDorm={(id) => setDormFilter(id)}
          onShowListings={(id) => {
            setArea("all");
            setDormFilter(id);
            setView("list");
          }}
        />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ gap: 12, paddingVertical: 12, paddingBottom: TAB_BAR_CLEARANCE + 16 }}
          refreshing={loading}
          onRefresh={load}
          ListEmptyComponent={!loading ? <MutedText style={{ textAlign: "center", marginTop: 40 }}>{t("noListings")}</MutedText> : undefined}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <ListingCard
                listing={item}
                distanceText={distanceForDorm(item.dormId)}
                onPress={() => navigation.navigate("ListingDetail", { id: item.id })}
                onToggleFavorite={() => toggleFavorite(item.id)}
              />
            </View>
          )}
        />
      )}

      <Pressable
        onPress={() => navigation.navigate("NewListing")}
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
