document.addEventListener("DOMContentLoaded", function(event) { 
  document.querySelector("#upload-project-button").addEventListener("click", function() {
    var introduction = document.querySelector("#upload-project-introduction");
    var form = document.querySelector("#upload-project-form");

    introduction.classList.add("hidden");
    form.classList.remove("hidden");
  });
});