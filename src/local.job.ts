import TCPScraper from "./tcp-scraper.service";

(async () => {
  const tcp = new TCPScraper();
  tcp.findStudents();
})();
