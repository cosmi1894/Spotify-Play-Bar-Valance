"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default,
  onLoad: () => onLoad,
  onUnload: () => onUnload
});
module.exports = __toCommonJS(index_exports);
var _val = (typeof valenced !== "undefined" ? valenced : (typeof window !== "undefined" ? window.valenced : {}));
var metro = _val.metro || {};
var patcher = _val.patcher || {};
var import_react = _val.metro?.common?.React || (typeof React !== "undefined" ? React : {});
var import_react2 = import_react;
var import_react_native = _val.metro?.common?.ReactNative || (typeof ReactNative !== "undefined" ? ReactNative : {});
function safe(fn) {
  try {
    return fn();
  } catch (e) {
    return void 0;
  }
}
var getSpotifyStore = () => {
  var _a;
  return (_a = safe(() => metro.findByStoreName("SpotifyStore"))) != null ? _a : safe(() => metro.findByProps("getActiveSocketAndDevice", "getPlayableComputerDevices"));
};
var getDispatcher = () => safe(() => metro.findByProps("subscribe", "unsubscribe", "dispatch"));
var getRestApi = () => safe(() => metro.findByProps("getAPIBaseURL", "get", "post"));
var CHAT_INPUT_CANDIDATES = [
  () => metro.findByName("ChatInputGuard", false),
  () => metro.findByName("ChatInput", false),
  () => metro.findByName("ChannelTextAreaContainer", false),
  () => metro.findByName("Chat", false)
];
function findChatTarget() {
  var _a, _b;
  for (const find of CHAT_INPUT_CANDIDATES) {
    const mod = safe(find);
    if (!mod) continue;
    if (typeof mod === "function") {
      continue;
    }
    for (const key of ["default", "type", "render"]) {
      if (typeof mod[key] === "function") {
        return { module: mod, key, label: `${(_b = (_a = mod[key].displayName) != null ? _a : mod[key].name) != null ? _b : "?"}.${key}` };
      }
    }
  }
  return null;
}

