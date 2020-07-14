const { RESTDataSource } = require("apollo-datasource-rest");
// Use currently: mapKeys, groupBy
const _ = require("lodash");

class smhiAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL =
      "https://www.smhi.se/wpt-a/backend_seapointforecast_nextgen/oceandata/stations/wave/";
  }

  async getStationDataByParameters(parameter, station) {
    return await this.get(
      `https://opendata-download-ocobs.smhi.se/api/version/latest/parameter/${parameter}/station/${station}/period/latest-day/data.json `
    );
  }

  async getStationData(stationObjs) {
    const smhiResponse = await Promise.allSettled(
      stationObjs.map(x =>
        this.getStationDataByParameters(x.parameter, x.stationId)
      )
    ).then(results => {
      return results.map(({ status, value }) => {
        if (status === "rejected") {
          console.log("handle error here");
        }

        return value;
      });
    });

    return smhiResponse.map(stationBlob => ({
      stationId: stationBlob.station.key,
      stationName: stationBlob.station.name,
      parameterKey: stationBlob.parameter.key,
      readingName: stationBlob.parameter.name,
      readingUnit: stationBlob.parameter.unit,
      readingPeriodTo: stationBlob.period.to,
      readingPeriodFrom: stationBlob.period.from,
      readingValues: stationBlob.value
    }));
  }
}

module.exports = { smhiAPI };
