import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useAuth } from "../state/AuthContext";
import { useTheme } from "../state/ThemeContext";
import { useLang } from "../state/LangContext";
import { IconName } from "../components/ui";
import { GlassTabBar } from "../components/GlassTabBar";
import LoginScreen from "../screens/LoginScreen";
import FeedScreen from "../screens/FeedScreen";
import NewsScreen from "../screens/NewsScreen";
import CreateNewsScreen from "../screens/CreateNewsScreen";
import ListingDetailScreen from "../screens/ListingDetailScreen";
import ServicesHomeScreen from "../screens/ServicesHomeScreen";
import PaymentScreen from "../screens/PaymentScreen";
import AppealsScreen from "../screens/AppealsScreen";
import RepairsScreen from "../screens/RepairsScreen";
import LostFoundScreen from "../screens/LostFoundScreen";
import ContactAdminScreen from "../screens/ContactAdminScreen";
import NewListingScreen from "../screens/NewListingScreen";
import MyListingsScreen from "../screens/MyListingsScreen";
import MyTicketsScreen from "../screens/MyTicketsScreen";
import StudiesScreen from "../screens/StudiesScreen";
import DormLifeScreen from "../screens/DormLifeScreen";
import RoomChecksScreen from "../screens/RoomChecksScreen";
import AddResidentScreen from "../screens/AddResidentScreen";
import MaterialListScreen from "../screens/MaterialListScreen";
import CreateMaterialLogScreen from "../screens/CreateMaterialLogScreen";
import ChatListScreen from "../screens/ChatListScreen";
import ChatThreadScreen from "../screens/ChatThreadScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SettingsScreen from "../screens/SettingsScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import AdminOverviewScreen from "../screens/admin/AdminOverviewScreen";
import AdminRepairsScreen from "../screens/admin/AdminRepairsScreen";
import AdminResidentsScreen from "../screens/admin/AdminResidentsScreen";
import AdminMoreScreen from "../screens/admin/AdminMoreScreen";
import AdminBroadcastScreen from "../screens/admin/AdminBroadcastScreen";
import AdminEventsScreen from "../screens/admin/AdminEventsScreen";
import AdminAppealsScreen from "../screens/admin/AdminAppealsScreen";
import AdminContactScreen from "../screens/admin/AdminContactScreen";
import AdminAccountingScreen from "../screens/admin/AdminAccountingScreen";
import AdminLeadershipScreen from "../screens/admin/AdminLeadershipScreen";
import LeadershipOverviewScreen from "../screens/leadership/LeadershipOverviewScreen";
import LeadershipReportsScreen from "../screens/leadership/LeadershipReportsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const ServicesStack = createNativeStackNavigator();
const ChatStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

const TAB_ICON: Record<string, IconName> = {
  Feed: "home",
  News: "file-text",
  Chat: "message-circle",
  Services: "grid",
  Profile: "user",
  Overview: "bar-chart-2",
  Repairs: "tool",
  Residents: "users",
  More: "more-horizontal",
  LeadershipOverview: "bar-chart-2",
  LeadershipReports: "inbox",
};


function ServicesNavigator() {
  const { tokens } = useTheme();
  const { t } = useLang();
  return (
    <ServicesStack.Navigator screenOptions={{ headerStyle: { backgroundColor: tokens.card }, headerTintColor: tokens.tx }}>
      <ServicesStack.Screen name="ServicesHome" component={ServicesHomeScreen} options={{ headerShown: false }} />
      <ServicesStack.Screen name="Payment" component={PaymentScreen} options={{ title: t("payment") }} />
      <ServicesStack.Screen name="LostFound" component={LostFoundScreen} options={{ title: t("lostFound") }} />
    </ServicesStack.Navigator>
  );
}

function ChatNavigator() {
  const { tokens } = useTheme();
  return (
    <ChatStack.Navigator screenOptions={{ headerStyle: { backgroundColor: tokens.card }, headerTintColor: tokens.tx }}>
      <ChatStack.Screen name="ChatList" component={ChatListScreen} options={{ headerShown: false }} />
    </ChatStack.Navigator>
  );
}

function MoreNavigator() {
  const { tokens } = useTheme();
  return (
    <MoreStack.Navigator screenOptions={{ headerStyle: { backgroundColor: tokens.card }, headerTintColor: tokens.tx }}>
      <MoreStack.Screen name="AdminMoreHome" component={AdminMoreScreen} options={{ headerShown: false }} />
      <MoreStack.Screen name="AdminBroadcast" component={AdminBroadcastScreen} options={{ headerShown: false }} />
      <MoreStack.Screen name="AdminEvents" component={AdminEventsScreen} options={{ headerShown: false }} />
      <MoreStack.Screen name="AdminAppeals" component={AdminAppealsScreen} options={{ headerShown: false }} />
      <MoreStack.Screen name="AdminContact" component={AdminContactScreen} options={{ headerShown: false }} />
      <MoreStack.Screen name="AdminAccounting" component={AdminAccountingScreen} options={{ headerShown: false }} />
      <MoreStack.Screen name="AdminChat" component={ChatNavigator} options={{ headerShown: false }} />
      <MoreStack.Screen name="AdminLeadership" component={AdminLeadershipScreen} options={{ headerShown: false }} />
      <MoreStack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
    </MoreStack.Navigator>
  );
}

