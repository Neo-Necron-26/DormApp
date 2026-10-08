import React, { useEffect, useState } from "react";
import { Dimensions, FlatList, Image, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Listing } from "@sfu/shared";
import { api } from "../state/api";
import { useAuth } from "../state/AuthContext";
import { useTheme } from "../state/ThemeContext";
import { useLang } from "../state/LangContext";
import { Avatar, Badge, BodyText, Card, Icon, MutedText, PrimaryButton, Screen, SecondaryButton, VerifiedBadge } from "../components/ui";
import { PlaceholderHatch } from "../components/ListingCard";
import { photoUrl } from "../components/PhotoPicker";
import { ctaLabelKey, dealTypeOf, dealTypeLabelKey, formatListingPrice, memberSince, timeAgo } from "../utils/listing";

const { width } = Dimensions.get("window");
const GALLERY_HEIGHT = 240;

export default function ListingDetailScreen() {
  const { params } = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { tokens, accent, radii } = useTheme();
  const { t } = useLang();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [startingChat, setStartingChat] = useState(false);

  const openSellerChat = async () => {
    if (!listing) return;
    setStartingChat(true);
    try {
      const channel = await api.startDM(listing.seller.id);
      navigation.navigate("ChatThread", { channelId: channel.id, title: listing.seller.fullName, canPost: true });
    } finally {
      setStartingChat(false);
    }
  };

  useEffect(() => {
    api.listing(params.id).then(setListing);
  }, [params.id]);

  const toggleFavorite = async () => {
    if (!listing) return;
    setListing({ ...listing, isFavorited: !listing.isFavorited });
    const updated = await api.toggleFavorite(listing.id);
    setListing(updated);
  };

  if (!listing) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <MutedText>…</MutedText>
        </View>
      </Screen>
    );
  }

  const maxUrl = listing.seller.maxVisible && listing.seller.maxId ? `https://${listing.seller.maxId}` : null;
  const dealType = dealTypeOf(listing.category);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 24, gap: 16 }}>
        <View style={{ height: GALLERY_HEIGHT, borderRadius: radii.xl, overflow: "hidden", marginHorizontal: 16 }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              position: "absolute",
              top: 8,
              left: 12,
              zIndex: 2,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(0,0,0,0.45)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="arrow-left" size={18} color="#fff" />
          </Pressable>
          <Pressable
            onPress={toggleFavorite}
            style={{
              position: "absolute",
              top: 8,
              right: 12,
              zIndex: 2,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(0,0,0,0.45)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name={listing.isFavorited ? "heart" : "heart-outline"} size={18} color={listing.isFavorited ? "#EF4444" : "#fff"} />
          </Pressable>
          {listing.photos.length > 0 ? (
            <>
              <FlatList
                data={listing.photos}
                keyExtractor={(p) => p}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / (width - 32)))}
                renderItem={({ item }) => (
                  <View style={{ width: width - 32, height: GALLERY_HEIGHT, backgroundColor: tokens.ph1 }}>
                    <Image source={{ uri: photoUrl(item) }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  </View>
                )}
              />
              {listing.photos.length > 1 && (
                <View style={{ position: "absolute", bottom: 10, alignSelf: "center", flexDirection: "row", gap: 5 }}>
                  {listing.photos.map((_, i) => (
                    <View
                      key={i}
                      style={{
                        width: i === photoIndex ? 16 : 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: i === photoIndex ? "#fff" : "rgba(255,255,255,.5)",
                      }}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={{ flex: 1, backgroundColor: tokens.ph1 }}>
              <PlaceholderHatch />
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: 16, gap: 6 }}>
          <Badge label={t(dealTypeLabelKey(dealType))} tone={dealType === "wanted" ? "accent" : "neutral"} />
          <Text style={{ color: tokens.tx, fontSize: 22, fontWeight: "700" }}>{listing.title}</Text>
          <Text style={{ color: accent, fontSize: 24, fontWeight: "800" }}>{formatListingPrice(listing, t)}</Text>
          <MutedText>{timeAgo(listing.createdAt)}</MutedText>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 16 }}>
          <Card>
            <MutedText style={{ marginBottom: 6 }}>{listing.category}</MutedText>
            <BodyText>{listing.description}</BodyText>
          </Card>

          <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Avatar initials={listing.seller.initials} size={48} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: tokens.tx, fontWeight: "700" }}>{listing.seller.fullName}</Text>
              <MutedText>
                №{listing.dormId} · {t("room")} {listing.room} · {listing.seller.dealsCount} {t("deals")}
              </MutedText>
              <MutedText>{memberSince(listing.seller.createdAt)}</MutedText>
              {listing.seller.verified && (
                <View style={{ gap: 2, marginTop: 2 }}>
                  <VerifiedBadge label={t("verified")} />
                  <MutedText style={{ fontSize: 11 }}>Договор подтверждён администрацией</MutedText>
                </View>
              )}
            </View>
          </Card>

          {listing.seller.id !== user?.id && (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <PrimaryButton label={t(ctaLabelKey(dealType))} onPress={openSellerChat} loading={startingChat} />
              </View>
              {maxUrl && (
                <View style={{ flex: 1 }}>
                  <SecondaryButton icon="external-link" label={t("writeMax")} onPress={() => Linking.openURL(maxUrl)} />
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
