import { Firestore } from "@google-cloud/firestore";
import { StudentAd } from "./studentAd.model";

export default class StudentAdsRepository {
  private collection = new Firestore().collection("studentAds");

  async get(url: string): Promise<StudentAd> {
    try {
      const doc = await this.collection.doc(this.replaceSlash(url)).get();
      return doc.data() as StudentAd;
    } catch (error) {
      console.error(error.message);
      return null;
    }
  }

  async getAll(): Promise<StudentAd[]> {
    try {
      const studentAds: StudentAd[] = [];
      const snap = await this.collection.get();
      for (const doc of snap.docs) {
        studentAds.push(doc.data() as StudentAd);
      }
      return studentAds;
    } catch (error) {
      console.error(error.message);
      return null;
    }
  }

  async add(studentAd: StudentAd) {
    try {
      await this.collection
        .doc(this.replaceSlash(studentAd.url))
        .set(studentAd);
    } catch (error) {
      console.error(error.message);
    }
  }

  replaceSlash(url: string) {
    return url.replace(new RegExp("/", "g"), "-");
  }
}
