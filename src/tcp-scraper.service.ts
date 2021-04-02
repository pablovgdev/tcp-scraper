import puppeteer, { Browser, Page } from "puppeteer";
import { TCP_EMAIL, TCP_MESSAGE, TCP_PASS } from "./env.config";
import { StudentAd } from "./studentAd.model";
import StudentAdsRepository from "./student-ads.repository";

export default class TCPScraper {
  protected TCP_URL = "https://www.tusclasesparticulares.com";

  randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  async launch(): Promise<Browser> {
    const args = [
      "--no-sandbox",
      "--disable-infobars",
      "--window-position=0,0",
      "--window-size=1200,800",
      "--disable-setuid-sandbox",
      "--ignore-certifcate-errors",
      "--ignore-certifcate-errors-spki-list",
      '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"',
    ];

    const options = {
      args,
      timeout: 0,
      headless: true,
      ignoreHTTPSErrors: true,
      waitUntil: ["load", "domcontentloaded", "networkidle0", "networkidle2"],
    };

    return await puppeteer.launch(options);
  }

  async findStudents() {
    const browser = await this.launch();

    try {
      const page = await browser.newPage();
      const loginPage = await this.login(page);

      let studentAds: StudentAd[] = [];

      const maxPages = await this.getMaxPages(loginPage);

      for (let i = 1; i <= maxPages; i++) {
        studentAds = studentAds.concat(await this.getStudentAds(loginPage, i));
      }

      // const ads = this.filterStudentsAds(studentAds);
      const studentAdsRepository = new StudentAdsRepository();

      for (let ad of studentAds) {
        const oldAd = await studentAdsRepository.get(ad.url);
        if (!oldAd) {
          studentAdsRepository.add(ad);
          await this.sendMessage(loginPage, ad);
        }
      }
    } catch (error) {
      console.error(error);
    }

    browser.close();
  }

  async login(page: Page): Promise<Page> {
    await page.goto(this.TCP_URL + "/acceso-area-personal.aspx");
    await page.click("input#usuari", { clickCount: 3 });
    await page.type("input#usuari", TCP_EMAIL);
    await page.click("input#password", { clickCount: 3 });
    await page.type("input#password", TCP_PASS);
    await page.click("button#btn_accept");
    await page.waitFor(this.randomInt(500, 1000));
    await page.click("input#btnentrar");
    await page.waitFor(this.randomInt(500, 1000));
    await page.goto(this.TCP_URL);
    return page;
  }

  async getMaxPages(page: Page): Promise<number> {
    await page.goto(this.TCP_URL + "/alumnos/programacion.aspx?pagina=1");
    const pageNumbers: string[] = await page.$$eval(
      "div.parr-pagination a",
      (anchors) => {
        return anchors.map((anchor) => anchor.textContent);
      }
    );

    return parseInt(pageNumbers[pageNumbers.length - 2]);
  }

  async getStudentAds(
    page: Page,
    pageNumber: number = 1
  ): Promise<StudentAd[]> {
    await page.goto(
      this.TCP_URL + "/alumnos/programacion.aspx?pagina=" + pageNumber
    );

    return await page.$$eval("table#Graella td>a", (anchors) =>
      anchors.map((anchor) => {
        return { url: anchor.getAttribute("href"), text: anchor.textContent };
      })
    );
  }

  filterStudentsAds(ads: StudentAd[]): StudentAd[] {
    const subjects = [
      "python",
      "javascript",
      "php",
      "java",
      "typescript",
      "html",
      "css",
      "web",
    ];

    return ads.filter((studentAd) => {
      for (let subject of subjects) {
        if (studentAd.text.toLowerCase().includes(subject)) {
          return true;
        }
      }
      return false;
    });
  }

  async sendMessage(page: Page, ad: StudentAd) {
    await page.goto(this.TCP_URL + ad.url);

    await page.click("textarea#txttext", { clickCount: 3 });
    await page.type("textarea#txttext", TCP_MESSAGE);
    await page.waitFor(this.randomInt(500, 1000));

    try {
      await page.click("input#chkcondiciones");
    } catch (error) {}

    await page.click("input#btnenviar");
  }
}
