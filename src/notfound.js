import "../assets/style.css";
import "../assets/i18n.js"; // window.I18N (lang + t)

function apply() {
  window.I18N.apply();
  document.title = window.I18N.t("nf.title");
}
apply();

const toggle = document.getElementById("langToggle");
if (toggle) toggle.onclick = () => window.I18N.cycleLang();
window.addEventListener("langchange", apply);
