import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { readStorage, removeStorage, writeStorage } from "@/lib/storage";

const itemSchema = z.object({
  n: z.number(),
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("storage local", () => {
  it("scrie JSON sub cheia cu prefix KidOS", () => {
    expect(writeStorage("item", { n: 1 })).toEqual({ ok: true });
    expect(window.localStorage.getItem("KidOS.item")).toBe(
      JSON.stringify({ n: 1 }),
    );
  });

  it("citește JSON validat de schema Zod", () => {
    window.localStorage.setItem("KidOS.item", JSON.stringify({ n: 1 }));

    expect(readStorage("item", itemSchema)).toEqual({
      ok: true,
      data: { n: 1 },
    });
  });

  it("șterge valoarea de sub cheia cu prefix", () => {
    window.localStorage.setItem("KidOS.item", JSON.stringify({ n: 1 }));

    expect(removeStorage("item")).toEqual({ ok: true });
    expect(window.localStorage.getItem("KidOS.item")).toBeNull();
  });

  it("semnalează JSON invalid fără să arunce", () => {
    window.localStorage.setItem("KidOS.item", "{");

    expect(() => readStorage("item", itemSchema)).not.toThrow();
    expect(readStorage("item", itemSchema)).toEqual({
      ok: false,
      reason: "invalid-json",
    });
  });

  it("semnalează validarea eșuată", () => {
    window.localStorage.setItem("KidOS.item", JSON.stringify({ n: "nu" }));

    expect(readStorage("item", itemSchema)).toEqual({
      ok: false,
      reason: "validation",
    });
  });

  it("semnalează eroarea de scriere fără să arunce", () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;

    expect(() => writeStorage("item", circular)).not.toThrow();
    expect(writeStorage("item", circular)).toEqual({
      ok: false,
      reason: "write-error",
    });
  });

  it("semnalează storage indisponibil", () => {
    vi.stubGlobal("localStorage", {
      get getItem() {
        throw new Error("blocked");
      },
      get setItem() {
        throw new Error("blocked");
      },
      get removeItem() {
        throw new Error("blocked");
      },
    });

    expect(readStorage("item", itemSchema)).toEqual({
      ok: false,
      reason: "unavailable",
    });
    expect(writeStorage("item", { n: 1 })).toEqual({
      ok: false,
      reason: "unavailable",
    });
    expect(removeStorage("item")).toEqual({
      ok: false,
      reason: "unavailable",
    });
  });
});
