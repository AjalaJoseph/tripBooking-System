import { app } from "./app"; 
import dotenv from "dotenv";
import "./src/backgrounmdWorker/emailWorker"; 
import "./src/backgrounmdWorker/reportWorker"
dotenv.config();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 System Engine boot-sequence complete. Terminal live on port ${PORT}`);
});
