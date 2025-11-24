require("dotenv").config();
require("./models/associations");
const cors = require("cors");
const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const sequelize = require("./config/database"); // Sequelize instance
const authRoutes = require("./routes/authRoutes");
const cinRoutes = require("./routes/cinRoutes");
const inviteRoutes = require("./routes/inviteRoutes");
const stripeRoutes = require("./routes/stripeRoutes");
const commercantRoutes = require("./routes/commercantRoutes");
const magasinRoutes = require("./routes/magasinRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const categoryRoutes = require("./routes/categorieRoutes");
const tirelireRoutes = require("./routes/tirelireRoutes");
const objectifRoutes = require("./routes/objectifRoutes");
const cashbackRoutes = require("./routes/cashbackRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const badgeRoutes = require("./routes/badgeRoutes");
const alimentationRoutes = require("./routes/alimentationRoutes");
const chatRoutes = require("./routes/chatRoutes");
const EducationRoutes = require("./routes/financialEducationRoutes");
const QuizRoutes = require("./routes/quizRoutes");
const financialVideoRoutes = require('./routes/financialVideoRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 5000;

// Middleware JSON
app.use(express.json());

// CORS
app.use(cors({ origin: "*" }));

// Static files
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/auth", authRoutes);
app.use("/cin", cinRoutes);
app.use("/api", inviteRoutes);
app.use("/payment", stripeRoutes);
app.use("/commercant", commercantRoutes);
app.use("/magasin", magasinRoutes);
app.use("/payment", paymentRoutes);
app.use("/trans", transactionRoutes);
app.use("/budget", budgetRoutes);
app.use("/categories", categoryRoutes);
app.use("/tirelire", tirelireRoutes);
app.use("/objectif", objectifRoutes);
app.use("/cashback", cashbackRoutes);
app.use("/notifications", notificationRoutes);
app.use("/badge", badgeRoutes);
app.use("/alimentation", alimentationRoutes);
app.use("/chat", chatRoutes);
app.use("/edu", EducationRoutes);
app.use("/quiz", QuizRoutes);
app.use('/video/all', financialVideoRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Flexee Pay Backend is running...");
});

// Socket.IO: Store connected users
const connectedUsers = new Map();

io.on("connection", (socket) => {
  console.log(`✅ New client connected: ${socket.id}`);

  socket.on("register", (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`🔗 User ${userId} registered with socket ${socket.id}`);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    for (let [userId, sId] of connectedUsers.entries()) {
      if (sId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`🗑️ User ${userId} removed from active list.`);
        break;
      }
    }
  });
});

// Make io & connectedUsers accessible in your routes
app.set("io", io);
app.set("connectedUsers", connectedUsers);

// Database sync
sequelize
  .sync({ alter: true })
  .then(() => console.log("✅ Database synced successfully!"))
  .catch((err) => console.error("❌ Error syncing database:", err));

// Start server with Socket.IO
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
