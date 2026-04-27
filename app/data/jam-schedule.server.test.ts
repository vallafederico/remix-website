import * as assert from "remix/assert";
import { describe, it } from "remix/test";
import { parseScheduleItems } from "./jam-schedule.server";
describe("parseScheduleItems", () => {
  it("parses valid schedule items", () => {
    let raw = [
      {
        time: "9:00 AM",
        title: "Keynote",
        description: "Opening talk",
        speaker: "Jane Doe",
      },
      {
        time: "10:00 AM",
        title: "Workshop",
        description: "Hands on",
        speaker: "John",
        imgFilename: "john.webp",
        bio: "Developer",
      },
    ];
    let result = parseScheduleItems(raw);
    assert.equal(result.length, 2);
    assert.deepEqual(result[0], {
      time: "9:00 AM",
      title: "Keynote",
      description: "Opening talk",
      speaker: "Jane Doe",
    });
    assert.equal(result[1].imgFilename, "john.webp");
    assert.equal(result[1].bio, "Developer");
  });
  it("rejects invalid shape - missing required fields", () => {
    let raw = [{ time: "9:00" }]; // missing title, description, speaker
    assert.throws(() => parseScheduleItems(raw));
  });
  it("rejects non-array input", () => {
    assert.throws(() => parseScheduleItems({}));
    assert.throws(() => parseScheduleItems("not an array"));
  });
});
