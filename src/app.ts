import express from "express";
import helmet from "helmet";
import TCPScraper from "./tcp-scraper.service";

const server = express();

server.use(helmet());
server.use(express.json());

server.get("/", (_req, res) => {
  res.status(200).send("Server listening");
});

server.post("/send-lead-message", (_req, res) => {
  const tcp = new TCPScraper();
  tcp.findStudents();
  res.status(200).send("Sending messages");
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () =>
  console.log(`Server listening on http://localhost:${PORT}`)
);