// src/spotifyApi.ts
var PLAYER_URL = "https://api.spotify.com/v1/me/player";
var SpotifyApiError = class extends Error {
  constructor(status, message, retryAfter) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
};
function getSocketInfo() {
  var _a, _b, _c, _d, _e;
  const active = (_b = (_a = getSpotifyStore()) == null ? void 0 : _a.getActiveSocketAndDevice) == null ? void 0 : _b.call(_a);
  return {
    accessToken: (_c = active == null ? void 0 : active.socket) == null ? void 0 : _c.accessToken,
    accountId: (_d = active == null ? void 0 : active.socket) == null ? void 0 : _d.accountId,
    deviceId: (_e = active == null ? void 0 : active.device) == null ? void 0 : _e.id
  };
}
var hasSpotifySession = () => !!getSocketInfo().accessToken;
async function refreshToken(accountId) {
  var _a, _b;
  const rest = getRestApi();
  if (!rest || !accountId) return null;
  try {
    const res = await rest.get({
      url: `/users/@me/connections/spotify/${accountId}/access-token`
    });
    return (_b = (_a = res == null ? void 0 : res.body) == null ? void 0 : _a.access_token) != null ? _b : null;
  } catch (e) {
    return null;
  }
}
async function request(method, path, query = {}) {
  var _a;
  const info = getSocketInfo();
  let token = info.accessToken;
  if (!token) throw new SpotifyApiError(401, "No linked Spotify session");
  let retriedAuth = false;
  let retriedDevice = false;
  for (; ; ) {
    const qs = new URLSearchParams(query).toString();
    const res = await fetch(`${PLAYER_URL}${path}${qs ? `?${qs}` : ""}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    });
    if (res.status === 401 && !retriedAuth) {
      retriedAuth = true;
      const fresh = (_a = await refreshToken(info.accountId)) != null ? _a : getSocketInfo().accessToken;
      if (!fresh || fresh === token) throw new SpotifyApiError(401, "Spotify token rejected");
      token = fresh;
      continue;
    }
    if (res.status === 404 && !retriedDevice && info.deviceId && method !== "GET" && !query.device_id) {
      retriedDevice = true;
      query = __spreadProps(__spreadValues({}, query), { device_id: info.deviceId });
      continue;
    }
    if (res.status === 429) {
      throw new SpotifyApiError(429, "Rate limited", Number(res.headers.get("Retry-After")) || 1);
    }
    return res;
  }
}
async function command(method, path) {
  const res = await request(method, path);
  if (res.status === 200 || res.status === 202 || res.status === 204) return;
  throw new SpotifyApiError(res.status, `Spotify ${path} failed (${res.status})`);
}
var play = () => command("PUT", "/play");
var pause = () => command("PUT", "/pause");
var next = () => command("POST", "/next");
var previous = () => command("POST", "/previous");
async function getPlayback() {
  var _a, _b, _c, _d, _e;
  const res = await request("GET", "");
  if (res.status === 204 || res.status === 202) return { track: null, isPlaying: false };
  if (res.status !== 200) throw new SpotifyApiError(res.status, `Spotify player state failed (${res.status})`);
  const data = await res.json();
  const item = data == null ? void 0 : data.item;
  if (!item || item.type === "ad") return { track: null, isPlaying: !!(data == null ? void 0 : data.is_playing) };
  return {
    isPlaying: !!data.is_playing,
    track: {
      id: item.id,
      title: item.name,
      artist: ((_a = item.artists) != null ? _a : []).map((a) => a.name).join(", "),
      albumArt: (_d = (_c = (_b = item.album) == null ? void 0 : _b.images) == null ? void 0 : _c[0]) == null ? void 0 : _d.url,
      durationMs: (_e = item.duration_ms) != null ? _e : 0
    }
  };
}

// src/playerState.ts
var EVENTS = [
  "SPOTIFY_PLAYER_STATE",
  "SPOTIFY_PLAYER_PAUSE",
  "SPOTIFY_SET_DEVICES",
  "SPOTIFY_PROFILE_UPDATE",
  "SPOTIFY_ACCOUNT_ACCESS_TOKEN"
];
var POLL_MS = 8e3;
var state = { visible: false, track: null, isPlaying: false };
var listeners = /* @__PURE__ */ new Set();
var pollTimer;
var started = false;
var getState = () => state;
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function setState(patch) {
  var _a;
  const track = patch.track !== void 0 ? patch.track : state.track;
  state = {
    track,
    isPlaying: (_a = patch.isPlaying) != null ? _a : state.isPlaying,
    visible: hasSpotifySession() && !!track
  };
  listeners.forEach((l) => l());
}
function fromFluxTrack(t) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  if (!t) return null;
  return {
    id: t.id,
    title: t.name,
    artist: ((_a = t.artists) != null ? _a : []).map((a) => a.name).join(", "),
    albumArt: (_g = (_c = (_b = t.album) == null ? void 0 : _b.image) == null ? void 0 : _c.url) != null ? _g : (_f = (_e = (_d = t.album) == null ? void 0 : _d.images) == null ? void 0 : _e[0]) == null ? void 0 : _f.url,
    durationMs: (_h = t.duration) != null ? _h : 0
  };
}
var onPlayerState = (e) => setState({ track: fromFluxTrack(e.track), isPlaying: !!e.isPlaying });
var onPause = () => setState({ isPlaying: false });
var onOther = () => setState({});
async function refresh() {
  if (!hasSpotifySession()) return setState({ track: null, isPlaying: false });
  try {
    const p = await getPlayback();
    setState({ track: p.track, isPlaying: p.isPlaying });
  } catch (e) {
  }
}
function start() {
  var _a, _b;
  if (started) return;
  started = true;
  const dispatcher = getDispatcher();
  for (const ev of EVENTS) {
    const handler = ev === "SPOTIFY_PLAYER_STATE" ? onPlayerState : ev === "SPOTIFY_PLAYER_PAUSE" ? onPause : onOther;
    dispatcher == null ? void 0 : dispatcher.subscribe(ev, handler);
  }
  const known = (_b = (_a = getSpotifyStore()) == null ? void 0 : _a.getPlayerState) == null ? void 0 : _b.call(_a);
  if (known == null ? void 0 : known.track) setState({ track: fromFluxTrack(known.track), isPlaying: !!known.isPlaying });
  refresh();
  pollTimer = setInterval(refresh, POLL_MS);
}
function stop() {
  if (!started) return;
  started = false;
  const dispatcher = getDispatcher();
  for (const ev of EVENTS) {
    const handler = ev === "SPOTIFY_PLAYER_STATE" ? onPlayerState : ev === "SPOTIFY_PLAYER_PAUSE" ? onPause : onOther;
    dispatcher == null ? void 0 : dispatcher.unsubscribe(ev, handler);
  }
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = void 0;
  listeners.clear();
  state = { visible: false, track: null, isPlaying: false };
}

// src/components/SpotifyBar.tsx
var colors = {
  bg: "#1E1F22",
  border: "#3F4147",
  textPrimary: "#F2F3F5",
  textSecondary: "#B5BAC1",
  spotify: "#1DB954"
};
function usePlayerState() {
  const [s, setLocal] = (0, import_react.useState)(getState());
  (0, import_react.useEffect)(() => {
    setLocal(getState());
    return subscribe(() => setLocal(getState()));
  }, []);
  return s;
}
function ControlButton({ label, onPress, accent }) {
  return /* @__PURE__ */ import_react.default.createElement(import_react_native.TouchableOpacity, { style: styles.button, onPress, activeOpacity: 0.6 }, /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: [styles.buttonText, accent && { color: colors.spotify }] }, label));
}
function SpotifyBar() {
  const { visible, track, isPlaying } = usePlayerState();
  if (!visible || !track) return null;
  const run = (fn) => async () => {
    try {
      await fn();
    } catch (e) {
    }
    setTimeout(refresh, 600);
  };
  const togglePlay = async () => {
    const wasPlaying = isPlaying;
    setState({ isPlaying: !wasPlaying });
    try {
      await (wasPlaying ? pause() : play());
    } catch (e) {
      setState({ isPlaying: wasPlaying });
    }
    setTimeout(refresh, 600);
  };
  return /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.container }, track.albumArt ? /* @__PURE__ */ import_react.default.createElement(import_react_native.Image, { source: { uri: track.albumArt }, style: styles.art }) : /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: [styles.art, styles.artFallback] }), /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.info }, /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.title, numberOfLines: 1 }, track.title), /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.artist, numberOfLines: 1 }, track.artist)), /* @__PURE__ */ import_react.default.createElement(ControlButton, { label: "|\u25C0", onPress: run(previous) }), /* @__PURE__ */ import_react.default.createElement(ControlButton, { label: isPlaying ? "\u275A\u275A" : "\u25B6", onPress: togglePlay, accent: true }), /* @__PURE__ */ import_react.default.createElement(ControlButton, { label: "\u25B6|", onPress: run(next) }));
}
var styles = import_react_native.StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  art: { width: 40, height: 40, borderRadius: 4 },
  artFallback: { backgroundColor: colors.border },
  info: { flex: 1, marginHorizontal: 10 },
  title: { color: colors.textPrimary, fontSize: 14, fontWeight: "600" },
  artist: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  button: { paddingHorizontal: 10, paddingVertical: 8 },
  buttonText: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" }
});

// src/index.ts
var loaded = false;
function onLoad() {
  if (loaded) return;
  loaded = true;
  start();
  const target = findChatTarget();
  if (!target) {
    console.warn("[SpotifyControlBar] Could not locate the chat container; bar will not render.");
    return;
  }
  patcher.after(
    target.module,
    target.key,
    (_args, res) => import_react2.default.createElement(import_react2.default.Fragment, null, import_react2.default.createElement(SpotifyBar), res)
  );
  console.log(`[SpotifyControlBar] Patched ${target.label}`);
}
function onUnload() {
  patcher.unpatchAll();
  stop();
  loaded = false;
}
var index_default = { onLoad, onUnload };
