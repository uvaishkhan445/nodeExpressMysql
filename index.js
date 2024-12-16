const express = require("express");
const puppeteer = require("puppeteer");
const mysql = require("mysql");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors()); // Enable CORS for cross-origin requests

// Connect to the MySQL database

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "express",
});

connection.connect((err) => {
  if (err) throw err;
  console.log("Connected to the MySQL database!");
});

app.use(express.json());

app.get("/custom-css-pdf", async (req, res) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Custom HTML and CSS
  const htmlContent = `
      <html>
      <head>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 20px;
                  color: #333;
              }
              h1 {
                  color: #0056b3;
                  text-align: center;
              }
              p {
                  line-height: 1.5;
                  font-size: 14px;
              }
              .custom-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 20px;
              }
              .custom-table th, .custom-table td {
                  border: 1px solid #ddd;
                  padding: 8px;
              }
              .custom-table th {
                  background-color: #f4f4f4;
                  text-align: left;
              }
          </style>
      </head>
      <body>
          <h1>Custom CSS PDF Example</h1>
          <p>This PDF is styled using custom CSS.</p>
          <table class="custom-table">
              <thead>
                  <tr>
                      <th>Name</th>
                      <th>Age</th>
                      <th>Occupation</th>
                  </tr>
              </thead>
              <tbody>
                  <tr>
                      <td>John Doe</td>
                      <td>30</td>
                      <td>Software Engineer</td>
                  </tr>
                  <tr>
                      <td>Jane Smith</td>
                      <td>28</td>
                      <td>Graphic Designer</td>
                  </tr>
              </tbody>
          </table>
      </body>
      </html>
  `;

  await page.setContent(htmlContent);
  const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

  await browser.close();

  // Save the file for debugging
  const filePath = path.join(__dirname, "debug.pdf");
  fs.writeFileSync(filePath, pdfBuffer);

  // Send the file to the client
  res.download(filePath, "document.pdf", (err) => {
    if (err) console.error("Error sending file:", err);
  });
});

// Example route with error handling
app.get("/api/data", async (req, res, next) => {
  try {
    // Simulate data fetching
    connection.query("select * from users", function (err, result) {
      if (err) throw err;
      console.log("Data fetched successfully");
      console.log(result);
      // Check if data exists
      if (!result) {
        const error = new Error("Data not found");
        error.status = 404;
        throw error;
      }
      res.status(200).json({ success: true, data: result });
    });
  } catch (err) {
    next(err); // Pass errors to the error handler
  }
});

app.post("/insertData/", function (req, res) {
  // Insert data into the database here
  connection.query(
    "INSERT INTO users SET?",
    {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    },
    (err, result) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      console.log(`Inserted ID: ${result.insertId}`);
      res
        .status(200)
        .json({ success: true, message: "Data inserted successfully" });
    }
  );

  // Handle any errors that may occur during the insertion
  connection.on("error", (err) => {
    console.error(err);
    res.status(500).json({ success: false, message: "Error inserting data" });
  });
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
