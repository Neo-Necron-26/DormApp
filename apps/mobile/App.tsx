import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "./src/state/ThemeContext";
import { LangProvider } from "./src/state/LangContext";
import { AuthProvider } from "./src/state/AuthContext";
import { SocketProvider } from "./src/state/SocketContext";
import { NotificationsProvider } from "./src/state/NotificationsContext";
import { ToastProvider } from "./src/state/ToastContext";
import { RootNavigator } from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LangProvider>
          <AuthProvider>
            <SocketProvider>
              <NotificationsProvider>
                <ToastProvider>
                  <RootNavigator />
                </ToastProvider>
              </NotificationsProvider>
            </SocketProvider>
          </AuthProvider>
        </LangProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
