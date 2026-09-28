// Day `notes` are a plain frontmatter string (not a rendered markdown file),
// so they get a minimal, dependency-free formatter instead of full markdown:
// blank lines start a new paragraph, and `[text](url)` becomes a link.
// Everything else is escaped as plain text.

const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)"'<>]+)\)/g;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderNotesHtml(notes: string): string {
  return notes
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const html = escapeHtml(p).replace(
        LINK_RE,
        (_match, text: string, url: string) =>
          `<a href="${url}" class="text-sky-600 underline hover:no-underline dark:text-sky-400">${text}</a>`,
      );
      return `<p>${html}</p>`;
    })
    .join('\n');
}
