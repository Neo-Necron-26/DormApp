import React, { useMemo, useRef, useState } from "react";
import { FlatList, Linking, Pressable, Text, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DormWithDistance, HOME_DORM_ID, twoGisRouteUrl, yandexRouteUrl } from "@sfu/shared";
import { useTheme } from "../state/ThemeContext";
import { useLang } from "../state/LangContext";
import { Icon, Input, MutedText } from "./ui";
import { TAB_BAR_CLEARANCE } from "./GlassTabBar";
import { buildMapHtml } from "./dormMapHtml";

const MAP_HEIGHT = 240;

// A real interactive map — Leaflet + OpenStreetMap tiles, run inside a WebView
// — replaces both the earlier `react-native-maps` view (Android needs a paid
// Google Maps key we don't have, no web target at all) and a later static-image
// attempt (couldn't pan/zoom, so it never satisfied "карта не двигается").
// Leaflet+OSM needs no API key, is genuinely pannable/zoomable, and computes
// marker positions itself — no manual Mercator math that could misplace pins.
// `react-native-webview` has no web target of its own, so `DormMapView.web.tsx`
// renders the same HTML in a plain `<iframe>` instead.

export function DormMapView({
  dorms,
  selectedDormId,
  onSelectDorm,
  onShowListings,
}: {
  dorms: DormWithDistance[];
  selectedDormId: number | null;
  onSelectDorm: (id: number) => void;
  onShowListings: (id: number) => void;
}) {
  const { tokens, accent, radii } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const selected = dorms.find((d) => d.id === selectedDormId) || null;
  const [search, setSearch] = useState("");
  const webviewRef = useRef<WebView>(null);

  const mapHtml = useMemo(() => buildMapHtml(dorms, selectedDormId), [dorms]);

  const sorted = useMemo(() => [...dorms].sort((a, b) => a.meters - b.meters), [dorms]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((d) => d.nameRu.toLowerCase().includes(q) || d.addrRu.toLowerCase().includes(q) || String(d.id).includes(q));
  }, [search, sorted]);

  const selectAndFly = (id: number) => {
    onSelectDorm(id);
    webviewRef.current?.postMessage(JSON.stringify({ type: "flyTo", dormId: id }));
  };

  const onWebViewMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === "select") onSelectDorm(msg.dormId);
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={visible}
        keyExtractor={(d) => String(d.id)}
        contentContainerStyle={{ paddingBottom: insets.bottom + TAB_BAR_CLEARANCE + (selected ? 140 : 16), gap: 10 }}
        ListHeaderComponent={
          <View style={{ padding: 16, gap: 10 }}>
            <View style={{ height: MAP_HEIGHT, borderRadius: radii.lg, overflow: "hidden", backgroundColor: tokens.ph1 }}>
              <WebView
                ref={webviewRef}
                source={{ html: mapHtml, baseUrl: "https://yandex.ru" }}
                originWhitelist={['*']}
                style={{ flex: 1, backgroundColor: "transparent" }}
                onMessage={onWebViewMessage}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
              />
              <Pressable
                onPress={() => webviewRef.current?.postMessage(JSON.stringify({ type: "fitAll" }))}
                style={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  paddingHorizontal: 12,
                  height: 34,
                  borderRadius: 17,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(20,20,20,.75)",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 11 }}>{t("showAllDorms")}</Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Input value={search} onChangeText={setSearch} placeholder={t("findDorm")} />
              </View>
              {search.length > 0 && (
                <Pressable
                  onPress={() => setSearch("")}
                  style={{
                    paddingHorizontal: 14,
                    height: 50,
                    borderRadius: radii.md,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: tokens.card,
                    borderWidth: 1,
                    borderColor: tokens.bd,
                  }}
                >
                  <Icon name="x" size={16} color={tokens.tx} />
                </Pressable>
              )}
            </View>
          </View>
        }
        renderItem={({ item: d }) => {
          const isSelected = d.id === selectedDormId;
          const isHome = d.id === HOME_DORM_ID;
          return (
            <Pressable onPress={() => selectAndFly(d.id)} style={{ paddingHorizontal: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderWidth: 1,
                  borderColor: isSelected ? accent : tokens.bd,
                  backgroundColor: isSelected ? accent + "14" : tokens.card,
                  borderRadius: radii.lg,
                  padding: 14,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isHome ? "#121212" : isSelected ? accent : tokens.sub,
                    }}
                  >
                    <Icon name="map-pin" size={15} color={isHome || isSelected ? "#fff" : tokens.mu} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 14 }}>{d.nameRu}</Text>
                    <MutedText>{isHome ? t("yourDorm") : `${d.addrRu} · ${d.distanceText} · ${d.walkText}`}</MutedText>
                  </View>
                </View>
                {!!d.listingsCount && (
                  <View style={{ backgroundColor: "rgba(255,107,0,.15)", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 12, fontWeight: "800", color: accent }}>{d.listingsCount}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        }}
      />

      {selected && (
        <View
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            bottom: insets.bottom + TAB_BAR_CLEARANCE,
            backgroundColor: tokens.card,
            borderColor: tokens.bd,
            borderWidth: 1,
            borderRadius: radii.xl,
            padding: 16,
            gap: 10,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: -4 },
            elevation: 10,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 16 }}>{selected.nameRu}</Text>
              <MutedText>{selected.addrRu}</MutedText>
              {selected.isHome ? (
                <MutedText>{t("yourDorm")}</MutedText>
              ) : (
                <MutedText>
                  {selected.distanceText} · {selected.walkText} {t("map").toLowerCase()}
                </MutedText>
              )}
            </View>
            <Pressable onPress={() => onSelectDorm(0)}>
              <Icon name="x" size={18} color={tokens.mu} />
            </Pressable>
          </View>

          {!selected.isHome && (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => Linking.openURL(yandexRouteUrl(selected))}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  gap: 6,
                  alignItems: "center",
                  justifyContent: "center",
                  height: 40,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: tokens.bd,
                }}
              >
                <Icon name="navigation" size={14} color={tokens.tx} />
                <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 12 }}>{t("routeViaYandex")}</Text>
              </Pressable>
              <Pressable
                onPress={() => Linking.openURL(twoGisRouteUrl(selected))}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  gap: 6,
                  alignItems: "center",
                  justifyContent: "center",
                  height: 40,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: tokens.bd,
                }}
              >
                <Icon name="navigation" size={14} color={tokens.tx} />
                <Text style={{ color: tokens.tx, fontWeight: "700", fontSize: 12 }}>{t("routeVia2gis")}</Text>
              </Pressable>
            </View>
          )}

          <Pressable
            onPress={() => onShowListings(selected.id)}
            style={{ backgroundColor: accent, borderRadius: radii.md, height: 44, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
              {t("showListings")} ({selected.listingsCount || 0})
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
