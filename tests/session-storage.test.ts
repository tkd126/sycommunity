import { beforeEach, describe, expect, it } from "vitest";

import {
  readSessionValue,
  removeSessionValue,
  writeSessionValue,
} from "@/lib/session-storage";

type Draft = {
  title: string;
};

const isDraft = (value: unknown): value is Draft =>
  typeof value === "object"
  && value !== null
  && "title" in value
  && typeof value.title === "string";

describe("session storage", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("restores a validated value when the stored version matches", () => {
    const draft = { title: "우리 반 관찰 기록" };

    writeSessionValue("draft", 3, draft);

    expect(readSessionValue("draft", 3, isDraft)).toEqual(draft);
    expect(sessionStorage.getItem("draft")).toBe(JSON.stringify({ version: 3, value: draft }));
  });

  it("removes broken JSON without throwing", () => {
    sessionStorage.setItem("draft", "{broken");

    expect(() => readSessionValue("draft", 3, isDraft)).not.toThrow();
    expect(readSessionValue("draft", 3, isDraft)).toBeNull();
    expect(sessionStorage.getItem("draft")).toBeNull();
  });

  it("removes a value and returns null when its version does not match", () => {
    sessionStorage.setItem("draft", JSON.stringify({ version: 2, value: { title: "이전 기록" } }));

    expect(readSessionValue("draft", 3, isDraft)).toBeNull();
    expect(sessionStorage.getItem("draft")).toBeNull();
  });

  it("removes a value and returns null when validation fails", () => {
    sessionStorage.setItem("draft", JSON.stringify({ version: 3, value: { title: 42 } }));

    expect(readSessionValue("draft", 3, isDraft)).toBeNull();
    expect(sessionStorage.getItem("draft")).toBeNull();
  });

  it("removes only the specified key", () => {
    sessionStorage.setItem("draft", "one");
    sessionStorage.setItem("other-draft", "two");

    removeSessionValue("draft");

    expect(sessionStorage.getItem("draft")).toBeNull();
    expect(sessionStorage.getItem("other-draft")).toBe("two");
  });
});
