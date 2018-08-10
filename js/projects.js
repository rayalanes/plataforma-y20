document.addEventListener("DOMContentLoaded", (event) => { 
  const SPREADSHEET_ID = "1DEixnU-4WWf4TT2xgbJnQOomcGR6MKmm4kEOtFUKUVs"; // https://docs.google.com/spreadsheets
  const API_KEY = "AIzaSyCzMyPMqKKiaUTywH1VC7CTUnn-eS4g2jQ"; // https://console.developers.google.com/apis/credentials
  // TODO: Sacar permiso de edición para quien tenga el link

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
      this.taskForce = values[COLUMN_TASK_FORCE];

      const $$ = Math.min(this.budget.split("-")[0].split("$").length - 1, 3);
      const readinessNumber = Project.readinessOptions().indexOf(this.readiness) + 1;
      this.hashtags = this.keywords.split(" ").map(it => `#${it}`).join(" ");
      this.sdg1IconUrl = this._createSdgIcon(this.sdg1);
      this.sdg2IconUrl = this._createSdgIcon(this.sdg2);
      this.sdg3IconUrl = this._createSdgIcon(this.sdg3);
      this.budgetIconUrl = `img/budget-${$$}.png`;
      this.readinessIconUrl = `img/readiness-${readinessNumber}.png`;
    }

    _createSdgIcon(sdg) {
      if (!sdg) return "";

      const number = sdg.split(".")[0];
      return `img/sdg/${number}.png`;
    }
  }

  class ProjectsApi extends Spreadsheet {
    constructor() {
      super(SPREADSHEET_ID, API_KEY);
    }

    getAll() {
      return this.get(`A:Z`).then(({ values }) => this._buildProjects(values));
    }

    getPage(page = 0) {
      const start = page * PROJECTS_PER_PAGE + 1 /* (to 1-based index) */;
      const end = start + 1 /* (omit header row) */ + PROJECTS_PER_PAGE - 1 /* (inclusive interval) */;

      return this
        .get(`A${start}:Z${end}`)
        .then(({ values }) => {
          const count = parseInt(values[0][0]);

          return {
            currentPage: page,
            totalPages: Math.ceil(count / PROJECTS_PER_PAGE),
            projects: this._buildProjects(values)
          };
        });
    }

    _buildProjects(values) {
      return values.slice(1).map((it) => new Project(it));
    }
  }

  angular.module('ProjectsApp', []).controller('ProjectsController', ($scope) => {
    const api = new ProjectsApi();

    $scope.currentPage = 0;
    $scope.totalPages = 0;
    $scope.allProjects = null;
    $scope.projects = [];
    $scope.filters = {
      sdg: "Any",
      problem: "",
      taskForce: "Any",
      budget: "Any",
      keywords: ""
    };

    $scope.range = (n) => {
      var r = [];
      for (let i = 0; i < n; i++) r.push(i);
      return r;
    };

    $scope.setPage = (page) => {
      if ($scope.allProjects == null) return;

      const filteredProjects = $scope.allProjects.filter((it) => {
        const filters = $scope.filters;

        const sdgFilter = filters.sdg === "Any" || (it.sdg1 === filters.sdg || it.sdg2 === filters.sdg || it.sdg3 === filters.sdg);
        const problemFilter = filters.problem === "" || it.description.toLowerCase().includes(filters.problem.toLowerCase());
        const taskForceFilter = filters.taskForce === "Any" || it.taskForce === filters.taskForce;
        const budgetFilter = filters.budget === "Any" || it.budget === filters.budget;
        const keywords = filters.keywords === "" || it.keywords.includes(filters.keywords);

        return sdgFilter && problemFilter && taskForceFilter && budgetFilter && keywords;
      });
      
      $scope.projects = filteredProjects.slice(page * PROJECTS_PER_PAGE, (page + 1) * PROJECTS_PER_PAGE);
      $scope.currentPage = page;
      $scope.totalPages = Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE);
    };

    $scope.isPageAvailable = (page) => page >= 0 && page < $scope.totalPages;
    $scope.isPageClose = (page) => Math.abs(page - $scope.currentPage) < 2;
    $scope.isPageButtonVisible = (page) => page < 3 || $scope.isPageClose(page) || page > $scope.totalPages - 4;
    $scope.goToPreviousPage = () => { $scope.setPage($scope.currentPage - 1); };
    $scope.goToNextPage = () => { scope.setPage($scope.currentPage + 1); };

    $scope.$watch("filters", () => {
      $scope.setPage(0);
    }, true);

    api.getAll().then((data) => {
      $scope.allProjects = data;
      $scope.setPage(0);
      $scope.$apply();
    });

    // SERVER SIDE PAGINATION
    // $scope.setPage = (page) => {
    //   $scope.page = page;

    //   api.getPage(page).then((data) => {
    //     // if ($scope.totalPages == null) $scope.totalPages = data.totalPages;
    //     // $scope.currentPage = data.currentPage;
    //     // $scope.projects = data.projects;
    //     // $scope.$apply();
    //   });
    // }
  });
});
