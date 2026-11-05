(function () {
"use strict";
var mobileNav = document.querySelector('.site-nav');
var menuToggle = document.querySelector('.nav-toggle');
if (mobileNav && menuToggle) {
var mobileMenuQuery = matchMedia('(max-width:600px)');
mobileNav.classList.add('nav-enhanced');
menuToggle.hidden = false;
function setMenu(open) {
mobileNav.classList.toggle('menu-open', open);
document.body.classList.toggle('mobile-menu-open', open);
if (open) mobileNav.querySelector('.nav-links a')?.focus({preventScroll:true});
menuToggle.setAttribute('aria-expanded', String(open));
menuToggle.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
window.dispatchEvent(new Event('resize'));
}
menuToggle.addEventListener('click', function () { setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'); });
mobileNav.querySelectorAll('a').forEach(function (link) { link.addEventListener('click', function () { setMenu(false); }); });
document.addEventListener('keydown', function (event) {
if (event.key === 'Tab' && mobileNav.classList.contains('menu-open')) {
var controls = [menuToggle].concat(Array.from(mobileNav.querySelectorAll('.nav-links a,.nav-cta')));
var first = controls[0], last = controls[controls.length-1];
if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}
});
document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && mobileNav.classList.contains('menu-open')) { setMenu(false); menuToggle.focus(); } });
document.addEventListener('click', function (event) { if (!mobileNav.contains(event.target)) setMenu(false); });
mobileMenuQuery.addEventListener('change', function () { setMenu(false); });
}
var introLogo = document.querySelector('.site-nav .brand-logo');
var introReduced = matchMedia('(prefers-reduced-motion: reduce)');
var introSeen = false;
try { introSeen = sessionStorage.getItem('gw-brand-intro') === '1'; } catch (_) { introSeen = true; }
if (introLogo && !introSeen && !introReduced.matches && !location.search && !location.hash) {
try { sessionStorage.setItem('gw-brand-intro', '1'); } catch (_) {}
var introCover = document.createElement('div');
introCover.className = 'brand-intro'; introCover.setAttribute('aria-hidden', 'true');
var flyingLogo = introLogo.cloneNode(false); flyingLogo.alt = ''; flyingLogo.className = 'brand-intro-logo';
introCover.append(flyingLogo); document.body.append(introCover);
var introAnimations = [], introTimer;
function clearIntro() {
clearTimeout(introTimer); introAnimations.forEach(function (a) { a.cancel(); });
introLogo.style.visibility = ''; introCover.remove();
window.removeEventListener('resize', clearIntro); window.removeEventListener('pagehide', clearIntro);
document.removeEventListener('visibilitychange', introVisibility);
document.removeEventListener('pointerdown', clearIntro); document.removeEventListener('keydown', clearIntro);
introReduced.removeEventListener('change', clearIntro);
}
function introVisibility() { if (document.hidden) clearIntro(); }
async function playBrandIntro() {
try {
await introLogo.decode();
if (!introCover.isConnected || document.hidden) { clearIntro(); return; }
var rect = introLogo.getBoundingClientRect();
var width = Math.min(280, innerWidth * .62);
var height = width * introLogo.naturalHeight / introLogo.naturalWidth;
var left = (innerWidth - width) / 2, top = (innerHeight - height) / 2;
Object.assign(flyingLogo.style, { width:width+'px',height:height+'px',left:left+'px',top:top+'px' });
introLogo.style.visibility = 'hidden';
var entrance = flyingLogo.animate([{opacity:0,transform:'translateY(12px) scale(.96)',filter:'blur(4px)'},{opacity:1,transform:'none',filter:'blur(0px)'}],{duration:450,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});
introAnimations.push(entrance); await entrance.finished;
var flight = flyingLogo.animate([{transform:'translate(0,0) scale(1)'},{transform:'translate('+(rect.left-left)+'px,'+(rect.top-top)+'px) scale('+(rect.width/width)+')'}],{duration:850,delay:120,easing:'cubic-bezier(.65,0,.2,1)',fill:'forwards'});
var reveal = introCover.animate([{backgroundColor:'#fff'},{backgroundColor:'rgba(255,255,255,0)'}],{duration:700,delay:270,fill:'forwards',easing:'ease'});
introAnimations.push(flight,reveal); await flight.finished; clearIntro();
} catch (_) { clearIntro(); }
}
window.addEventListener('resize', clearIntro); window.addEventListener('pagehide', clearIntro);
document.addEventListener('visibilitychange', introVisibility);
document.addEventListener('pointerdown', clearIntro); document.addEventListener('keydown', clearIntro);
introReduced.addEventListener('change', clearIntro);
introTimer = setTimeout(clearIntro, 2500);
playBrandIntro();
}
document.querySelectorAll("[data-unit-selector]").forEach(function (root) {
var panel = root.querySelector("[data-unit-panel]");
var shapes = Array.prototype.slice.call(root.querySelectorAll(".unit-shape"));
if (!panel || !shapes.length) return;
root.classList.add("is-enhanced");
function setActive(id) {
root.classList.add("has-active");
root.classList.add("has-preview-unit");
shapes.forEach(function (shape) { shape.classList.toggle("is-active", shape.getAttribute("data-unit") === id); shape.classList.toggle("is-preview-other", shape.getAttribute("data-unit") !== id); });
panel.querySelectorAll(".selector-unit").forEach(function (card) {
card.classList.toggle("is-active", card.getAttribute("data-unit") === id);
});
}
function clearActive() {
root.classList.remove("has-active");
root.classList.remove("has-preview-unit");
shapes.forEach(function (shape) { shape.classList.remove("is-active", "is-preview-other"); });
panel.querySelectorAll(".selector-unit").forEach(function (card) {
card.classList.remove("is-active");
});
}
shapes.forEach(function (shape) {
var id = shape.getAttribute("data-unit");
shape.addEventListener("pointerenter", function () { setActive(id); });
shape.addEventListener("focusin", function () { setActive(id); });
});
panel.querySelectorAll(".selector-unit").forEach(function (card) {
var id = card.getAttribute("data-unit");
card.addEventListener("pointerenter", function () { setActive(id); });
card.addEventListener("focusin", function () { setActive(id); });
});
root.addEventListener("pointerleave", clearActive);
root.addEventListener("focusout", function (e) {
if (!root.contains(e.relatedTarget)) clearActive();
});
});
var investmentDetails = document.querySelector("[data-investment-details]");
if (investmentDetails && document.querySelector("[data-unit-selector]")) {
investmentDetails.classList.add("selection-enhanced");
function showSelectedUnit() {
var requested = new URLSearchParams(window.location.search).get("lokal");
var hashUnit = window.location.hash.match(/^#lokal-([\w-]+)$/);
var id = hashUnit ? hashUnit[1] : requested;
var cards = Array.from(investmentDetails.querySelectorAll(".unit[id]"));
var selected = cards.find(function (card) { return card.id === "lokal-" + id; });
if (!selected) return;
if (document.getElementById("unit-flight-config") && ["1","2"].includes(id)) return;
investmentDetails.open = true;
var building = document.querySelector("[data-unit-selector]");
building.classList.add("has-selected-unit");
building.querySelectorAll(".unit-shape").forEach(function (shape) {
shape.classList.toggle("is-other-unit", shape.getAttribute("data-unit") !== id);
});
cards.forEach(function (card) { card.hidden = card !== selected; });
selected.setAttribute("tabindex", "-1");
selected.focus({ preventScroll: true });
selected.scrollIntoView({ block: "start", behavior: "instant" });
}
window.addEventListener("hashchange", showSelectedUnit);
showSelectedUnit();
}
var flightConfigEl = document.getElementById("unit-flight-config");
if (flightConfigEl) {
var flightConfig = JSON.parse(flightConfigEl.textContent);
var flightOpening = false;
var flightLinks='a.unit-shape[data-unit], .selector-unit[data-unit] a';
function unitId(link){return link.dataset.unit || link.closest('[data-unit]')?.dataset.unit;}
document.querySelectorAll(flightLinks).forEach(function(link){
var id=unitId(link);link.removeAttribute('target');
link.setAttribute('aria-label','Lokal '+id+' — pokaż przelot i rzut parteru');
});
function launchFlight(animate, origin, id) {
if (flightOpening || !flightConfig.units[id]) return;
flightOpening = true;
var config=JSON.parse(JSON.stringify(flightConfig));
config.unitId=id;config.rooms=config.units[id].rooms;config.contact=config.units[id].contact;
if(id==='1'){
config.mirror=true;
var c=config.video.sourceCrop;config.video.sourceCrop=[1-c[0]-c[2],c[1],c[2],c[3]];
c=config.video.posterCrop;config.video.posterCrop=[config.video.width-c[0]-c[2],c[1],c[2],c[3]];
c=config.video.floorCrop;config.video.floorCrop=[1-c[0]-c[2],c[1],c[2],c[3]];
}
import("/grupa-wawrzyniak/assets/js/unit-flight.js?v=frosted-menu-5nov").then(function(module){
return module.openUnitFlight(config,{animate:animate,origin:origin});
}).catch(function(){investmentDetails.open=true;window.location.hash='rzuty';})
.finally(function(){flightOpening=false;});
}
document.addEventListener('click',function(event){
var link=event.target.closest && event.target.closest(flightLinks);
if(!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button>0)return;
event.preventDefault();launchFlight(true,link,unitId(link));
},true);
window.addEventListener('popstate',function(){
var id=new URLSearchParams(location.search).get('lokal');
if(flightConfig.units[id])launchFlight(false,null,id);
});
window.addEventListener('pageshow',function(event){
var id=new URLSearchParams(location.search).get('lokal');
if(event.persisted && flightConfig.units[id]){flightOpening=false;launchFlight(false,null,id);}
});
var initialUnit=new URLSearchParams(location.search).get('lokal') || location.hash.match(/^#lokal-([12])$/)?.[1];
if(flightConfig.units[initialUnit])launchFlight(false,null,initialUnit);
}
document.querySelectorAll("[data-floor-tabs]").forEach(function (container) {
var panels = Array.prototype.slice.call(container.querySelectorAll(".room-panel"));
if (panels.length < 2) return;
var tablist = document.createElement("div");
tablist.className = "tabs";
tablist.setAttribute("role", "tablist");
tablist.setAttribute("aria-label", container.getAttribute("data-tablist-label") || "Zakładki");
var tabs = panels.map(function (panel, i) {
var label = panel.querySelector(".floor-label");
var text = label ? label.textContent : "Panel " + (i + 1);
if (label) label.hidden = true; // treść zakładki przejmuje przycisk
var tab = document.createElement("button");
tab.type = "button";
tab.id = panel.id + "-tab";
tab.className = "tab";
tab.setAttribute("role", "tab");
tab.setAttribute("aria-controls", panel.id);
tab.textContent = text;
panel.setAttribute("role", "tabpanel");
panel.setAttribute("aria-labelledby", tab.id);
tablist.appendChild(tab);
return tab;
});
container.insertBefore(tablist, container.firstChild);
function applyState(tab) {
tabs.forEach(function (t) {
var selected = t === tab;
t.setAttribute("aria-selected", String(selected));
t.tabIndex = selected ? 0 : -1;
var panel = document.getElementById(t.getAttribute("aria-controls"));
if (panel) panel.hidden = !selected;
});
}
function select(tab) {
applyState(tab);
tab.focus();
}
panels.forEach(function (panel, index) {
var figure = panel.querySelector(".interior-visual");
var image = figure && figure.querySelector("img");
if (!image) return;
var stage = document.createElement("div");
stage.className = "interior-stage";
figure.insertBefore(stage, image);
stage.appendChild(image);
[-1, 1].forEach(function (direction) {
var button = document.createElement("button");
var next = (index + direction + panels.length) % panels.length;
button.type = "button";
button.className = "floor-arrow " + (direction < 0 ? "floor-prev" : "floor-next");
button.textContent = direction < 0 ? "←" : "→";
button.setAttribute("aria-label", (direction < 0 ? "Poprzednia kondygnacja: " : "Następna kondygnacja: ") + tabs[next].textContent);
button.setAttribute("aria-controls", panels[next].id);
button.addEventListener("click", function () {
applyState(tabs[next]);
var replacement = panels[next].querySelector(direction < 0 ? ".floor-prev" : ".floor-next");
if (replacement) replacement.focus({ preventScroll: true });
});
stage.appendChild(button);
});
});
applyState(tabs[0]);
tabs.forEach(function (tab) {
tab.addEventListener("click", function () { select(tab); });
});
tablist.addEventListener("keydown", function (e) {
var i = tabs.indexOf(document.activeElement);
if (i < 0) return;
var n = null;
if (e.key === "ArrowRight") n = (i + 1) % tabs.length;
else if (e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
else if (e.key === "Home") n = 0;
else if (e.key === "End") n = tabs.length - 1;
if (n !== null) {
e.preventDefault();
select(tabs[n]);
}
});
});
var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
var motionObserver;
var runningMotion = new Set();
var motionTargets = [];
var motionSeen = new WeakSet();
function playEntrance(el, delay) {
if (motionSeen.has(el) || motionPreference.matches || document.hidden || el.closest('[inert]')) return;
motionSeen.add(el);
if (!el.animate) return;
var image = el.matches(".hero-image-wrap, .editorial-tile, .gallery figure, .feature, .flight-gallery a");
var frames = image
? [{ opacity: .45, transform: "translateY(22px) scale(.985)" }, { opacity: 1, transform: "none" }]
: el.matches("h1, h2, .hero-title")
? [{ opacity: 0, transform: "translateY(22px)", filter: "blur(3px)" }, { opacity: 1, transform: "none", filter: "blur(0px)" }]
: [{ opacity: 0, transform: "translateY(28px)" }, { opacity: 1, transform: "none" }];
var anim = el.animate(frames, { duration: image ? 850 : 650, delay: delay || 0,
easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards" });
runningMotion.add(anim);
anim.onfinish = anim.oncancel = function () { runningMotion.delete(anim); };
}
function stopMotion() {
if (motionObserver) motionObserver.disconnect();
runningMotion.forEach(function (anim) { anim.cancel(); });
runningMotion.clear();
}
function startMotion() {
if (motionPreference.matches || !("IntersectionObserver" in window)) return;
motionTargets = Array.from(document.querySelectorAll(
".hero-title, .stat-row > *, " +
".section > h1, .section > h2, .section > .eyebrow, .section > .copy, " +
".section-head, .editorial-tile, .split > *, .unit-grid > *, " +
".gallery figure, .cta, .selector-grid, .floor-tables, .feature, .crumb, .contact-form .field, .contact-form > .btn, .site-footer"));
motionTargets = motionTargets.filter(function (el, i, all) {
return !all.some(function (parent) { return parent !== el && parent.contains(el); });
});
motionObserver = new IntersectionObserver(function (entries) {
var visible = entries.filter(function (entry) { return entry.isIntersecting; });
visible.forEach(function (entry, i) {
playEntrance(entry.target, Math.min(i * 75, 225));
if (motionSeen.has(entry.target)) motionObserver.unobserve(entry.target);
});
}, { threshold: 0, rootMargin: "0px 0px -5% 0px" });
motionTargets.forEach(function (el) {
if (!motionSeen.has(el)) motionObserver.observe(el);
});
}
motionPreference.addEventListener("change", function () { stopMotion(); startMotion(); });
document.addEventListener("visibilitychange", function () {
if (document.hidden) stopMotion(); else startMotion();
});
document.addEventListener("focusin", function (event) {
runningMotion.forEach(function (anim) {
var target = anim.effect && anim.effect.target;
if (target && target.contains(event.target)) anim.cancel();
});
});
window.addEventListener("pagehide", stopMotion);
window.addEventListener("pageshow", function (event) { if (event.persisted) startMotion(); });
startMotion();
var heroArt = document.querySelector('.hero:has(.home-hero-accessible-title) .hero-image');
if (heroArt) {
var heroClip = heroArt.closest('.hero-image-wrap');
var parallaxFrame = 0, heroTop = 0, heroHeight = 1;
function measureParallax() {
var rect = heroClip.getBoundingClientRect();
heroTop = rect.top + scrollY; heroHeight = rect.height;
queueParallax();
}
function updateParallax() {
parallaxFrame = 0;
if (motionPreference.matches || document.hidden) {
heroArt.style.transform = ''; return;
}
var top = heroTop - scrollY;
if (top + heroHeight < 0 || top > innerHeight) return;
var progress = Math.max(0, Math.min(1, (innerHeight - top) / (innerHeight + heroHeight)));
heroArt.style.transform = 'translate3d(0,' + ((progress - .5) * heroHeight * .28) + 'px,0) scale(1.3)';
}
function queueParallax() {
if (!parallaxFrame && !document.hidden) parallaxFrame = requestAnimationFrame(updateParallax);
}
function pauseParallax() { cancelAnimationFrame(parallaxFrame); parallaxFrame = 0; }
window.addEventListener('scroll', queueParallax, { passive: true });
window.addEventListener('resize', measureParallax, { passive: true });
motionPreference.addEventListener('change', queueParallax);
document.addEventListener('visibilitychange', function () { if (document.hidden) pauseParallax(); else queueParallax(); });
window.addEventListener('pagehide', pauseParallax);
window.addEventListener('pageshow', queueParallax);
heroArt.addEventListener('load', measureParallax, { once:true });
measureParallax();
}
var photos = Array.from(document.querySelectorAll("[data-gallery-photo]"));
if (typeof HTMLDialogElement !== "undefined" && (photos.length || flightConfigEl)) {
var viewer = document.createElement("dialog");
viewer.className = "photo-viewer";
viewer.setAttribute("aria-label", "Galeria zdjęć");
viewer.innerHTML = '<div class="viewer-toolbar"><p id="viewer-caption" aria-live="polite"></p><button type="button" class="viewer-close" aria-label="Zamknij galerię">×</button></div><div class="viewer-stage"><button type="button" class="viewer-prev" aria-label="Poprzednie zdjęcie">←</button><img class="viewer-image" alt=""><button type="button" class="viewer-next" aria-label="Następne zdjęcie">→</button></div><div class="viewer-thumbs" aria-label="Miniatury zdjęć"></div>';
document.body.appendChild(viewer);
var currentPhoto = 0;
var photoOrigin;
var fullImage = viewer.querySelector(".viewer-image");
var photoCaption = viewer.querySelector("#viewer-caption");
var thumbs = viewer.querySelector(".viewer-thumbs");
var thumbButtons = [];
function buildThumbs() {
thumbs.replaceChildren();
thumbButtons = photos.map(function (link, i) {
var button = document.createElement("button");
button.type = "button";
button.setAttribute("aria-label", "Pokaż zdjęcie " + (i + 1));
var thumb = link.querySelector("img").cloneNode(false);
thumb.removeAttribute("srcset");
thumb.removeAttribute("sizes");
thumb.alt = "";
button.appendChild(thumb);
button.addEventListener("click", function () { showPhoto(i); });
thumbs.appendChild(button);
return button;
});
}
function showPhoto(i) {
currentPhoto = (i + photos.length) % photos.length;
var link = photos[currentPhoto];
fullImage.src = link.href;
fullImage.alt = link.querySelector("img").alt;
photoCaption.textContent = link.dataset.galleryTitle + " · " + (currentPhoto + 1) + " / " + photos.length;
thumbButtons.forEach(function (button, index) {
button.setAttribute("aria-current", index === currentPhoto ? "true" : "false");
});
thumbButtons[currentPhoto].scrollIntoView({block: "nearest", inline: "nearest"});
}
document.addEventListener("click", function (event) {
var link = event.target.closest && event.target.closest('[data-gallery-photo]');
if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button > 0) return;
event.preventDefault();
var group = link.closest('.flight-gallery, .gallery-group') || document;
photos = Array.from(group.querySelectorAll('[data-gallery-photo]'));
buildThumbs();
photoOrigin = link;
viewer.showModal();
document.body.classList.add('gallery-open');
showPhoto(photos.indexOf(link));
});
viewer.querySelector(".viewer-close").addEventListener("click", function () { viewer.close(); });
viewer.querySelector(".viewer-prev").addEventListener("click", function () { showPhoto(currentPhoto - 1); });
viewer.querySelector(".viewer-next").addEventListener("click", function () { showPhoto(currentPhoto + 1); });
viewer.addEventListener("keydown", function (event) {
if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
event.preventDefault();
showPhoto(currentPhoto + (event.key === "ArrowRight" ? 1 : -1));
}
});
viewer.addEventListener("click", function (event) {
if (event.target === viewer) viewer.close();
});
viewer.addEventListener("close", function () {
document.body.classList.remove("gallery-open");
if (photoOrigin) photoOrigin.focus({preventScroll: true});
});
}
var params = new URLSearchParams(window.location.search);
var unitField = document.getElementById("field-unit");
if (unitField && params.get("lokal")) {
unitField.value = "Lokal " + params.get("lokal");
}
var investmentField = document.getElementById("field-investment");
var namesEl = document.getElementById("investment-names");
if (investmentField && namesEl && params.get("inwestycja")) {
try {
var names = JSON.parse(namesEl.textContent);
var slug = params.get("inwestycja");
if (names[slug]) investmentField.value = names[slug];
} catch (err) {
}
}
var contactForm = document.querySelector('.contact-form');
if (contactForm) {
var channel = contactForm.elements.channel;
var formStatus = document.getElementById('form-status');
contactForm.querySelector('[type="submit"]').disabled = false;
function validateChannel() {
var value = channel.value.trim();
var email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
var phone = /^\+?[\d\s().-]+$/.test(value) && value.replace(/\D/g, '').length >= 9 && value.replace(/\D/g, '').length <= 15;
channel.setCustomValidity(value && !email && !phone ? 'Podaj poprawny adres e-mail lub numer telefonu (9–15 cyfr).' : '');
}
contactForm.addEventListener('input', function () { validateChannel(); formStatus.textContent = ''; });
contactForm.addEventListener('submit', function (event) {
event.preventDefault();
validateChannel();
if (!contactForm.reportValidity()) return;
formStatus.textContent = 'Formularz jest poprawnie wypełniony. To próba działania — zapytanie nie zostało wysłane ani zapisane.';
});
}
})();
