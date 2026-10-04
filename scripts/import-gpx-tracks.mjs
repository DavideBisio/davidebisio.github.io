// Imports raw Garmin Connect exports (`activity_<id>.gpx`) dropped into a trip's
// content folder: matches each one to a trip day by date, renames it in kebab
// case after that day's activity, strips Garmin-specific extras, and writes it
// into the trip's `gpx/` folder, where the site auto-discovers it and matches
// it back to the same day by its own embedded date at build time.
//
// Usage: node scripts/import-gpx-tracks.mjs <trip-slug-or-dir>

import { readdirSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const RAW_NAME_RE = /^activity_\d+\.gpx$/i;
const TRACK_KEYWORDS = [
  'hike', 'hiking', 'hikes', 'trek', 'trekking', 'walk', 'walking', 'run', 'running',
  'trail', 'climb', 'climbing', 'cycle', 'cycling', 'bike', 'biking', 'ride', 'riding',
  'kayak', 'kayaking', 'canoe', 'canoeing', 'ski', 'skiing', 'swim', 'swimming',
];
const TRACK_KEYWORD_RE = new RegExp(`\\b(?:${TRACK_KEYWORDS.join('|')})\\b`, 'i');
const META_TIME_RE = /<time>([^<]+)<\/time>/;
const GPX_OPEN_RE = /<gpx\b[^>]*>/s;
const METADATA_RE = /<metadata>.*?<\/metadata>/s;
const TRK_HEAD_RE = /<trk>.*?<trkseg>/s;
const EXTENSIONS_RE = /\s*<extensions>.*?<\/extensions>/gs;

function kebabCase(text) {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '.gpx'
  );
}

// Picks which of a day's activities the N raw GPX files belong to. Prefers the
// activities that read as a tracked outdoor activity (hike/run/ride/...); falls
// back to positional (first N) when that isn't unambiguous, since GPX files are
// sorted by filename, which for Garmin exports means recording order.
function matchActivities(activities, fileCount) {
  const candidates = activities.map((_, i) => i).filter((i) => TRACK_KEYWORD_RE.test(activities[i]));
  if (candidates.length === fileCount) return { indices: candidates, matchedByKeyword: true };
  if (fileCount === 1 && candidates.length > 1) {
    throw new Error(
      `ambiguous: multiple activities look like tracked activities (${candidates.map((i) => JSON.stringify(activities[i])).join(', ')}) but only 1 GPX file — reword the activities to disambiguate`,
    );
  }
  return { indices: Array.from({ length: fileCount }, (_, i) => i), matchedByKeyword: false };
}

function cleanGpx(xml, trackName) {
  xml = xml.replace(/^﻿/, '');
  const metaTimeMatch = META_TIME_RE.exec(xml);
  if (!metaTimeMatch) throw new Error('no <time> found in GPX metadata');
  const metaTime = metaTimeMatch[1];

  xml = xml.replace(
    GPX_OPEN_RE,
    '<gpx creator="sardegna-trek" version="1.1"\n' +
      '  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/11.xsd"\n' +
      '  xmlns="http://www.topografix.com/GPX/1/1"\n' +
      '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">',
  );
  xml = xml.replace(METADATA_RE, `<metadata>\n    <time>${metaTime}</time>\n  </metadata>`);
  xml = xml.replace(TRK_HEAD_RE, `<trk>\n    <name>${trackName}</name>\n    <trkseg>`);
  xml = xml.replace(EXTENSIONS_RE, '');
  return xml;
}

// Parses the `days:` frontmatter array by splitting on `  - date: ` list-item
// lines, without depending on a full YAML parser. Read-only: naming is the
// only thing this script needs from the markdown, since matching a cleaned
// file back to its day happens by date at build time, not by editing frontmatter.
function parseDays(lines, daysStart, daysEnd) {
  const days = [];
  for (let i = daysStart; i < daysEnd; i++) {
    const dateMatch = /^ {2}- date: (\S+)/.exec(lines[i]);
    if (!dateMatch) continue;
    const end = lines.slice(i + 1, daysEnd).findIndex((l) => /^ {2}- date: /.test(l));
    const blockEnd = end === -1 ? daysEnd : i + 1 + end;

    let activities = [];
    for (let j = i; j < blockEnd; j++) {
      const activitiesMatch = /^ {4}activities: (\[.*\])/.exec(lines[j]);
      if (activitiesMatch) activities = JSON.parse(activitiesMatch[1]);
    }
    days.push({ date: dateMatch[1], activities });
  }
  return days;
}

function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: node scripts/import-gpx-tracks.mjs <trip-slug-or-dir>');
    process.exit(1);
  }
  const tripDir = arg.includes('/') || path.isAbsolute(arg) ? path.resolve(arg) : path.resolve('src/content/trips', arg);
  const slug = path.basename(tripDir);
  const mdPath = path.join(tripDir, `${slug}.md`);
  const gpxDir = path.join(tripDir, 'gpx');

  const rawFiles = readdirSync(tripDir).filter((f) => RAW_NAME_RE.test(f));
  if (rawFiles.length === 0) {
    console.log('No raw activity_*.gpx files to import.');
    return;
  }

  // Each raw file's date (from its GPX metadata) to the trip day it belongs to.
  const byDate = new Map();
  for (const file of rawFiles) {
    const xml = readFileSync(path.join(tripDir, file), 'utf-8');
    const metaTimeMatch = META_TIME_RE.exec(xml);
    if (!metaTimeMatch) throw new Error(`${file}: no <time> found in GPX metadata`);
    const date = metaTimeMatch[1].slice(0, 10);
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push(file);
  }
  for (const files of byDate.values()) files.sort();

  const content = readFileSync(mdPath, 'utf-8');
  const lines = content.split('\n');
  const daysKeyIndex = lines.findIndex((l) => l === 'days:');
  if (daysKeyIndex === -1) throw new Error(`${mdPath}: no "days:" key found`);
  const frontmatterEnd = lines.indexOf('---', daysKeyIndex);
  if (frontmatterEnd === -1) throw new Error(`${mdPath}: no closing "---" found`);
  const days = parseDays(lines, daysKeyIndex + 1, frontmatterEnd);

  mkdirSync(gpxDir, { recursive: true });

  for (const [date, files] of byDate) {
    const day = days.find((d) => d.date === date);
    if (!day) throw new Error(`no trip day dated ${date} for ${files.join(', ')}`);
    if (files.length > day.activities.length) {
      throw new Error(
        `${date}: ${files.length} GPX file(s) but only ${day.activities.length} activities listed`,
      );
    }

    const { indices, matchedByKeyword } = matchActivities(day.activities, files.length);
    if (!matchedByKeyword) {
      console.warn(
        `${date}: no unambiguous keyword match, falling back to positional order (first ${files.length} of ${day.activities.length} activities)`,
      );
    }

    files.forEach((file, i) => {
      const activityName = day.activities[indices[i]];
      const targetName = kebabCase(activityName);
      const raw = readFileSync(path.join(tripDir, file), 'utf-8');
      const cleaned = cleanGpx(raw, activityName);
      writeFileSync(path.join(gpxDir, targetName), cleaned, 'utf-8');
      unlinkSync(path.join(tripDir, file));
      console.log(`${date}: ${file} -> gpx/${targetName}  (name=${JSON.stringify(activityName)})`);
    });
  }
}

main();
