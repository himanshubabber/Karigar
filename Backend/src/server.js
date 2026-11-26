import http from "http";
import dotenv from "dotenv";
import connectDB from "./db/index.js"; 
import app from "../app.js"; 
import { initSocket } from "./socket/socketManager.js";

dotenv.config({
  path: "./.env",
});

const server = http.createServer(app);
initSocket(server);

connectDB()
  .then(() => {
    server.listen(process.env.PORT || 8000, () => {
      console.log(`⚙️ Server with WebSockets is running at port: ${process.env.PORT || 8000}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed!", err);
  });
