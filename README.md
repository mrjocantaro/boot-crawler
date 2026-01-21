# Concurrent Web Crawler (TypeScript)

A concurrent web crawler built with Node.js and TypeScript.  
It crawls a website starting from a base URL, extracts structured page data, and exports the results to a CSV report.

## Features

- Concurrent crawling with configurable limits
- URL normalization to avoid duplicate crawling
- Extracts:
  - Page URL
  - H1 title
  - First paragraph
  - Outgoing links
  - Image URLs
- CSV report generation
- Safe crawling with max page limits and request aborting

## Requirements

- Node.js 18+
- npm

## Installation

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git
cd YOUR-REPO
npm install
