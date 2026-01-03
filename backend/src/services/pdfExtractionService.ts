import { PDFParse } from "pdf-parse";
import { fileTypeFromBuffer } from "file-type";

const PDF_PROCESSING_TIMEOUT_MS = 30000; // 30 seconds
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Validates that a buffer is a PDF by checking MIME type and file signature
 */
export async function validatePdfFile(buffer: Buffer): Promise<boolean> {
  try {
    // Check file signature (magic bytes) - PDF files start with %PDF
    if (buffer.length < 4) {
      return false;
    }
    
    const header = buffer.toString("ascii", 0, 4);
    if (header !== "%PDF") {
      return false;
    }

    // Check MIME type using file-type library
    const fileType = await fileTypeFromBuffer(buffer);
    if (!fileType || fileType.mime !== "application/pdf") {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Extracts text from a PDF buffer with timeout protection
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Validate file size
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error("File size exceeds maximum allowed size");
  }

  // Validate PDF file type
  const isValidPdf = await validatePdfFile(buffer);
  if (!isValidPdf) {
    throw new Error("Invalid PDF file");
  }

  // Extract text with timeout using PDFParse class (pdf-parse v2 API)
  const parser = new PDFParse({ data: buffer });
  
  const extractionPromise = parser.getText();
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error("PDF processing timeout"));
    }, PDF_PROCESSING_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([extractionPromise, timeoutPromise]);
    return result.text;
  } catch (error) {
    if (error instanceof Error && error.message === "PDF processing timeout") {
      throw new Error("PDF processing took too long");
    }
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

