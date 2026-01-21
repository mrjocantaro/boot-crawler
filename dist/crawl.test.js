"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const crawl_1 = require("./crawl");
(0, vitest_1.describe)("extractPageData", () => {
    (0, vitest_1.it)("basic extraction", () => {
        const inputURL = "https://blog.boot.dev";
        const inputBody = `
      <html><body>
        <h1>Test Title</h1>
        <p>This is the first paragraph.</p>
        <a href="/link1">Link 1</a>
        <img src="/image1.jpg" alt="Image 1">
      </body></html>
    `;
        const actual = (0, crawl_1.extractPageData)(inputBody, inputURL);
        const expected = {
            url: "https://blog.boot.dev",
            h1: "Test Title",
            first_paragraph: "This is the first paragraph.",
            outgoing_links: ["https://blog.boot.dev/link1"],
            image_urls: ["https://blog.boot.dev/image1.jpg"],
        };
        (0, vitest_1.expect)(actual).toEqual(expected);
    });
    (0, vitest_1.it)("handles missing h1, p, links, and images", () => {
        const inputURL = "https://example.com";
        const inputBody = `<html><body><div>No relevant content</div></body></html>`;
        const actual = (0, crawl_1.extractPageData)(inputBody, inputURL);
        const expected = {
            url: "https://example.com",
            h1: "",
            first_paragraph: "",
            outgoing_links: [],
            image_urls: [],
        };
        (0, vitest_1.expect)(actual).toEqual(expected);
    });
    (0, vitest_1.it)("handles multiple links and images", () => {
        const inputURL = "https://example.com";
        const inputBody = `
      <html><body>
        <h1>Title</h1>
        <p>First paragraph</p>
        <a href="/link1">Link 1</a>
        <a href="/link2">Link 2</a>
        <img src="/image1.png">
        <img src="/image2.png">
      </body></html>
    `;
        const actual = (0, crawl_1.extractPageData)(inputBody, inputURL);
        const expected = {
            url: "https://example.com",
            h1: "Title",
            first_paragraph: "First paragraph",
            outgoing_links: ["https://example.com/link1", "https://example.com/link2"],
            image_urls: ["https://example.com/image1.png", "https://example.com/image2.png"],
        };
        (0, vitest_1.expect)(actual).toEqual(expected);
    });
});
