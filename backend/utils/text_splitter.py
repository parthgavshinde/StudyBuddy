# utils/text_splitter.py
def split_text(text: str, chunk_size: int = 500, overlap: int = 50):
    """
    Very simple text splitter:
    - chunk_size: approx characters per chunk
    - overlap: characters to carry forward to next chunk (helps continuity)
    Returns list of chunk strings.
    """
    if not text:
        return []

    text = text.replace("\r\n", "\n").strip()
    chunks = []
    start = 0
    length = len(text)

    while start < length:
        end = start + chunk_size

        # try to break at last newline / sentence end before end
        if end < length:
            sep_pos = max(
                text.rfind("\n", start, end),
                text.rfind(". ", start, end),
                text.rfind("? ", start, end),
                text.rfind("! ", start, end),
            )
            if sep_pos != -1 and sep_pos > start:
                end = sep_pos + 1  # include delimiter

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        # move start with overlap
        start = end - overlap
        if start < 0:
            start = 0

    return chunks
