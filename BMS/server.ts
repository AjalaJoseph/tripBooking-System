import { app } from "./app"; 
import dotenv from "dotenv";
import { logger } from "./src/config/logger";
import "./src/backgrounmdWorker/emailWorker"; 
import "./src/backgrounmdWorker/reportWorker"
import { serverShutDown } from "./src/ultil/ShoutDown";
dotenv.config();
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 System Engine boot-sequence complete. Terminal live on port ${PORT}`);
});

serverShutDown(server)