// Custom entry point (instead of the default `expo/AppEntry`) because that
// file resolves `../../App` relative to its own on-disk location, which
// breaks once npm workspaces hoists `expo` out of this package's
// node_modules and up to the monorepo root.
import { registerRootComponent } from "expo";
import App from "./App";

registerRootComponent(App);
