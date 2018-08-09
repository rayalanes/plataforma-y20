document.addEventListener("DOMContentLoaded", (event) => { 
  const SPREADSHEET_ID = "1DEixnU-4WWf4TT2xgbJnQOomcGR6MKmm4kEOtFUKUVs"; // https://docs.google.com/spreadsheets
  const API_KEY = "AIzaSyCzMyPMqKKiaUTywH1VC7CTUnn-eS4g2jQ"; // https://console.developers.google.com/apis/credentials
  
  const COLUMN_NAME = 2;
  const COLUMN_DESCRIPTION = 3;
  const COLUMN_SDG1 = 4;
  const COLUMN_IMAGE = 5;
  const COLUMN_SDG2 = 6;
  const COLUMN_SDG3 = 7;
  const COLUMN_TASK_FORCE = 8;
  const COLUMN_BUDGET = 9;
  const COLUMN_READINESS = 10;
  const COLUMN_KEYWORDS = 11;
  const PROJECTS_PER_PAGE = 4;

  class Spreadsheet {
    constructor(id, apiKey) {
      this.id = id;
      this.apiKey = apiKey;

      this.VALUES_URL = "https://sheets.googleapis.com/v4/spreadsheets/$SPREADSHEET_ID/values/$RANGE?key=$API_KEY";
      // (https://developers.google.com/sheets/api/guides/concepts#partial_responses)
    }

    get(range) {
      const url = this.VALUES_URL
        .replace(/\$SPREADSHEET_ID/, this.id)
        .replace(/\$RANGE/, range)
        .replace(/\$API_KEY/, this.apiKey);

      return jQuery.getJSON(url);
    }
  }

  class Project {
    static readinessOptions() {
      return [
        "We need your brain in action!",
        "Some adjustments required",
        "Ready to go!"
      ];
    }

    constructor(values) {
      this.imageUrl = values[COLUMN_IMAGE];
      this.name = values[COLUMN_NAME];
      this.description = values[COLUMN_DESCRIPTION];
      this.keywords = values[COLUMN_KEYWORDS];
      this.sdg1 = values[COLUMN_SDG1];
      this.sdg2 = values[COLUMN_SDG2];
      this.sdg3 = values[COLUMN_SDG3];
      this.budget = values[COLUMN_BUDGET];
      this.readiness = values[COLUMN_READINESS];

      const $$ = Math.min(this.budget.split("-")[0].split("$").length - 1, 3);
      const readinessNumber = Project.readinessOptions().indexOf(this.readiness) + 1;
      this.hashtags = this.keywords.split(" ").map(it => `#${it}`).join(" ");
      this.budgetIconUrl = `img/budget-${$$}.png`;
      this.readinessIconUrl = `img/readiness-${readinessNumber}.png`;
    }
  }

  class ProjectsApi extends Spreadsheet {
    constructor() {
      super(SPREADSHEET_ID, API_KEY);
    }

    getPage(page = 0) {
      const start = page * PROJECTS_PER_PAGE + 1 /* (to 1-based index) */ + 1 /* (omit header row) */;
      const end = start + PROJECTS_PER_PAGE - 1 /* (inclusive interval) */;

      return this
        .get(`A${start}:Z${end}`)
        .then(({ values }) =>
          values.map((it) => new Project(it))
        );
    }
  }

  angular.module('ProjectsApp', []).controller('ProjectsController', ($scope) => {
    const api = new ProjectsApi();

    $scope.page = 0;
    $scope.projects = [];

    api.getPage(0).then((projects) => {
      $scope.projects = projects;
      $scope.$apply();
    });
  });
});
