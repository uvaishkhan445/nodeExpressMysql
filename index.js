const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

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
