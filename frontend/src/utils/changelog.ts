import changelogSource from "../../CHANGELOG.md?raw";

const VERSION_HEADING = /^## (v\S+)\s*$/gm;

const parseVersions = (): { version: string; index: number }[] => {
  const matches: { version: string; index: number }[] = [];
  for (const m of changelogSource.matchAll(VERSION_HEADING)) {
    matches.push({ version: m[1], index: m.index ?? 0 });
  }
  return matches;
};

const versions = parseVersions();

export const latestVersion: string | undefined = versions[0]?.version;

/**
 * Returns the markdown slice covering entries newer than `sinceVersion`. If
 * `sinceVersion` is not found (or not provided), returns all entries. The
 * returned slice starts at the first version heading, omitting any top-level
 * "Changelog" heading.
 */
export const entriesSince = (sinceVersion: string | undefined): string => {
  if (versions.length === 0) return "";
  const match = versions.find(v => v.version === sinceVersion);
  const end = match ? match.index : changelogSource.length;
  return changelogSource.slice(versions[0].index, end).trimEnd();
};

export { changelogSource };
