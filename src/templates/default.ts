import { type VNode, h } from "preact";
import type { TemplateProps } from "../core/types.ts";

export default function DefaultTemplate({ title, body }: TemplateProps): VNode {
	return h(
		"html",
		{ lang: "en" },
		h(
			"head",
			null,
			h("meta", { charset: "utf-8" }),
			h("title", null, title),
			h("meta", {
				name: "viewport",
				content: "width=device-width,initial-scale=1",
			}),
		),
		h("body", null, h("div", { dangerouslySetInnerHTML: { __html: body } })),
	);
}
