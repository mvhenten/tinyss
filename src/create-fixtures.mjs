import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import nodePath from "node:path";

export const makeTempDir = () => mkdtemp(nodePath.join(tmpdir(), "tinyss"));

export const createFile = async (base, fileName, contents) => {
	const target = nodePath.join(base, fileName);
	const { dir } = nodePath.parse(target);
	await mkdir(dir, { recursive: true });
	await writeFile(target, contents ?? "");

	return target;
};

export const createFixtures = async (files) => {
	const base = await mkdtemp(nodePath.join(tmpdir(), "tinyss"));

	const data = {
		yaml: "---\nkey: value\ntitle: test title",
		md: "## Some markdown\nexample *markdown*",
	};

	for (const file of files) {
		const { ext } = nodePath.parse(file);
		await createFile(base, file, data[ext.substring(1)]);
	}

	const list = await readdir(base, { recursive: true });
	const cleanup = () => rm(base, { recursive: true });
	const paths = list.map((path) => nodePath.join(base, path));

	return { paths, cleanup, base };
};
