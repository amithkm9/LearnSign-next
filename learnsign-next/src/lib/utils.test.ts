import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./utils";

describe("safeRedirectPath", () => {
  it("allows same-origin relative paths", () => {
    expect(safeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath("/learn/003?x=1#top")).toBe("/learn/003?x=1#top");
  });

  it("falls back when empty", () => {
    expect(safeRedirectPath(null)).toBe("/dashboard");
    expect(safeRedirectPath(undefined)).toBe("/dashboard");
    expect(safeRedirectPath("")).toBe("/dashboard");
    expect(safeRedirectPath(null, "/login")).toBe("/login");
  });

  it("rejects absolute URLs", () => {
    expect(safeRedirectPath("https://evil.example/x")).toBe("/dashboard");
    expect(safeRedirectPath("http://evil.example")).toBe("/dashboard");
  });

  it("rejects protocol-relative URLs", () => {
    // Browsers treat "//host" as absolute — the classic open-redirect bypass.
    expect(safeRedirectPath("//evil.example/x")).toBe("/dashboard");
  });

  it("rejects backslash and control-character tricks", () => {
    expect(safeRedirectPath("/\\evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("/\tevil")).toBe("/dashboard");
    expect(safeRedirectPath("/\nevil")).toBe("/dashboard");
    expect(safeRedirectPath("/\r\n//evil.example")).toBe("/dashboard");
  });

  it("rejects scheme-like paths that don't start with a slash", () => {
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/dashboard");
    expect(safeRedirectPath("dashboard")).toBe("/dashboard");
  });
});
