console.log("Server script started"); // ←追加

const express = require("express");
const cors = require("cors");

console.log("Modules loaded"); // ←追加

const app = express();
app.use(cors());

console.log("Express initialized"); // ←追加

app.get("/api/hello", (req, res) => {
  res.send("Hello from backend!");
});

app.listen(5174, () => console.log("Server running on http://localhost:5174"));
