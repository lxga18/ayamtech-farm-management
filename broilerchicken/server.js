const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const ownerRoutes = require("./routes/ownerRoutes");
const workerRoutes = require("./routes/workerRoutes");
const driverRoutes = require('./routes/driverRoutes');

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/worker", workerRoutes);
app.use('/api/driver', driverRoutes);


app.get("/", (req, res) => {
  res.json({ message: "🐔 AyamTech API is running!" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});