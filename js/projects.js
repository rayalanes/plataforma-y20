document.addEventListener("DOMContentLoaded", function(event) { 
  var SPREADSHEET_ID = "1DEixnU-4WWf4TT2xgbJnQOomcGR6MKmm4kEOtFUKUVs"; // https://docs.google.com/spreadsheets
  var API_KEY = "AIzaSyCzMyPMqKKiaUTywH1VC7CTUnn-eS4g2jQ"; // https://console.developers.google.com/apis/credentials

  class Spreadsheet {
    constructor(id, apiKey) {
      this.id = id;
      this.apiKey = apiKey;

      this.VALUES_URL = "https://sheets.googleapis.com/v4/spreadsheets/$SPREADSHEET_ID/values/$RANGE?key=$API_KEY";
      // (https://developers.google.com/sheets/api/guides/concepts#partial_responses)
    }

    get(range) {
      var url = this.VALUES_URL
        .replace(/\$SPREADSHEET_ID/, this.id)
        .replace(/\$RANGE/, range)
        .replace(/\$API_KEY/, this.apiKey);

      return jQuery.getJSON(url);
    }
  }

  new Spreadsheet(SPREADSHEET_ID, API_KEY).get("A1:Z4").then(function(data) {
    debugger;
  });
});
