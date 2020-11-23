import PrismJS from 'prismjs';

export const highlight = (source: string) => {
  const highlighted = PrismJS.highlight(source, PrismJS.languages.html, 'html');
  return `<pre><code>${highlighted}</code></pre>`;
}