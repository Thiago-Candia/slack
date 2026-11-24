// Formato de mensajes: *negrita*, _cursiva_, `código`, [texto](https://url) y listas con "- ".
// El servidor guarda el texto tal cual; solo se interpreta al mostrarlo.

const INLINE =
  /`([^`\n]+)`|\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|(?<![\w*])\*([^*\n]+)\*(?![\w*])|(?<![\w_])_([^_\n]+)_(?![\w_])/g;
const LIST_ITEM = /^- (.*)$/;
const WRAPPERS = { bold: "*", italic: "_", code: "`" };

export const parseInline = (text) => {
  const nodes = [];
  let last = 0;

  for (const match of text.matchAll(INLINE)) {
    const [whole, code, label, href, bold, italic] = match;

    if (match.index > last) nodes.push({ type: "text", value: text.slice(last, match.index) });

    if (code !== undefined) nodes.push({ type: "code", value: code });
    else if (href !== undefined) nodes.push({ type: "link", href, label });
    else if (bold !== undefined) nodes.push({ type: "bold", children: parseInline(bold) });
    else nodes.push({ type: "italic", children: parseInline(italic) });

    last = match.index + whole.length;
  }

  if (last < text.length) nodes.push({ type: "text", value: text.slice(last) });

  return nodes;
};

export const parseMessage = (text) => {
  const blocks = [];
  let paragraph = [];

  const flushParagraph = () => {
    const text = paragraph.join("\n");
    paragraph = [];

    if (text.trim() !== "") blocks.push({ type: "paragraph", children: parseInline(text) });
  };

  for (const line of String(text ?? "").split(/\r?\n/)) {
    const item = line.match(LIST_ITEM);

    if (!item) {
      paragraph.push(line);
      continue;
    }

    flushParagraph();
    const previous = blocks.at(-1);

    if (previous?.type === "list") previous.items.push(parseInline(item[1]));
    else blocks.push({ type: "list", items: [parseInline(item[1])] });
  }

  flushParagraph();

  return blocks;
};

// Devuelve el texto nuevo y la selección que debe quedar en el textarea.
export const applyFormat = (kind, value, start, end) => {
  const selected = value.slice(start, end);

  if (kind in WRAPPERS) {
    const mark = WRAPPERS[kind];

    return {
      value: value.slice(0, start) + mark + selected + mark + value.slice(end),
      start: start + mark.length,
      end: end + mark.length
    };
  }

  if (kind === "link") {
    const label = selected || "texto";
    const url = "https://";
    const urlStart = start + label.length + 3;

    return {
      value: `${value.slice(0, start)}[${label}](${url})${value.slice(end)}`,
      start: urlStart,
      end: urlStart + url.length
    };
  }

  if (kind === "list") {
    const lineStart = start === 0 ? 0 : value.lastIndexOf("\n", start - 1) + 1;
    const nextBreak = value.indexOf("\n", end);
    const lineEnd = nextBreak === -1 ? value.length : nextBreak;
    const lines = value.slice(lineStart, lineEnd).split("\n");
    const allListed = lines.every((line) => line.startsWith("- "));
    const block = lines.map((line) => (allListed ? line.slice(2) : line.startsWith("- ") ? line : `- ${line}`)).join("\n");

    return {
      value: value.slice(0, lineStart) + block + value.slice(lineEnd),
      start: lineStart,
      end: lineStart + block.length
    };
  }

  return { value, start, end };
};
