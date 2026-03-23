import { watch } from "node:fs";
import nodePath from "node:path";

const RELEVANT_EXTENSIONS = new Set([
	".md",
	".yaml",
	".yml",
	".json",
	".toml",
	".hbs",
	".css",
	".js",
	".ts",
	".tsx",
]);

const DEBOUNCE_MS = 150;

function uniqueDirs(files: string[]): string[] {
	const dirs = new Set<string>();
	for (const file of files) {
		dirs.add(nodePath.dirname(nodePath.resolve(file)));
	}
	return [...dirs];
}

function watchAndRebuild(
	dirs: string[],
	rebuild: () => Promise<void>,
): () => void {
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let isRebuilding = false;
	const abortController = new AbortController();

	const triggerRebuild = (): void => {
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}

		debounceTimer = setTimeout(async () => {
			if (isRebuilding) return;
			isRebuilding = true;
			console.log("Rebuilding...");
			await rebuild();
			console.log("Done.");
			isRebuilding = false;
		}, DEBOUNCE_MS);
	};

	const watchers = dirs.map((dir) => {
		const watcher = watch(
			dir,
			{ recursive: true, signal: abortController.signal },
			(_event, filename) => {
				if (!filename) return;
				const ext = nodePath.extname(filename);
				if (!RELEVANT_EXTENSIONS.has(ext)) return;
				triggerRebuild();
			},
		);

		watcher.on("error", (error: unknown) => {
			if (error instanceof Error && error.name === "AbortError") {
				return;
			}
			console.error("Watch error:", error);
		});

		return watcher;
	});

	console.log("Watching for changes...");

	return () => {
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}
		abortController.abort();
		for (const watcher of watchers) {
			watcher.close();
		}
	};
}

export { watchAndRebuild, uniqueDirs };
