export const MORE_MARKER = "<!-- more -->";

const OWN_LINE_MARKER = /^[ \t]*<!-- more -->[ \t]*\r?\n?/gm;
const INLINE_MARKER = /[ \t]*<!-- more -->[ \t]*/g;

export function stripMoreMarker(content: string): string {
	return content.replace(OWN_LINE_MARKER, "").replace(INLINE_MARKER, " ");
}
