import { Op } from 'sequelize';

export class UsageTracker {
  constructor(ttsRequestModel) {
    this.requestDbModel = ttsRequestModel;
  }

  async saveRequest({ model, styleLength, textLength }) {
    const _args = {
      model: model,
      styleLength: styleLength,
      textLength: textLength
    }
    console.log(_args);
    const request = this.requestDbModel.build(_args);
    await request.save();
    console.log("Request saved to DB")
    return request;
  }

  async updateRequest(request, success) {
    request.success = success;
    await request.save();
    console.log(`Request ${request.id} updated in DB`)
  }

  async getRequestCount(sinceDt) {
    const itemsCount = this.requestDbModel.count({
      where: {
        createdAt: {
          [Op.gt]: sinceDt
        }
      }
    });
    return itemsCount;
  }
}