function StudentTabs() {
  const { t } = useLang();
  const labels: Record<string, string> = {
    Feed: t("feed"),
    News: t("news"),
    Chat: t("chat"),
    Services: t("services"),
    Profile: t("profile"),
  };
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props: BottomTabBarProps) => <GlassTabBar {...props} icons={TAB_ICON} labels={labels} />}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="News" component={NewsScreen} />
      <Tab.Screen name="Services" component={ServicesNavigator} />
      <Tab.Screen name="Chat" component={ChatNavigator} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  const { t } = useLang();
  const labels: Record<string, string> = { Overview: t("overview"), Repairs: t("repairs"), Residents: t("residents"), More: t("more") };
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props: BottomTabBarProps) => <GlassTabBar {...props} icons={TAB_ICON} labels={labels} />}
    >
      <Tab.Screen name="Overview" component={AdminOverviewScreen} />
      <Tab.Screen name="Repairs" component={AdminRepairsScreen} />
      <Tab.Screen name="Residents" component={AdminResidentsScreen} />
      <Tab.Screen name="More" component={MoreNavigator} />
    </Tab.Navigator>
  );
}

function LeadershipTabs() {
  const { t } = useLang();
  const labels: Record<string, string> = { LeadershipOverview: t("dormsOverview"), LeadershipReports: t("reportsToLeadership") };
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props: BottomTabBarProps) => <GlassTabBar {...props} icons={TAB_ICON} labels={labels} />}
    >
      <Tab.Screen name="LeadershipOverview" component={LeadershipOverviewScreen} />
      <Tab.Screen name="LeadershipReports" component={LeadershipReportsScreen} />
    </Tab.Navigator>
  );
}

import { StatusBar } from "expo-status-bar";

export function RootNavigator() {
  const { user, loading } = useAuth();
  const { tokens, themeName } = useTheme();
  const { t } = useLang();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: tokens.bg }}>
        <ActivityIndicator />
      </View>
    );
  }

  const isDark = themeName !== "light";
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: tokens.bg,
      card: tokens.card,
      text: tokens.tx,
      border: tokens.bd,
      primary: "#FF6B00",
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: tokens.card }, headerTintColor: tokens.tx }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen
              name="Tabs"
              component={user.role === "ADMIN" ? AdminTabs : user.role === "LEADERSHIP" ? LeadershipTabs : StudentTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="ChatThread" component={ChatThreadScreen} options={{ title: "" }} />
            {user.role === "STUDENT" && (
              <>
                <Stack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ headerShown: false }} />
                <Stack.Screen name="NewListing" component={NewListingScreen} options={{ title: "" }} />
                <Stack.Screen name="MyListings" component={MyListingsScreen} options={{ title: "" }} />
                <Stack.Screen name="MyTickets" component={MyTicketsScreen} options={{ title: "" }} />
                <Stack.Screen name="Studies" component={StudiesScreen} options={{ title: "" }} />
                <Stack.Screen name="CreateNews" component={CreateNewsScreen} options={{ title: "" }} />
                {/* Pushed at the root (not nested in the Services tab stack) so the
                    floating tab bar hides on them, per spec §6.5's "scenario screens" list. */}
                <Stack.Screen name="Repairs" component={RepairsScreen} options={{ title: t("repair") }} />
                <Stack.Screen name="Appeals" component={AppealsScreen} options={{ title: t("appeals") }} />
                <Stack.Screen name="ContactAdmin" component={ContactAdminScreen} options={{ title: t("contactCommandant") }} />
                {user.residentRole === "INSPECTOR" && (
                  <Stack.Screen name="RoomChecks" component={RoomChecksScreen} options={{ title: "" }} />
                )}
                {user.residentRole === "REGISTRAR" && (
                  <Stack.Screen name="AddResident" component={AddResidentScreen} options={{ title: "" }} />
                )}
                <Stack.Screen name="MaterialList" component={MaterialListScreen} options={{ headerShown: false }} />
                <Stack.Screen name="CreateMaterialLog" component={CreateMaterialLogScreen} options={{ headerShown: false }} />
              </>
            )}
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="DormLife" component={DormLifeScreen} options={{ title: "" }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
