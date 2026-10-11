import { describe, it, expect } from "vitest";
import {
  CURATED_WEDDING_SONGS,
  getCuratedWeddingSongs,
  getWeddingSongById,
  getWeddingSongsByGenre,
} from "../weddingMusicLibrary";

describe("weddingMusicLibrary", () => {
  it("should have at least 15 curated songs", () => {
    const songs = getCuratedWeddingSongs();
    expect(songs.length).toBeGreaterThanOrEqual(15);
  });

  it("should validate that each song has all required metadata and valid URLs", () => {
    for (const song of CURATED_WEDDING_SONGS) {
      expect(song.id).toBeTruthy();
      expect(song.title).toBeTruthy();
      expect(song.artist).toBeTruthy();
      expect(song.url).toMatch(/^https?:\/\//);
      expect(song.duration).toMatch(/^\d+:\d{2}$/);
      expect(song.genre).toBeDefined();
      expect(song.mood).toBeDefined();
    }
  });

  it("should find song by id", () => {
    const song1 = getWeddingSongById("song-1");
    expect(song1).toBeDefined();
    expect(song1?.title).toContain("Canon in D");

    const nonExistent = getWeddingSongById("invalid-song-id");
    expect(nonExistent).toBeUndefined();
  });

  it("should filter songs by genre correctly", () => {
    const pianoSongs = getWeddingSongsByGenre("Piano");
    expect(pianoSongs.length).toBeGreaterThan(0);
    expect(pianoSongs.every((s) => s.genre === "Piano")).toBe(true);

    const acousticSongs = getWeddingSongsByGenre("Acoustic");
    expect(acousticSongs.length).toBeGreaterThan(0);
    expect(acousticSongs.every((s) => s.genre === "Acoustic")).toBe(true);
  });
});
