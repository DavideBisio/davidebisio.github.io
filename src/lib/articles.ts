import type { CollectionEntry } from 'astro:content';

export function articleSlug(article: CollectionEntry<'articles'>): string {
  return article.id.replace(/^(hobby|professional)\//, '');
}
