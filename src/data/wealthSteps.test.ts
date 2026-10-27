import { describe, expect, test } from "bun:test";
import {
  BASE_WEALTH,
  BASE_RADIUS,
  MAX_WEALTH,
  MEDIAN_INCOME,
  buildAnchoredSteps,
  buildAutoSteps,
  calcRadius,
  wealthSteps,
  workYears,
} from "./wealthSteps";

describe("approved 2026 benchmarks", () => {
  const benchmarks = [
    ["One Dollar", 1],
    ["Median US Household", 192_900],
    ["Median US Home", 420_000],
    ["Top 1% Household", 14_200_000],
    ["A Single Billionaire", 1_000_000_000],
    ["The Richest Person", 320_000_000_000],
    ["Bottom 50% Combined", 4_100_000_000_000],
    ["All US Billionaires", 8_200_000_000_000],
  ] as const;

  for (const [title, amount] of benchmarks) {
    test(`${title} uses its approved amount`, () => {
      expect(wealthSteps.find((step) => step.title === title)?.wealth).toBe(amount);
    });
  }

  test("annual income uses the approved $83,180 benchmark", () => {
    expect(MEDIAN_INCOME).toBe(83_180);
    expect(workYears(83_180)).toBe(1);
    expect(workYears(320_000_000_000)).toBeCloseTo(3_847_078.624669392, 6);
  });

  test("median-household Earth remains the exact $192,900 baseline", () => {
    expect(BASE_WEALTH).toBe(192_900);
    expect(calcRadius(192_900)).toBe(BASE_RADIUS);
  });

  test("anchored and compare layouts preserve volume-proportional radii", () => {
    const compare = buildAutoSteps([1, 2, 3, 4, 5, 6, 7]);
    for (const [index, step] of wealthSteps.entries()) {
      const expectedVolume = step.wealth / 192_900;
      expect((step.radius / BASE_RADIUS) ** 3).toBeCloseTo(expectedVolume, 5);
      expect(step.volumeRatio).toBe(expectedVolume);
      expect(buildAnchoredSteps(index)[index]?.radius).toBe(step.radius);
      expect(compare[index]?.radius).toBe(step.radius);
    }
  });

  test("all-billionaire wealth is exactly twice bottom-half wealth", () => {
    const bottom = wealthSteps.find((step) => step.title === "Bottom 50% Combined");
    const billionaires = wealthSteps.find((step) => step.title === "All US Billionaires");
    expect(bottom?.wealth).toBe(4_100_000_000_000);
    expect(billionaires?.wealth).toBe((bottom?.wealth ?? 0) * 2);
  });

  test("the scale maximum matches the approved $8.2T amount", () => {
    expect(MAX_WEALTH).toBe(8_200_000_000_000);
  });
});