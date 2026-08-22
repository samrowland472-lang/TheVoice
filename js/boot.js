// Not a module on purpose: this must still run when js/app.js fails to load.
window.__voiceBooted = false;
window.addEventListener("DOMContentLoaded", function () {
  setTimeout(function () {
    if (window.__voiceBooted) return;
    var status = document.getElementById("gate-status");
    var forms = document.getElementById("gate-forms");
    if (forms) forms.hidden = true;
    if (status) {
      status.className = "gate-status";
      status.innerHTML =
        "This page's program files did not load, so nothing on it will work yet.<br><br>" +
        "This usually means the <code>js</code> folder is missing from the server. " +
        "Check by visiting <code>/js/app.js</code> on this site — if that shows " +
        '"not found", re-upload the <code>js</code> folder to your repository.';
    }
  }, 6000);
});
