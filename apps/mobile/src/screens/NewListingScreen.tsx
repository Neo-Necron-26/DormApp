import React, { useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { api } from "../state/api";
import { useAuth } from "../state/AuthContext";
import { useLang } from "../state/LangContext";
import { useTheme } from "../state/ThemeContext";
import { useToast } from "../state/ToastContext";
import { Chip, Icon, Input, MutedText, PrimaryButton, Screen, ScreenTitle } from "../components/ui";
import { PhotoPicker } from "../components/PhotoPicker";
import { ListingCard } from "../components/ListingCard";
import { LISTING_CATEGORIES } from "../utils/listing";
import type { Listing } from "@sfu/shared";

const STEP_COUNT = 7;
const STEP_TITLE_KEYS = [
  "wizardStep1Title",
  "wizardStep2Title",
  "wizardStep3Title",
  "wizardStep4Title",
  "wizardStep5Title",
  "wizardStep6Title",
  "wizardStep7Title",
] as const;

export default function NewListingScreen() {
  const { user } = useAuth();
  const { t } = useLang();
  const { tokens, accent, radii } = useTheme();
  const navigation = useNavigation<any>();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(LISTING_CATEGORIES[0]);
  const [price, setPrice] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [description, setDescription] = useState("");
  const [room, setRoom] = useState(user?.room || "");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const canProceed = () => {
    if (step === 1) return title.trim().length > 0;
    if (step === 3) return negotiable || price.trim().length > 0;
    if (step === 4) return description.trim().length > 0;
    return true;
  };

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await api.createListing({
        title,
        description,
        price: negotiable ? 0 : Number(price) || 0,
        negotiable,
        category,
        photos,
        dormId: user.dormId,
        room: room || user.room,
      });
      showToast(t("publish") + " ✓");
      navigation.goBack();
    } finally {
      setSubmitting(false);
    }
  };

  const previewListing: Listing = {
    id: "preview",
    title: title || "—",
    description: description || "—",
    price: negotiable ? 0 : Number(price) || 0,
    negotiable,
    category,
    photos,
    status: "ACTIVE",
    isUShop: false,
    dormId: user?.dormId ?? 6,
    room: room || user?.room || "—",
    createdAt: new Date().toISOString(),
    isFavorited: false,
    seller: {
      id: user?.id ?? "",
      fullName: user?.fullName ?? "",
      initials: user?.initials ?? "",
      verified: user?.verified ?? false,
      maxId: user?.maxId ?? null,
      maxVisible: user?.maxVisible ?? false,
      dealsCount: user?.dealsCount ?? 0,
      createdAt: user?.createdAt ?? new Date().toISOString(),
    },
  };

  return (
    <Screen>
      <View style={{ padding: 16, gap: 4 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: tokens.mu, fontSize: 12, fontWeight: "700" }}>
            {t("step")} {step} {t("stepOf")} {STEP_COUNT}
          </Text>
          <Pressable onPress={() => navigation.goBack()} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Icon name="x" size={14} color={tokens.mu} />
            <Text style={{ color: tokens.mu, fontSize: 12, fontWeight: "700" }}>{t("cancel")}</Text>
          </Pressable>
        </View>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: tokens.sub, overflow: "hidden" }}>
          <View style={{ width: `${(step / STEP_COUNT) * 100}%`, height: 4, backgroundColor: accent }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 14, flexGrow: 1 }}>
        <ScreenTitle>{t(STEP_TITLE_KEYS[step - 1])}</ScreenTitle>

        {step === 1 && <Input value={title} onChangeText={setTitle} placeholder={t("listingTitle")} />}

        {step === 2 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {LISTING_CATEGORIES.map((c) => (
              <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
            ))}
          </View>
        )}

        {step === 3 && (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: tokens.tx, fontSize: 14, fontWeight: "600" }}>{t("negotiable")}</Text>
              <Switch value={negotiable} onValueChange={setNegotiable} />
            </View>
            {!negotiable && (
              <Input value={price} onChangeText={setPrice} placeholder={t("listingPrice")} keyboardType="phone-pad" />
            )}
          </View>
        )}

        {step === 4 && (
          <View style={{ gap: 8 }}>
            <Input value={description} onChangeText={setDescription} placeholder={t("listingDescription")} />
            <MutedText>состояние, комплект, когда забрать</MutedText>
          </View>
        )}

        {step === 5 && (
          <View style={{ gap: 8 }}>
            <Input value={room} onChangeText={setRoom} placeholder={t("pickupRoom")} />
            <MutedText>{t("pickupOptional")}</MutedText>
          </View>
        )}

        {step === 6 && <PhotoPicker value={photos} onChange={setPhotos} />}

        {step === 7 && (
          <View style={{ gap: 12 }}>
            <MutedText>{t("reviewAndPublish")}</MutedText>
            <View style={{ width: 180 }}>
              <ListingCard listing={previewListing} onPress={() => {}} />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={{ padding: 16, flexDirection: "row", gap: 10 }}>
        {step > 1 && (
          <View style={{ flex: 1 }}>
            <Pressable
              onPress={() => setStep(step - 1)}
              style={{ height: 50, borderRadius: radii.md, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: tokens.bd }}
            >
              <Text style={{ color: tokens.tx, fontWeight: "700" }}>{t("back")}</Text>
            </Pressable>
          </View>
        )}
        <View style={{ flex: 2 }}>
          <PrimaryButton
            label={step === STEP_COUNT ? t("publish") : t("next")}
            onPress={() => (step === STEP_COUNT ? submit() : setStep(step + 1))}
            loading={submitting}
            disabled={!canProceed()}
          />
        </View>
      </View>
    </Screen>
  );
}
