import { describe, expect, it } from "vitest";
import type { RunState } from "@/lib/contract";
import { runTitle } from "./runTitle";

// Only the interpreted technology is read, so the fixture carries just that.
const stateWith = (interpretation: { technology: string } | null): RunState =>
  ({ run: { interpretation } }) as unknown as RunState;

describe("runTitle", () => {
  it("uses the interpreted technology when there is one", () => {
    expect(runTitle(stateWith({ technology: "Solid-state electrolyte coating" }))).toBe(
      "Solid-state electrolyte coating",
    );
  });

  it("trims surrounding whitespace off the technology", () => {
    expect(runTitle(stateWith({ technology: "  Drone lidar  " }))).toBe("Drone lidar");
  });

  it("falls back to 'Your idea' with no interpretation", () => {
    expect(runTitle(stateWith(null))).toBe("Your idea");
  });

  it("falls back to 'Your idea' when the technology is blank", () => {
    expect(runTitle(stateWith({ technology: "   " }))).toBe("Your idea");
  });
});
