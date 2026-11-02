export default {
	branches: ["main"],
	repositoryUrl: "git+https://github.com/mvhenten/tinyss.git",
	plugins: [
		"@semantic-release/commit-analyzer",
		"@semantic-release/release-notes-generator",
		"@semantic-release/npm",
		"@semantic-release/github",
	],
};
