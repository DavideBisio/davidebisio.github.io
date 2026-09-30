// Imports raw Garmin Connect exports (`activity_<id>.gpx`) dropped into a trip's
// content folder: matches each one to a trip day by date, renames it in kebab
// case after that day's activity, strips Garmin-specific extras, and wires it
// into the trip's `gpx:` frontmatter.
//
// Usage: node scripts/import-gpx-tracks.mjs <trip-slug-or-dir>

import { readdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
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
// lines, without depending on a full YAML parser.
function parseDays(lines, daysStart, daysEnd) {
  const days = [];
  for (let i = daysStart; i < daysEnd; i++) {
    const dateMatch = /^ {2}- date: (\S+)/.exec(lines[i]);
    if (!dateMatch) continue;
    const end = lines.slice(i + 1, daysEnd).findIndex((l) => /^ {2}- date: /.test(l));
    const blockEnd = end === -1 ? daysEnd : i + 1 + end;

    let activities = [];
    let gpxStart = -1;
    let gpxEnd = -1;
    for (let j = i; j < blockEnd; j++) {
      const activitiesMatch = /^ {4}activities: (\[.*\])/.exec(lines[j]);
      if (activitiesMatch) activities = JSON.parse(activitiesMatch[1]);
      if (/^ {4}gpx:$/.test(lines[j])) {
        gpxStart = j;
        gpxEnd = j + 1;
        while (gpxEnd < blockEnd && /^ {6}- /.test(lines[gpxEnd])) gpxEnd++;
      }
    }
    days.push({ date: dateMatch[1], start: i, end: blockEnd, activities, gpxStart, gpxEnd });
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

  const edits = []; // { start, end, gpxLines }
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

    const gpxFilenames = [];
    files.forEach((file, i) => {
      const activityName = day.activities[indices[i]];
      const targetName = kebabCase(activityName);
      const raw = readFileSync(path.join(tripDir, file), 'utf-8');
      const cleaned = cleanGpx(raw, activityName);
      writeFileSync(path.join(tripDir, targetName), cleaned, 'utf-8');
      unlinkSync(path.join(tripDir, file));
      gpxFilenames.push(targetName);
      console.log(`${date}: ${file} -> ${targetName}  (name=${JSON.stringify(activityName)})`);
    });

    edits.push({
      gpxStart: day.gpxStart,
      gpxEnd: day.gpxEnd,
      insertAfter: day.gpxStart === -1 ? lines.slice(day.start, day.end).findIndex((l) => /^ {4}activities: /.test(l)) + day.start : null,
      gpxLines: ['    gpx:', ...gpxFilenames.map((f) => `      - "./${f}"`)],
    });
  }

  // Apply edits bottom-to-top so earlier line indices stay valid.
  edits.sort((a, b) => (b.gpxStart !== -1 ? b.gpxStart : b.insertAfter) - (a.gpxStart !== -1 ? a.gpxStart : a.insertAfter));
  for (const edit of edits) {
    if (edit.gpxStart !== -1) {
      lines.splice(edit.gpxStart, edit.gpxEnd - edit.gpxStart, ...edit.gpxLines);
    } else {
      lines.splice(edit.insertAfter + 1, 0, ...edit.gpxLines);
    }
  }

  writeFileSync(mdPath, lines.join('\n'), 'utf-8');
  console.log(`Updated ${mdPath}`);
}

main();
