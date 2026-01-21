import pLimit from "p-limit";
import { JSDOM } from "jsdom";

/* =========================
   TYPES
========================= */
export interface ExtractedPageData {
  url: string;
  h1: string;
  first_paragraph: string;
  outgoing_links: string[];
  image_urls: string[];
}

/* =========================
   HELPERS
========================= */
export function normalizeURL(url: string): string {
  const u = new URL(url);
  let pathname = u.pathname;
  if (pathname.endsWith("/")) pathname = pathname.slice(0, -1);
  return `${u.hostname}${pathname}`;
}

export function getH1FromHTML(html: string): string {
  const dom = new JSDOM(html);
  const h1 = dom.window.document.querySelector("h1");
  return h1?.textContent?.trim() || "";
}

export function getFirstParagraphFromHTML(html: string): string {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const main = doc.querySelector("main");
  const p = main ? main.querySelector("p") : doc.querySelector("p");
  return p?.textContent?.trim() || "";
}

export function getURLsFromHTML(html: string, baseURL: string): string[] {
  const dom = new JSDOM(html);
  const links = dom.window.document.querySelectorAll("a");
  const urls: string[] = [];

  for (const link of links) {
    const href = link.getAttribute("href");
    if (!href) continue;
    try {
      urls.push(new URL(href, baseURL).href);
    } catch {}
  }

  return urls;
}

export function getImagesFromHTML(html: string, baseURL: string): string[] {
  const dom = new JSDOM(html);
  const images = dom.window.document.querySelectorAll("img");
  const urls: string[] = [];

  for (const img of images) {
    const src = img.getAttribute("src");
    if (!src) continue;
    try {
      urls.push(new URL(src, baseURL).href);
    } catch {}
  }

  return urls;
}

export function extractPageData(
  html: string,
  pageURL: string,
): ExtractedPageData {
  return {
    url: pageURL,
    h1: getH1FromHTML(html),
    first_paragraph: getFirstParagraphFromHTML(html),
    outgoing_links: getURLsFromHTML(html, pageURL),
    image_urls: getImagesFromHTML(html, pageURL),
  };
}

/* =========================
   CONCURRENT CRAWLER
========================= */
export class ConcurrentCrawler {
  private baseURL: string;
  private pages: Record<string, ExtractedPageData>;
  private limit: <T>(fn: () => Promise<T>) => Promise<T>;
  private maxPages: number;
  private shouldStop: boolean;
  private allTasks: Set<Promise<void>>;
  private abortController: AbortController;

  constructor(baseURL: string, maxConcurrency: number, maxPages: number) {
    this.baseURL = baseURL;
    this.pages = {};
    this.limit = pLimit(maxConcurrency);
    this.maxPages = maxPages;
    this.shouldStop = false;
    this.allTasks = new Set();
    this.abortController = new AbortController();
  }

  private addPageVisit(normalizedURL: string): boolean {
    if (this.shouldStop) return false;
    if (this.pages[normalizedURL]) return false;

    if (Object.keys(this.pages).length >= this.maxPages) {
      this.shouldStop = true;
      console.log("Reached maximum number of pages to crawl.");
      this.abortController.abort();
      return false;
    }

    return true;
  }

  private async getHTML(currentURL: string): Promise<string> {
    return this.limit(async () => {
      const res = await fetch(currentURL, {
        headers: { "User-Agent": "BootCrawler/1.0" },
        signal: this.abortController.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        throw new Error("Not HTML");
      }

      return await res.text();
    });
  }

  private async crawlPage(currentURL: string): Promise<void> {
    if (this.shouldStop) return;

    const base = new URL(this.baseURL);
    const current = new URL(currentURL);
    if (base.hostname !== current.hostname) return;

    const normalizedURL = normalizeURL(currentURL);
    if (!this.addPageVisit(normalizedURL)) return;

    console.log(`Crawling: ${currentURL}`);

    let html: string;
    try {
      html = await this.getHTML(currentURL);
    } catch {
      return;
    }

    const pageData = extractPageData(html, currentURL);
    this.pages[normalizedURL] = pageData;

    const urls = pageData.outgoing_links;

    for (const url of urls) {
      if (this.shouldStop) break;
      const task = this.crawlPage(url).finally(() =>
        this.allTasks.delete(task),
      );
      this.allTasks.add(task);
    }
  }

  public async crawl(): Promise<Record<string, ExtractedPageData>> {
    const rootTask = this.crawlPage(this.baseURL);
    this.allTasks.add(rootTask);
    await Promise.all(this.allTasks);
    return this.pages;
  }
}

/* =========================
   PUBLIC API
========================= */
export async function crawlSiteAsync(
  baseURL: string,
  maxConcurrency: number,
  maxPages: number,
): Promise<Record<string, ExtractedPageData>> {
  const crawler = new ConcurrentCrawler(baseURL, maxConcurrency, maxPages);
  return crawler.crawl();
}
