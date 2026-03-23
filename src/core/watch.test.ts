import assert from "node:assert";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import nodePath from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { watchAndRebuild } from "./watch.ts";

describe("watchAndRebuild", () => {
	let tempDir: string;
	let cleanup: (() => void) | null = null;

	beforeEach(async () => {
		tempDir = await mkdtemp(nodePath.join(tmpdir(), "tinyss-watch-test-"));
	});

	afterEach(async () => {
		if (cleanup) {
			cleanup();
			cleanup = null;
		}
		await rm(tempDir, { recursive: true, force: true });
	});

	it("detects file creation", async () => {
		let callCount = 0;

		const { promise, resolve } = Promise.withResolvers<void>();

		cleanup = watchAndRebuild([tempDir], async () => {
			callCount++;
			resolve();
		});

		await new Promise((r) => setTimeout(r, 50));
		await writeFile(nodePath.join(tempDir, "test.md"), "hello");

		await promise;
		assert.ok(callCount >= 1, "rebuild should have been called");
	});

	it("debounces multiple rapid changes", async () => {
		let callCount = 0;

		const { promise, resolve } = Promise.withResolvers<void>();

		cleanup = watchAndRebuild([tempDir], async () => {
			callCount++;
			resolve();
		});

		await new Promise((r) => setTimeout(r, 50));

		await writeFile(nodePath.join(tempDir, "a.md"), "one");
		await writeFile(nodePath.join(tempDir, "b.md"), "two");
		await writeFile(nodePath.join(tempDir, "c.md"), "three");

		await promise;
		await new Promise((r) => setTimeout(r, 300));

		assert.strictEqual(
			callCount,
			1,
			"rebuild should be called exactly once after debounce",
		);
	});

	it("cleanup stops watching", async () => {
		let callCount = 0;

		cleanup = watchAndRebuild([tempDir], async () => {
			callCount++;
		});

		cleanup();
		cleanup = null;

		await new Promise((r) => setTimeout(r, 50));
		await writeFile(nodePath.join(tempDir, "test.md"), "hello");
		await new Promise((r) => setTimeout(r, 300));

		assert.strictEqual(
			callCount,
			0,
			"rebuild should not be called after cleanup",
		);
	});

	it("ignores irrelevant file extensions", async () => {
		let callCount = 0;

		cleanup = watchAndRebuild([tempDir], async () => {
			callCount++;
		});

		await new Promise((r) => setTimeout(r, 50));
		await writeFile(nodePath.join(tempDir, "test.png"), "image data");
		await new Promise((r) => setTimeout(r, 300));

		assert.strictEqual(
			callCount,
			0,
			"rebuild should not be called for .png files",
		);
	});
});
