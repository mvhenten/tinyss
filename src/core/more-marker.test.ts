import assert from "node:assert";
import test from "node:test";
import { MORE_MARKER, stripMoreMarker } from "./more-marker.ts";

test("stripMoreMarker removes a marker on its own line", () => {
	const content = "Paragraph one.\n\n<!-- more -->\n\nParagraph two.";
	const result = stripMoreMarker(content);

	assert(!result.includes(MORE_MARKER));
	assert(result.includes("Paragraph one."));
	assert(result.includes("Paragraph two."));
});

test("stripMoreMarker removes a marker in the middle of a paragraph", () => {
	const content = "Some text <!-- more --> continues right here.";
	const result = stripMoreMarker(content);

	assert(!result.includes(MORE_MARKER));
	assert.strictEqual(result, "Some text continues right here.");
});

test("stripMoreMarker leaves content without a marker unchanged", () => {
	const content = "Paragraph one.\n\nParagraph two.";
	assert.strictEqual(stripMoreMarker(content), content);
});

test("stripMoreMarker removes multiple markers", () => {
	const content = "<!-- more -->\nText <!-- more --> more text.";
	const result = stripMoreMarker(content);

	assert(!result.includes(MORE_MARKER));
});
