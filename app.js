/** @format */

const express = require("express");
const path = require("path");
const scrapeGoogleScholar = require("./scrapeGoogleScholar");
const querystring = require("querystring");

const app = express();
const port = 3000;

// Serve the index.html file when the root route ("/") is accessed
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "search.html"));
});

// Serve static files (CSS, JS, etc.) from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Express route to handle the scraping request
app.get("/scrape", async (req, res) => {
  // Extract all query parameters and serialize them as a query string
  const queryParams = querystring.stringify(req.query);

  // Debugging log: Check if the query parameters are correct
  console.log("Query Parameters:", queryParams);

  if (!queryParams) {
    return res.status(400).json({
      success: false,
      error: "Please provide query parameters for the Google Scholar search",
      results: [],
    });
  }

  try {
    // Pass the query parameters to the scraper function
    const data = await scrapeGoogleScholar(queryParams);

    // Debugging log: Check if the data is fetched
    // console.log("Fetched Data:", data);

    if (data) {
      res.json(data);
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to fetch data",
        results: [],
      });
    }
  } catch (error) {
    console.error("Error in Express Route:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      results: [],
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
