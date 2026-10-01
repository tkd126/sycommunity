(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CharacterLayout = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function planCharacterLayout(ids, active) {
    const positions = ids.length === 1 ? ["center"] : ids.length === 2 ? ["left", "right"] : ["left", "center", "right"];
    return ids.map((id, index) => {
      const role = id === active ? "active" : "support";
      return { id, position: positions[index] || "center", role, shot: role === "active" ? "close" : "medium" };
    });
  }

  return { planCharacterLayout };
});
