// Supabase Edge Function to merge multiple PDF waybills into a single PDF
// Uses pdf-lib library for PDF manipulation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument } from "https://cdn.skypack.dev/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { waybillUrls } = await req.json();

    if (!waybillUrls || !Array.isArray(waybillUrls) || waybillUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: "waybillUrls array is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log(`Merging ${waybillUrls.length} waybills...`);

    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Fetch and merge each PDF
    for (const url of waybillUrls) {
      try {
        console.log(`Fetching: ${url.substring(0, 50)}...`);

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const pdfBytes = await response.arrayBuffer();

        // Load the PDF
        const pdf = await PDFDocument.load(pdfBytes);

        // Copy all pages from this PDF
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

        // Add each page to the merged document
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });

        successCount++;
        console.log(`Added PDF with ${copiedPages.length} pages`);
      } catch (error) {
        failedCount++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to process PDF: ${errorMsg}`);
        console.error(`Error processing PDF: ${errorMsg}`);
      }
    }

    if (successCount === 0) {
      return new Response(
        JSON.stringify({
          error: "No PDFs could be processed",
          details: errors
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Save the merged PDF
    const mergedPdfBytes = await mergedPdf.save();

    console.log(`Successfully merged ${successCount}/${waybillUrls.length} PDFs`);

    // Return the merged PDF
    return new Response(mergedPdfBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="waybills_${successCount}_orders.pdf"`,
        "X-Success-Count": String(successCount),
        "X-Failed-Count": String(failedCount),
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error in merge-waybills function:", errorMsg);

    return new Response(
      JSON.stringify({ error: errorMsg }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
