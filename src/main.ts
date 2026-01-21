import { crawlSiteAsync } from "./crawl";
import { writeCSVReport } from "./report";

async function main() {
  const args = process.argv.slice(2);

  if (args.length !== 3) {
    console.error("Usage: npm run start <URL> <maxConcurrency> <maxPages>");
    process.exit(1);
  }

  const [url, concurrencyStr, maxPagesStr] = args;
  const maxConcurrency = Number(concurrencyStr);
  const maxPages = Number(maxPagesStr);

  if (!maxConcurrency || !maxPages) {
    console.error("maxConcurrency and maxPages must be numbers");
    process.exit(1);
  }

  console.log(`Starting crawl at ${url}`);
  const pageData = await crawlSiteAsync(url, maxConcurrency, maxPages);
  writeCSVReport(pageData);
  console.log("report.csv written");
}

main();
