// import PrismJS from 'prismjs';
import PrismJS from './prism.js';

export const highlight = (source: string) => {
  const highlighted = PrismJS.highlight(source, PrismJS.languages.html, 'html');
  return `<pre><code>${highlighted}</code></pre>`;
}




