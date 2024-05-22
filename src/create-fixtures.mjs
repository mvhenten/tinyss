import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import nodePath from "node:path";

export const createFixtures = async (files) => {
	const base = await mkdtemp(nodePath.join(tmpdir(), "tinyss"));

	const data = {
		md: "## Some markdown\nexample *markdown*",
	};

	for (const file of files) {
		const { ext, dir, name } = nodePath.parse(file);
		await mkdir(nodePath.join(base, dir), { recursive: true });
		await writeFile(nodePath.join(base, file), data[ext] ?? "");
	}

	const list = await readdir(base, { recursive: true });
	const cleanup = () => rm(base, { recursive: true });

	const paths = list.map((path) => nodePath.join(base, path));

	return { paths, cleanup };
};
