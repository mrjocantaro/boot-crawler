"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConcurrentCrawler = void 0;
exports.normalizeURL = normalizeURL;
exports.getH1FromHTML = getH1FromHTML;
exports.getFirstParagraphFromHTML = getFirstParagraphFromHTML;
exports.getURLsFromHTML = getURLsFromHTML;
exports.getImagesFromHTML = getImagesFromHTML;
exports.extractPageData = extractPageData;
exports.crawlSiteAsync = crawlSiteAsync;
const p_limit_1 = __importDefault(require("p-limit"));
const jsdom_1 = require("jsdom");
/* =========================
   HELPERS
========================= */
function normalizeURL(url) {
    const u = new URL(url);
    let pathname = u.pathname;
    if (pathname.endsWith("/"))
        pathname = pathname.slice(0, -1);
    return `${u.hostname}${pathname}`;
}
function getH1FromHTML(html) {
    const dom = new jsdom_1.JSDOM(html);
    const h1 = dom.window.document.querySelector("h1");
    return h1?.textContent?.trim() || "";
}
function getFirstParagraphFromHTML(html) {
    const dom = new jsdom_1.JSDOM(html);
    const doc = dom.window.document;
    const main = doc.querySelector("main");
    const p = main ? main.querySelector("p") : doc.querySelector("p");
    return p?.textContent?.trim() || "";
}
function getURLsFromHTML(html, baseURL) {
    const dom = new jsdom_1.JSDOM(html);
    const links = dom.window.document.querySelectorAll("a");
    const urls = [];
    for (const link of links) {
        const href = link.getAttribute("href");
        if (!href)
            continue;
        try {
            urls.push(new URL(href, baseURL).href);
        }
        catch { }
    }
    return urls;
}
function getImagesFromHTML(html, baseURL) {
    const dom = new jsdom_1.JSDOM(html);
    const images = dom.window.document.querySelectorAll("img");
    const urls = [];
    for (const img of images) {
        const src = img.getAttribute("src");
        if (!src)
            continue;
        try {
            urls.push(new URL(src, baseURL).href);
        }
        catch { }
    }
    return urls;
}
function extractPageData(html, pageURL) {
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
class ConcurrentCrawler {
    constructor(baseURL, maxConcurrency, maxPages) {
        this.baseURL = baseURL;
        this.pages = {};
        this.limit = (0, p_limit_1.default)(maxConcurrency);
        this.maxPages = maxPages;
        this.shouldStop = false;
        this.allTasks = new Set();
        this.abortController = new AbortController();
    }
    addPageVisit(normalizedURL) {
        if (this.shouldStop)
            return false;
        if (this.pages[normalizedURL])
            return false;
        if (Object.keys(this.pages).length >= this.maxPages) {
            this.shouldStop = true;
            console.log("Reached maximum number of pages to crawl.");
            this.abortController.abort();
            return false;
        }
        return true;
    }
    async getHTML(currentURL) {
        return this.limit(async () => {
            const res = await fetch(currentURL, {
                headers: { "User-Agent": "BootCrawler/1.0" },
                signal: this.abortController.signal,
            });
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            const contentType = res.headers.get("content-type") || "";
            if (!contentType.includes("text/html")) {
                throw new Error("Not HTML");
            }
            return await res.text();
        });
    }
    async crawlPage(currentURL) {
        if (this.shouldStop)
            return;
        const base = new URL(this.baseURL);
        const current = new URL(currentURL);
        if (base.hostname !== current.hostname)
            return;
        const normalizedURL = normalizeURL(currentURL);
        if (!this.addPageVisit(normalizedURL))
            return;
        console.log(`Crawling: ${currentURL}`);
        let html;
        try {
            html = await this.getHTML(currentURL);
        }
        catch {
            return;
        }
        const pageData = extractPageData(html, currentURL);
        this.pages[normalizedURL] = pageData;
        const urls = pageData.outgoing_links;
        for (const url of urls) {
            if (this.shouldStop)
                break;
            const task = this.crawlPage(url).finally(() => this.allTasks.delete(task));
            this.allTasks.add(task);
        }
    }
    async crawl() {
        const rootTask = this.crawlPage(this.baseURL);
        this.allTasks.add(rootTask);
        await Promise.all(this.allTasks);
        return this.pages;
    }
}
exports.ConcurrentCrawler = ConcurrentCrawler;
/* =========================
   PUBLIC API
========================= */
async function crawlSiteAsync(baseURL, maxConcurrency, maxPages) {
    const crawler = new ConcurrentCrawler(baseURL, maxConcurrency, maxPages);
    return crawler.crawl();
}
