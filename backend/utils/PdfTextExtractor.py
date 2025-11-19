import fitz  # PyMuPDF

def extract_text_from_pdf_bytes(file_content):
    try:
        # Open PDF from bytes
        pdf_document = fitz.open(stream=file_content, filetype="pdf")
        
        text = ""
        for page_num in range(pdf_document.page_count):
            page = pdf_document[page_num]
            text += page.get_text()
        
        pdf_document.close()
        return text
    except Exception as e:
        print(f"Error extracting text: {e}")
        return None