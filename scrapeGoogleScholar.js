/** @format */

const axios = require("axios");
const cheerio = require("cheerio");

// Function to extract the year from the citation string
function extractYear(citationText) {
  // Regular expression to find a 4-digit year (1900-2099)
  const yearMatch = citationText.match(/\b(19|20)\d{2}\b/);
  return yearMatch ? yearMatch[0] : '';
}


// Function to scrape the Google Scholar page
async function scrapeGoogleScholar(uri) {
  try {
    // Base URL for Google Scholar search
    const baseUrl = "https://scholar.google.com/scholar?";

    // Construct full URL by combining the base URL with the provided URI part
    const url = `${baseUrl}hl=en&${uri}`;

    // Fetch the HTML content from the page
    const { data } = await axios.get(url);

    // Load the HTML into cheerio
    const $ = cheerio.load(data);

    // Extract total results (this is available on the first page or in "Page X of about Y results")
    let totalResultsText = $("#gs_ab_md").text();
    let totalResultsMatch = totalResultsText.match(
      /(?:About|of about)\s([\d,]+)/
    );

    // Clean and convert to number, if not found, set to 0 (for pages beyond the first)
    let totalResults = totalResultsMatch
      ? parseInt(totalResultsMatch[1].replace(/,/g, ""))
      : 0; // Or use a value from a previous call to scrape the first page

    // Assuming 10 results per page, calculate the total pages
    let resultsPerPage = 10;
    let totalPages = Math.ceil(totalResults / resultsPerPage);

    // Extract the 'start' parameter to determine the current page
    const urlParams = new URLSearchParams(uri);
    let startParam = urlParams.get("start");
    let currentPage = startParam
      ? Math.floor(parseInt(startParam, 10) / resultsPerPage) + 1
      : 1;

    // Array to store the extracted information
    const results = [];

    // Loop through each result item
    $(".gs_ri").each((i, el) => {
      // Extract title, link, authors, and citation count
      const title = $(el)
        .find(".gs_rt a")
        .text()
        .trim()
        .replace(/[^\x00-\x7F]/g, "");
      const link = $(el).find(".gs_rt a").attr("href");
      const authors = $(el)
        .find(".gs_a")
        .text()
        .trim()
        .replace(/[^\x00-\x7F]/g, "")
        .split("-")[0]; // Extract authors before the first hyphen

      const citationText = $(el).find(".gs_fl").text();

      // Regular expression to match the number after "Cited by"
      let citationMatch = citationText.match(/Cited by (\d+)/);

      // If a match is found, extract the citation number, otherwise set it to 0
      let citationCount = citationMatch ? parseInt(citationMatch[1], 10) : 0;

      // Extract year from citation using the extractYear function
      const year = extractYear($(el).find(".gs_a").text());

      // Push the extracted data to the results array
      results.push({ title, link, authors, citationCount, year });
    });

    console.log(results)

    // Return the formatted results with success status
    return {
      success: true,
      totalResults,
      totalPages,
      currentPage,
      results,
    };
  } catch (error) {
    console.error("Error fetching the data:", error);

    // Return empty results and success as false in case of error
    return {
      success: false,
      totalResults: 0,
      totalPages: 0,
      currentPage: 0,
      results: [],
    };
  }
}

module.exports = scrapeGoogleScholar;

scrapeGoogleScholar("as_sdt=7,44&q=tabnet&hl=en&start=0");

