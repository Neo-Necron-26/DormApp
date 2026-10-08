import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Listing } from "@sfu/shared";
import { useTheme } from "../state/ThemeContext";
import { useLang } from "../state/LangContext";
import { Icon, MutedText, Badge } from "./ui";
import { photoUrl } from "./PhotoPicker";
import { dealTypeOf, dealTypeLabelKey, formatListingPrice, timeAgo } from "../utils/listing";

export function ListingCard({
  listing,
  distanceText,
  onPress,
  onToggleFavorite,
}: {
  listing: Listing;
  distanceText?: string;
  onPress: () => void;
  onToggleFavorite?: () => void;
}) {
  const { tokens, accent, radii } = useTheme();
  const { t } = useLang();
  const dealType = dealTypeOf(listing.category);

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: tokens.card,
        borderColor: tokens.bd,
        borderWidth: 1,
        borderRadius: radii.lg,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: 120,
          backgroundColor: tokens.ph1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {listing.photos[0] ? (
          <Image source={{ uri: photoUrl(listing.photos[0]) }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        ) : (
          <PlaceholderHatch />
        )}
        <View style={{ position: "absolute", top: 8, left: 8, flexDirection: "row", gap: 6 }}>
          {listing.isUShop && (
            <Badge label="U-Shop" tone="accent" />
          )}
          <Badge label={t(dealTypeLabelKey(dealType))} tone={dealType === "wanted" ? "accent" : "neutral"} />
        </View>
        {onToggleFavorite && (
          <Pressable
            onPress={onToggleFavorite}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: "rgba(0,0,0,0.45)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name={listing.isFavorited ? "heart" : "heart-outline"} size={16} color={listing.isFavorited ? "#EF4444" : "#fff"} />
          </Pressable>
        )}
      </View>
      <View style={{ padding: 12, gap: 6 }}>
        <Text numberOfLines={2} style={{ color: tokens.tx, fontWeight: "700", fontSize: 14 }}>
          {listing.title}
        </Text>
        <Text style={{ color: accent, fontWeight: "800", fontSize: 16 }}>{formatListingPrice(listing, t)}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <MutedText>
            №{listing.dormId} · {t("room")} {listing.room}
          </MutedText>
          {listing.seller.verified && <Icon name="check-circle" size={12} color="#22C55E" />}
          {distanceText && <MutedText>· {distanceText}</MutedText>}
        </View>
        <MutedText style={{ fontSize: 11 }}>{timeAgo(listing.createdAt)}</MutedText>
      </View>
    </Pressable>
  );
}

/** The design system's stand-in for a missing photo: a labeled diagonal-hatch
 * placeholder (spec §6.3), rendered as evenly spaced rotated bars. */
export function PlaceholderHatch({ label }: { label?: string }) {
  const { tokens } = useTheme();
  return (
    <View style={{ flex: 1, width: "100%", overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
      <View style={[StyleSheet.absoluteFill, { flexDirection: "row", opacity: 0.5 }]}>
        {Array.from({ length: 14 }).map((_, i) => (
          <View
            key={i}
            style={{
              width: 2,
              height: 220,
              backgroundColor: tokens.bd,
              transform: [{ rotate: "35deg" }],
              marginLeft: 14,
            }}
          />
        ))}
      </View>
      {label && (
        <View style={{ backgroundColor: tokens.card, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
          <Text style={{ color: tokens.mu, fontSize: 10 }}>{label}</Text>
        </View>
      )}
    </View>
  );
}
