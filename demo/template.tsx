import type { VNode } from "preact";
import type { TemplateProps } from "../src/core/types.ts";

export default function DemoTemplate({
	title,
	body,
	config,
}: TemplateProps): VNode {
	return (
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<title>{config.title as string}</title>
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				<link rel="stylesheet" href="style.css" />
			</head>
			<body>
				<div class="flex-cols">
					<div class="flex-shrink">
						<ul class="content-nav">
							<li>
								<a href="/">Home</a>
							</li>
							<li>
								<a href="/about">About</a>
							</li>
							<li>
								<a href="/docs">Documentation</a>
							</li>
						</ul>
					</div>
					<div class="flex-grow">
						<div class="content-body">
							<div dangerouslySetInnerHTML={{ __html: body }} />
						</div>
					</div>
				</div>
			</body>
		</html>
	);
}
