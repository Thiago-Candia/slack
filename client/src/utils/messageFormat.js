// Formato de mensajes: *negrita*, _cursiva_, `código`, [texto](https://url) y listas con "- ".
// El servidor guarda el texto tal cual; solo se interpreta al mostrarlo.

// Sin lookbehind: Safari anterior a 16.4 no lo soporta y el bundle fallaría al cargar.
// Las URL sueltas se capturan para dejarlas como texto y que sus "_" o "*" no se interpreten.
// Negrita y cursiva exigen que el contenido no empiece ni termine con espacio ("2 * 3 * 4" queda igual).
const INLINE =
  /`([^`\n]+)`|\[([^\]\n]+)\]\((https?:\/\/(?:[^\s()]|\([^\s()]*\))+)\)|(https?:\/\/\S+)|\*([^\s*](?:[^*\n]*[^\s*])?)\*(?![\w*])|_([^\s_](?:[^_\n]*[^\s_])?)_(?![\w_])/g;
const LIST_ITEM = /^- (.*)$/;
const WRAPPERS = { bold: "*", italic: "_", code: "`" };
// Una marca pegada a una letra o a otra marca no abre formato (snake_case, **doble**).
const BLOCKED_BEFORE = { "*": /[\w*]/, _: /[\w_]/ };

export const parseInline = (text) => {
  const nodes = [];
  const pattern = new RegExp(INLINE.source, "g");
  let last = 0;
  let match;

  const pushText = (value) => {
    const previous = nodes.at(-1);

    if (previous?.type === "text") previous.value += value;
    else nodes.push({ type: "text", value });
  };

  while ((match = pattern.exec(text)) !== null) {
    const [whole, code, label, href, url, bold, italic] = match;
    const mark = whole[0];

    if ((bold !== undefined || italic !== undefined) && BLOCKED_BEFORE[mark].test(text[match.index - 1] ?? "")) {
      pattern.lastIndex = match.index + 1;
      continue;
    }

    if (match.index > last) pushText(text.slice(last, match.index));

    if (code !== undefined) nodes.push({ type: "code", value: code });
    else if (href !== undefined) nodes.push({ type: "link", href, label });
    else if (url !== undefined) pushText(url);
    else if (bold !== undefined) nodes.push({ type: "bold", children: parseInline(bold) });
    else nodes.push({ type: "italic", children: parseInline(italic) });

    last = match.index + whole.length;
  }

  if (last < text.length) pushText(text.slice(last));

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
