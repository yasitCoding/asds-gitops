const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", timestamp: new Date().toISOString() });
});

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from DevSecOps Target Application!", version: "1.0.0" });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

module.exports = app;
