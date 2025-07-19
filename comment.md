### Plan to Explore OCR for Steering Committee Content

The goal of this spike is to de-risk the feature by answering the following questions:

1.  Can we reliably perform OCR on uploaded slide decks/PDFs within the browser?
2.  Can we accurately extract the required entities (risks, statuses, commentary) from the unstructured text?
3.  How can we best present the extracted data to the user for mapping and confirmation?

---

#### **Phase 1: Research & Proof of Concept (POC) - OCR Feasibility**

1.  **Tool Selection:**
    - **Primary Candidate:** Research and select a client-side OCR library. `Tesseract.js` is the most mature and likely candidate, as it's a JavaScript port of a powerful OCR engine.
    - **PDF Handling:** Investigate libraries like `pdf.js` (from Mozilla) to render PDF pages into images (on a canvas element) that can be processed by the OCR library. This is necessary because OCR engines operate on images, not PDF text layers directly.

2.  **Build a Basic POC:**
    - Create a new, isolated React component for the POC.
    - Implement a file upload interface (accepting `.pdf`, `.ppt`, `.pptx`, `.png`, `.jpg`). _Note: Handling `.ppt`/`.pptx` directly in the browser is complex. The initial POC will focus on PDFs and images, with the assumption that users can export PowerPoint slides to PDF._
    - Integrate `pdf.js` to render the first page of an uploaded PDF to a hidden canvas.
    - Integrate `Tesseract.js` to run OCR on the canvas image.
    - Display the raw, extracted text on the screen.
    - **Goal:** Prove that we can get usable text from a sample document entirely within the browser.

#### **Phase 2: POC - Entity Extraction & Mapping**

1.  **Understand the Target Data Model:**
    - Before parsing, I need to thoroughly understand the application's existing data structures for tracking. I will start by reviewing the contents of `src/components/tracking/`, `src/context/PlanningContext.tsx`, and `src/types/` to understand how `planned`, `actual`, and `variance` data are structured.

2.  **Develop an Extraction Strategy:**
    - **Rule-Based Extraction:** Start with simple regular expressions and keyword matching to find the target information. This is a good starting point for semi-structured data.
      - **RAG Statuses:** Look for keywords like "Status:", "RAG:", followed by "Red", "Amber", "Green", or associated symbols/colors.
      - **Risks:** Search for sections titled "Risks", "Issues", or "Blockers" and extract the subsequent text.
      - **Commentary:** This is harder. We can try to associate text with project or epic names found nearby in the document.
      - **Financials:** Look for patterns like "Budget: $X", "Forecast: $Y".
    - **Natural Language Processing (NLP):** If simple rules are insufficient, investigate lightweight, client-side NLP libraries for more advanced Named Entity Recognition (NER). This would be a stretch goal for the spike.

3.  **Build the Mapping UI:**
    - Design a simple two-panel UI for the POC.
    - **Left Panel:** Display the extracted, structured data (e.g., a list of identified risks, a table of project statuses).
    - **Right Panel:** Show the relevant part of the application's existing tracking view for a selected project or epic.
    - **Mapping Mechanism:** Implement a simple mechanism (e.g., a "Copy" or "Apply" button) to transfer the extracted text into the appropriate field in the tracking view. The action should update the application's state (e.g., in `PlanningContext`).

#### **Phase 3: Spike Summary & Recommendations**

1.  **Document Findings:** Summarize the results of the POC.
    - What was the accuracy of the OCR?
    - How successful was the entity extraction?
    - What are the limitations of the client-side approach? (e.g., performance with large documents, accuracy with complex layouts).
2.  **Propose Next Steps:** Based on the findings, provide a recommendation:
    - **Proceed:** The approach is feasible. Outline a plan for a full feature implementation.
    - **Pivot:** The current approach has flaws. Suggest alternative strategies (e.g., requiring more structured input like a specific PowerPoint template).
    - **Abandon:** The technical challenges are too great for the value provided.
