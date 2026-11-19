// The shape a stored page is allowed to have. save.js used to store the client's
// `data` object wholesale, which made every renderer responsible for distrusting
// every field — and the homepage wall forgot one (emoji went straight into
// innerHTML: stored XSS on the most-visited page, able to read every visitor's edit
// tokens and the admin token out of localStorage). Whitelisting here means a field a
// renderer forgets to escape is still only ever plain, short text.

// keep in sync with STATUS_ORDER in assets/core.js
export const STATUS_KEYS = ["ramen", "rent", "laidoff", "crypto", "student", "startup", "freelance", "pet"];

const MAX_NAME = 40;    // mirrors the editor's maxlength
const MAX_STORY = 240;
const MAX_EMOJI = 16;   // UTF-16 units — room for ZWJ sequences / skin tones
const MAX_TITLE = 120;
const MAX_DESC = 300;

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// An emoji is never ASCII (ZWJ, variation selectors and skin tones aren't either),
// so "no ASCII at all" admits every real emoji and rejects every bit of markup.
export function cleanEmoji(v) {
  const s = str(v, MAX_EMOJI);
  return s && /^[^\x00-\x7F]+$/.test(s) ? s : "";
}

// Page data minus `links` (sanitizeLinks owns those) and `av` (server-owned).
// Unknown fields are dropped.
export function cleanPage(d) {
  const out = {
    name: str(d.name, MAX_NAME),
    handle: str(d.handle, 40),
    status: STATUS_KEYS.includes(d.status) ? d.status : "ramen",
    story: str(d.story, MAX_STORY),
    links: d.links,
  };
  const emoji = cleanEmoji(d.emoji);
  if (emoji) out.emoji = emoji;
  return out;
}

// Social-preview text. The client builds it (it's localized), but it's what strangers
// see in the X/Telegram card, so it gets the same caps and content rules as the page.
export function cleanMeta(m) {
  m = (m && typeof m === "object") ? m : {};
  const out = {};
  const title = str(m.title, MAX_TITLE), desc = str(m.desc, MAX_DESC);
  if (title) out.title = title;
  if (desc) out.desc = desc;
  return out;
}
