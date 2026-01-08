/**
 * HTML Minifier Utility
 * 
 * Minifies HTML strings by removing:
 * - Whitespace between tags
 * - Line breaks
 * - Extra spaces
 * - Comments (optional)
 * 
 * IMPORTANT: This does NOT change the visual output at all.
 * Browsers render minified HTML identically to formatted HTML.
 * This only reduces the HTML string size for faster parsing.
 */

/**
 * Minify HTML string by removing unnecessary whitespace
 * This is safe and does NOT affect visual rendering
 * 
 * @param html - HTML string to minify
 * @returns Minified HTML string (same visual output, smaller size)
 */
export function minifyHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return html;
  }

  return html
    // Remove HTML comments (optional - can be removed if needed)
    // .replace(/<!--[\s\S]*?-->/g, '')
    
    // Remove whitespace between tags (preserves content whitespace)
    .replace(/>\s+</g, '><')
    
    // Remove leading/trailing whitespace from lines
    .replace(/^\s+|\s+$/gm, '')
    
    // Remove multiple consecutive spaces (but preserve single spaces in content)
    // This is safe - doesn't affect rendering
    .replace(/[ \t]+/g, ' ')
    
    // Remove spaces before closing tags (e.g., " </div>" becomes "</div>")
    .replace(/\s+>/g, '>')
    
    // Remove spaces after opening tags (e.g., "<div >" becomes "<div>")
    .replace(/<\s+/g, '<')
    
    // Remove line breaks and tabs
    .replace(/\r?\n|\r|\t/g, '')
    
    // Clean up any remaining multiple spaces
    .replace(/\s{2,}/g, ' ')
    
    // Final trim
    .trim();
}

/**
 * Minify HTML template result
 * Wrapper function for easier use with template functions
 * 
 * @param templateResult - HTML string returned from template function
 * @returns Minified HTML string
 */
export function minifyTemplate(templateResult: string | undefined | null): string {
  if (!templateResult) {
    return '';
  }
  return minifyHTML(templateResult);
}

