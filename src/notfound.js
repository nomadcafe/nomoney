import "../assets/style.css";
import "../assets/i18n.js"; // window.I18N (lang + t)

function apply() {
  window.I18N.apply();
  document.title = window.I18N.t("nf.title");
}
apply();

window.addEventListener("langchange", apply); // language picker is wired in i18n.js
