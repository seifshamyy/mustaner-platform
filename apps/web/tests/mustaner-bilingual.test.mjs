import { describe, expect, test } from "bun:test";

import {
  isArabic,
  lessonName,
  localizeCourse,
  parseLearnings,
  readArabic,
  withArabic,
} from "../services/mustaner/bilingual.ts";

const course = {
  name: "AI Automation System Architect",
  description: "Build real automation systems",
  about: "About the program",
  learnings: JSON.stringify([
    { id: "l1", text: "Design systems", emoji: "" },
    { id: "l2", text: "Deploy agents", emoji: "" },
  ]),
  extra_metadata: {
    mustaner: {
      hours: "60",
      delivery: "Online",
      ar: {
        name: "مهندس أنظمة الأتمتة بالذكاء الاصطناعي",
        about: "  ",
        learnings: { l1: "تصميم الأنظمة" },
        facts: { delivery: "أونلاين" },
        chapters: { chapter_a: "الأساسيات" },
        lessons: { activity_1: "مقدمة" },
      },
    },
  },
  chapters: [
    {
      chapter_uuid: "chapter_a",
      name: "Foundations",
      activities: [
        { activity_uuid: "activity_1", name: "Intro" },
        { activity_uuid: "activity_2", name: "Setup" },
      ],
    },
    { chapter_uuid: "chapter_b", name: "Agents", activities: [] },
  ],
};

describe("localizeCourse", () => {
  test("shows the Arabic copy in Arabic, English where there is none", () => {
    const ar = localizeCourse(course, "ar");
    expect(ar.name).toBe("مهندس أنظمة الأتمتة بالذكاء الاصطناعي");
    expect(ar.description).toBe("Build real automation systems");
    expect(ar.about).toBe("About the program");
    expect(JSON.parse(ar.learnings).map((l) => l.text)).toEqual(["تصميم الأنظمة", "Deploy agents"]);
    expect(ar.chapters.map((c) => c.name)).toEqual(["الأساسيات", "Agents"]);
    expect(ar.chapters[0].activities.map((a) => a.name)).toEqual(["مقدمة", "Setup"]);
  });

  test("leaves the course untouched in English", () => {
    expect(localizeCourse(course, "en")).toBe(course);
    expect(localizeCourse(course, undefined)).toBe(course);
  });

  test("keeps learnings in the shape they came in", () => {
    const asArray = { ...course, learnings: JSON.parse(course.learnings) };
    expect(localizeCourse(asArray, "ar-EG").learnings[0].text).toBe("تصميم الأنظمة");
  });

  test("a course without Arabic is returned as it is", () => {
    const plain = { name: "X", extra_metadata: { mustaner: { hours: "1" } } };
    expect(localizeCourse(plain, "ar")).toBe(plain);
  });
});

describe("withArabic", () => {
  test("replaces only the Arabic, keeping the course facts and anything else", () => {
    const next = withArabic({ other: 1, mustaner: { hours: "60", ar: { name: "old" } } }, {
      name: " جديد ",
      about: "",
      learnings: { l1: "نص", l2: " " },
    });
    expect(next.other).toBe(1);
    expect(next.mustaner.hours).toBe("60");
    expect(next.mustaner.ar).toEqual({ name: "جديد", learnings: { l1: "نص" }, facts: {}, chapters: {}, lessons: {} });
  });

  test("starts from nothing", () => {
    expect(withArabic(null, { name: "س" })).toEqual({ mustaner: { ar: { name: "س", learnings: {}, facts: {}, chapters: {}, lessons: {} } } });
  });
});

describe("helpers", () => {
  test("readArabic drops empty entries", () => {
    expect(readArabic(course).about).toBeUndefined();
    expect(readArabic({}).name).toBeUndefined();
  });

  test("parseLearnings reads every stored form", () => {
    expect(parseLearnings('[{"id":"x","text":"A"}]')).toEqual([{ id: "x", text: "A", emoji: undefined }]);
    expect(parseLearnings(["A", ""])).toEqual([{ id: "0", text: "A" }]);
    expect(parseLearnings("plain line")).toEqual([{ id: "0", text: "plain line" }]);
    expect(parseLearnings(null)).toEqual([]);
  });

  test("lessonName and isArabic", () => {
    expect(lessonName(course, { activity_uuid: "activity_1", name: "Intro" }, "ar")).toBe("مقدمة");
    expect(lessonName(course, { activity_uuid: "activity_1", name: "Intro" }, "en")).toBe("Intro");
    expect(isArabic("ar-EG")).toBe(true);
    expect(isArabic("en")).toBe(false);
  });
});
