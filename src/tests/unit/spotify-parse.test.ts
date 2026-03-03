import { describe, expect, it } from "vitest";
import { normalizeSpotifyArtistId, toSpotifyArtistUrl } from "@/lib/spotify/parse";

describe("spotify artist parsing", () => {
  const validId = "0du5cEVh5yTK9QJze8zA0C";

  it("accepts plain artist id", () => {
    expect(normalizeSpotifyArtistId(validId)).toBe(validId);
  });

  it("extracts id from spotify url", () => {
    expect(
      normalizeSpotifyArtistId(`https://open.spotify.com/artist/${validId}?si=abcd`),
    ).toBe(validId);
  });

  it("returns null for invalid input", () => {
    expect(normalizeSpotifyArtistId("not-valid")).toBeNull();
  });

  it("builds canonical spotify artist url", () => {
    expect(toSpotifyArtistUrl(validId)).toBe(`https://open.spotify.com/artist/${validId}`);
  });
});
