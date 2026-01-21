"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeCSVReport = writeCSVReport;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
function csvEscape(field) {
    const str = field ?? "";
    const needsQuoting = /[",\n]/.test(str);
    const escaped = str.replace(/"/g, '""');
    return needsQuoting ? `"${escaped}"` : escaped;
}
function writeCSVReport(pageData, filename = "report.csv") {
    const headers = [
        "page_url",
        "h1",
        "first_paragraph",
        "outgoing_link_urls",
        "image_urls",
    ];
    const rows = [headers.join(",")];
    for (const page of Object.values(pageData)) {
        rows.push([
            csvEscape(page.url),
            csvEscape(page.h1),
            csvEscape(page.first_paragraph),
            csvEscape(page.outgoing_links.join(";")),
            csvEscape(page.image_urls.join(";")),
        ].join(","));
    }
    const outputPath = path.resolve(process.cwd(), filename);
    fs.writeFileSync(outputPath, rows.join("\n"), "utf-8");
}
