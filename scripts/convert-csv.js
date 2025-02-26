/**
 * Script to convert the CSV file to JSON for deployment
 * 
 * Run with: node scripts/convert-csv.js
 */

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../src/data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Read the CSV file
const csvFilePath = process.argv[2] || '20250225_google_reviews_export copy.csv';
const csvContent = fs.readFileSync(csvFilePath, 'utf8');

// Parse the CSV
Papa.parse(csvContent, {
  header: true,
  skipEmptyLines: true,
  complete: (results) => {
    // Save as JSON
    const jsonOutput = path.join(dataDir, 'reviews.json');
    fs.writeFileSync(jsonOutput, JSON.stringify(results.data, null, 2));
    console.log(`Converted ${results.data.length} reviews to JSON at ${jsonOutput}`);
    
    // Also copy the CSV to the data directory
    const csvOutput = path.join(dataDir, 'reviews.csv');
    fs.copyFileSync(csvFilePath, csvOutput);
    console.log(`Copied CSV to ${csvOutput}`);
  },
  error: (error) => {
    console.error('Error parsing CSV:', error);
  }
});
