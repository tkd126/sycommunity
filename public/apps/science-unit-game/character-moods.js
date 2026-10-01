(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CharacterMoods = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const CHARACTER_MOODS = {
    taeo: ["normal", "happy", "worried", "fear", "angry"],
    somi: ["normal", "happy", "worried", "fear", "angry"],
    eunho: ["normal", "happy", "worried", "fear", "angry"],
    teacher: ["normal", "serious", "surprised"],
  };

  const SCENE_MOODS = {
    "empty-desk": { somi: "worried", eunho: "worried" },
    "eunho-forgets": { eunho: "worried", taeo: "fear" },
    "chapter1-start": { taeo: "worried", somi: "worried" },
    "hallway-eunho": { eunho: "happy", taeo: "fear" },
    "festival-help": { teacher: "normal", somi: "normal" },
    "sand-problem": { taeo: "worried", somi: "happy" },
    "sand-plan": { somi: "normal", eunho: "normal" },
    "sand-result": { taeo: "happy", somi: "happy" },
    "sand-explain": { somi: "happy", eunho: "normal" },
    "hana-credit": { eunho: "worried", somi: "worried" },
    "chapter1-end": { eunho: "worried", taeo: "fear", somi: "worried" },
    "storage-1": { taeo: "happy", somi: "normal" },
    "storage-2": { taeo: "normal", somi: "normal" },
    "tape-choice": { taeo: "worried", somi: "worried" },
    "tape-path-observe": { taeo: "normal", somi: "happy" },
    "tape-path-play": { taeo: "happy", somi: "normal" },
    "tape-path-teacher": { taeo: "fear", somi: "worried" },
    "reaction-choice": { taeo: "fear", somi: "worried" },
    "bell-choice": { taeo: "fear", somi: "fear" },
    "past-wake": { teacher: "serious", taeo: "worried", somi: "worried" },
    "intro-choice": { teacher: "normal", taeo: "worried", somi: "normal" },
    "intro-path-safe": { eunho: "worried", taeo: "normal", somi: "normal" },
    "intro-path-name": { teacher: "surprised", taeo: "worried", somi: "worried" },
    "intro-path-taeo": { eunho: "happy", taeo: "worried", somi: "worried" },
    "school-name": { teacher: "surprised", taeo: "worried", somi: "worried" },
    "taeo-intro": { teacher: "serious", taeo: "worried", somi: "worried" },
    "eunho-first": { eunho: "angry", taeo: "normal", somi: "normal" },
    "phone-choice": { eunho: "worried", taeo: "worried", somi: "worried" },
    "phone-path-organizer": { eunho: "normal", taeo: "worried", somi: "normal" },
    "phone-path-future": { eunho: "fear", taeo: "fear", somi: "fear" },
    "phone-path-jeongbok": { eunho: "angry", taeo: "worried", somi: "angry" },
    "eunho-tease": { eunho: "happy", taeo: "normal", somi: "normal" },
    "eunho-phone": { eunho: "fear", taeo: "fear", somi: "worried" },
    "jeongbok-lie": { eunho: "angry", taeo: "worried", somi: "angry" },
    "teacher-slip": { eunho: "normal", somi: "worried" },
    "eunho-reaction": { eunho: "fear", somi: "worried" },
    "future-teacher": { eunho: "happy", somi: "normal" },
  };

  function getCharacterMood(sceneId, characterId) {
    return SCENE_MOODS[sceneId]?.[characterId] || "normal";
  }

  return { CHARACTER_MOODS, SCENE_MOODS, getCharacterMood };
});
