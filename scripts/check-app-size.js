#!/usr/bin/env node
/**
 * check-app-size.js
 *
 * Sprawdza rozmiar zbudowanego pliku apki (.aab / .apk / .ipa) i loguje wynik
 * do build-size-log.csv w katalogu głównym repo, razem z datą i commitem git.
 *
 * Użycie:
 *   node scripts/check-app-size.js <ścieżka-do-pliku>
 *   node scripts/check-app-size.js                (spróbuje znaleźć plik automatycznie)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const LOG_FILE = path.join(process.cwd(), "build-size-log.csv");

const CANDIDATE_GLOBS = [
  "android/app/build/outputs/bundle/release/app-release.aab",
  "android/app/build/outputs/apk/release/app-release.apk",
  "ios/build/*.ipa",
];

function findFileAutomatically() {
  for (const candidate of CANDIDATE_GLOBS) {
    if (candidate.includes("*")) {
      const dir = path.dirname(candidate);
      const pattern = path.basename(candidate);
      if (fs.existsSync(dir)) {
        const regex = new RegExp("^" + pattern.replace("*", ".*") + "$");
        const match = fs.readdirSync(dir).find((f) => regex.test(f));
        if (match) return path.join(dir, match);
      }
    } else if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function getGitCommit() {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "brak-git";
  }
}

function formatSize(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

function inferPlatform(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".ipa") return "ios";
  if (ext === ".aab" || ext === ".apk") return "android";
  return "nieznana";
}

function main() {
  const argPath = process.argv[2];
  const filePath = argPath ? path.resolve(argPath) : findFileAutomatically();

  if (!filePath || !fs.existsSync(filePath)) {
    console.error(
      "Nie znaleziono pliku builda. Podaj ścieżkę ręcznie:\n" +
        "  node scripts/check-app-size.js <ścieżka-do-pliku.aab/.apk/.ipa>"
    );
    process.exit(1);
  }

  const stats = fs.statSync(filePath);
  const sizeMb = formatSize(stats.size);
  const platform = inferPlatform(filePath);
  const commit = getGitCommit();
  const date = new Date().toISOString();

  console.log(`Plik:      ${filePath}`);
  console.log(`Platforma: ${platform}`);
  console.log(`Rozmiar:   ${sizeMb} MB`);
  console.log(`Commit:    ${commit}`);

  const LIMIT_MB = 200;
  if (parseFloat(sizeMb) > LIMIT_MB) {
    console.warn(
      `\n⚠️  Uwaga: ${sizeMb} MB przekracza orientacyjny limit ${LIMIT_MB} MB dla pobierania ` +
        `po sieci komórkowej (Apple) / limitu bazowego modułu AAB (Google). ` +
        `To nie blokuje publikacji, ale warto sprawdzić realny rozmiar per-device w App Store Connect / Play Console.`
    );
  }

  const header = "date,commit,platform,file,size_mb\n";
  const row = `${date},${commit},${platform},"${filePath}",${sizeMb}\n`;

  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, header + row);
  } else {
    fs.appendFileSync(LOG_FILE, row);
  }

  console.log(`\nZapisano do ${LOG_FILE}`);
}

main();
