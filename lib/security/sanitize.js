const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const EVENT_HANDLER_REGEX = /\son\w+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_PROTOCOL_REGEX = /javascript:/gi;
const DATA_HTML_PROTOCOL_REGEX = /data:text\/html/gi;

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeHtml(value = '') {
  return String(value)
    .replace(SCRIPT_TAG_REGEX, '')
    .replace(EVENT_HANDLER_REGEX, '')
    .replace(JAVASCRIPT_PROTOCOL_REGEX, '')
    .replace(DATA_HTML_PROTOCOL_REGEX, '');
}
