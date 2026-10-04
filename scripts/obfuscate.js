// Builds an obfuscated copy of the game into dist/.
// Run with: npm run build
const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");

const SRC = path.join(__dirname, "..", "src");
const DIST = path.join(__dirname, "..", "dist");

// Functions referenced from inline onclick handlers in index.html —
// these names must survive obfuscation.
const reservedNames = [
    "toggleMenu",
    "upgradeDimension",
    "buyAutoPlacer",
    "buyAutoSpeed",
    "buyPrestigeUpgrade",
    "executePrestigeReset",
    "resetSave",
];

function obfuscateFile(filePath, outPath) {
    const code = fs.readFileSync(filePath, "utf8");
    const result = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        stringArray: true,
        stringArrayEncoding: ["base64"],
        stringArrayRotate: true,
        stringArrayShuffle: true,
        simplify: true,
        renameGlobals: false, // classic scripts share globals across files
        reservedNames,
        selfDefending: true,
        deadCodeInjection: false, // keep game loop fast
        controlFlowFlattening: false, // keep game loop fast
    });
    fs.writeFileSync(outPath, result.getObfuscatedCode());
    console.log(`obfuscated ${path.relative(SRC, filePath)}`);
}

function copyFile(filePath, outPath) {
    fs.copyFileSync(filePath, outPath);
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, "js"), { recursive: true });

for (const file of fs.readdirSync(path.join(SRC, "js"))) {
    if (file.endsWith(".js")) {
        obfuscateFile(path.join(SRC, "js", file), path.join(DIST, "js", file));
    }
}

copyFile(path.join(SRC, "index.html"), path.join(DIST, "index.html"));
copyFile(path.join(SRC, "styles.css"), path.join(DIST, "styles.css"));

// Copy static assets (music, images, ...) as-is.
const assetsDir = path.join(SRC, "assets");
if (fs.existsSync(assetsDir)) {
    fs.cpSync(assetsDir, path.join(DIST, "assets"), { recursive: true });
}

console.log("Build complete -> dist/");
