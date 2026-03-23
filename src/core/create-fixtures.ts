import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import nodePath from "node:path";

export const makeTempDir = (): Promise<string> =>
	mkdtemp(nodePath.join(tmpdir(), "tinyss"));

export const createFile = async (
	base: string,
	fileName: string,
	contents?: string,
): Promise<string> => {
	const target = nodePath.join(base, fileName);
	const { dir } = nodePath.parse(target);
	await mkdir(dir, { recursive: true });
	await writeFile(target, contents ?? "");

	return target;
};

interface FixtureResult {
	paths: string[];
	cleanup: () => Promise<void>;
	base: string;
}

const fixtureData: Record<string, string> = {
	yaml: "---\nkey: value\ntitle: test title",
	md: "## Some markdown\nexample *markdown*",
};

export const createFixtures = async (
	files: string[],
): Promise<FixtureResult> => {
	const base = await mkdtemp(nodePath.join(tmpdir(), "tinyss"));

	for (const file of files) {
		const { ext } = nodePath.parse(file);
		await createFile(base, file, fixtureData[ext.substring(1)]);
	}

	const list = await readdir(base, { recursive: true });
	const cleanup = (): Promise<void> => rm(base, { recursive: true });
	const paths = list.map((path) => nodePath.join(base, path));

	return { paths, cleanup, base };
};
