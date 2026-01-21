import * as fs from "node:fs";
import * as path from "node:path";
import { ExtractedPageData } from "./crawl";

function csvEscape(field: string) {
  const str = field ?? "";
  const needsQuoting = /[",\n]/.test(str);
  const escaped = str.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
}

export function writeCSVReport(
  pageData: Record<string, ExtractedPageData>,
  filename = "report.csv",
): void {
  const headers = [
    "page_url",
    "h1",
    "first_paragraph",
    "outgoing_link_urls",
    "image_urls",
  ];

  const rows: string[] = [headers.join(",")];

  for (const page of Object.values(pageData)) {
    rows.push(
      [
        csvEscape(page.url),
        csvEscape(page.h1),
        csvEscape(page.first_paragraph),
        csvEscape(page.outgoing_links.join(";")),
        csvEscape(page.image_urls.join(";")),
      ].join(","),
    );
  }

  const outputPath = path.resolve(process.cwd(), filename);
  fs.writeFileSync(outputPath, rows.join("\n"), "utf-8");
}
