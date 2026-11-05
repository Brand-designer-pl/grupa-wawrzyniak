let active=null;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
export async function openUnitFlight(config,{animate=true,origin=null}={}) {
if(active)return;
const unitId=String(config.unitId||'2'),label='Lokal '+unitId,mirror=config.mirror?' scaleX(-1)':'';
const videoEnabled=config.video.enabled!==false;
const motionEnabled=videoEnabled&&animate&&!reduced.matches;
const sourceImage=origin?.closest('[data-unit-selector]')?.querySelector('.selector-media img')||document.querySelector('[data-unit-selector] .selector-media img');
const fullSourceRect=sourceImage?.getBoundingClientRect();
const crop=config.video.sourceCrop||[0,0,1,1];
let sourceRect=fullSourceRect?{left:fullSourceRect.left+crop[0]*fullSourceRect.width,top:fullSourceRect.top+crop[1]*fullSourceRect.height,width:crop[2]*fullSourceRect.width,height:crop[3]*fullSourceRect.height}:null;
const root=document.createElement('section');root.className='flight-screen flight-preparing';if(config.video.transitionOnly)root.classList.add('flight-transition-only');if(!motionEnabled)root.classList.add('flight-static');if(config.mirror)root.classList.add('flight-mirrored');root.setAttribute('aria-label',label+' — widok kondygnacji');root.tabIndex=-1;
root.innerHTML='<div class="flight-toolbar"><button type="button" class="flight-back">← Wróć do wyboru lokalu</button><span>Lokal 2</span><button type="button" class="flight-skip">Pomiń przelot</button></div><div class="flight-layout"><aside class="flight-facts"><h2>Lokal 2</h2><div class="flight-tabs" role="group" aria-label="Kondygnacja"><button type="button" data-level="przyziemie" aria-pressed="true">Parter</button><button type="button" data-level="pietro" aria-pressed="false">Piętro</button></div><dl class="flight-rooms"></dl><p class="flight-area-note">Powierzchnie według dokumentacji. Bez klatki schodowej.</p><a class="btn flight-contact">Zapytaj o lokal ↗</a></aside><div class="flight-stage"><img class="flight-poster" alt="Front budynku, prawa połowa — lokal 2"><canvas aria-hidden="true"></canvas><img class="flight-floor" alt="Widok parteru lokalu 2 z góry"><button class="flight-floor-arrow flight-floor-prev" type="button" aria-label="Zmień kondygnację">←</button><button class="flight-floor-arrow flight-floor-next" type="button" aria-label="Zmień kondygnację">→</button></div></div><p class="flight-caption"></p><p class="flight-live" role="status" aria-live="polite"></p>';
root.innerHTML=root.innerHTML.replaceAll('Lokal 2',label).replaceAll('lokalu 2','lokalu '+unitId).replaceAll('prawa połowa',config.mirror?'lewa połowa':'prawa połowa');
const extra=document.createElement('div');extra.className='flight-details';
const info=config.details?.[unitId];
if(info){
const heading=document.createElement('h2');heading.textContent=label+' — szczegóły';extra.append(heading);
const list=document.createElement('dl');list.className='flight-summary';
const area=n=>n.toLocaleString('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2})+' m²';
for(const [name,value] of [['Powierzchnia całkowita',area(info.area)],['Parter',area(info.ground)],['Piętro',area(info.upper)],['Garaż w bryle',area(info.garage)],['Pokoje',String(info.roomCount)],['Cena',info.price]]){
const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=name;dd.textContent=value;row.append(dt,dd);list.append(row);
}
extra.append(list);const cta=document.createElement('a');cta.className='btn';cta.href=config.contact;cta.textContent='Zapytaj o lokal ↗';extra.append(cta);
}
if(config.gallery?.length){
const title=document.createElement('h2');title.textContent='Galeria';extra.append(title);
const note=document.createElement('p');note.textContent='Realizacja referencyjna — ten sam projekt w innej lokalizacji';extra.append(note);
const gallery=document.createElement('div');gallery.className='flight-gallery';
for(const item of config.gallery){const link=document.createElement('a'),image=document.createElement('img');link.href=item.src;link.target='_blank';link.rel='noopener';image.src=item.thumb;image.alt=item.alt;image.loading='lazy';link.append(image);gallery.append(link);}extra.append(gallery);
}
root.append(extra);
const more=document.createElement('button');more.type='button';more.className='flight-more';more.textContent='Szczegóły lokalu ↓';more.addEventListener('click',()=>root.scrollTo({top:extra.offsetTop-35,behavior:reduced.matches?'instant':'smooth'}));root.querySelector('.flight-facts').append(more);
const host=document.querySelector('main');host.appendChild(root);
const stage=root.querySelector('.flight-stage'),poster=root.querySelector('.flight-poster'),canvas=root.querySelector('canvas'),floor=root.querySelector('.flight-floor'),facts=root.querySelector('.flight-facts');
canvas.remove();
const video=document.createElement('video');video.className='flight-video';video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='auto';video.setAttribute('aria-hidden','true');
const lastFrame=document.createElement('img');lastFrame.className='flight-last';lastFrame.alt='';lastFrame.setAttribute('aria-hidden','true');
stage.insertBefore(video,floor);stage.insertBefore(lastFrame,floor);
if(motionEnabled){video.src=config.video.src;video.poster=config.video.first;lastFrame.src=config.video.last;poster.src=config.video.first;}
floor.src=config.images.przyziemie;
root.querySelector('.flight-caption').textContent='';
if(!motionEnabled)root.querySelector('.flight-skip').hidden=true;
root.querySelector('.flight-contact').href=config.contact;
let flightTransform='',destinationTransform='translate(0,0) scale(1)',motionAnimations=[],frameRequest=0;
const nativeFrames=typeof video.requestVideoFrameCallback==='function';
function stopSync(){if(frameRequest){if(nativeFrames)video.cancelVideoFrameCallback(frameRequest);else cancelAnimationFrame(frameRequest);frameRequest=0;}}
function syncFrame(now,metadata){
frameRequest=0;if(closed||(finished&&!returning))return;
const raw=Math.min(1,(metadata?.mediaTime??video.currentTime)/(video.duration||config.video.durationSeconds||8));
const progress=returning?1-raw:raw;
if(returning)document.body.style.setProperty('--return-reveal',String(Math.max(0,Math.min(1,(raw-.72)/.28))));
motionAnimations.forEach(a=>a.currentTime=(config.video.motionDurationMs||1750)*progress);
if(!document.hidden)frameRequest=nativeFrames?video.requestVideoFrameCallback(syncFrame):requestAnimationFrame(syncFrame);
}
function startSync(){stopSync();syncFrame();}
let returning=false,returnRestore=true;
let closed=false,finished=false,level='przyziemie',playbackTimer=0,settleAnimation=null,playbackStarted=false,pushed=false,revealRequested=false,waitingForFloor=false;
const controller=new AbortController(),oldScroll=scrollY,oldHref=location.href;
const blocked=[...host.children].filter(e=>e!==root).concat([...document.querySelectorAll('.site-footer')]);
blocked.forEach(e=>e.inert=true);
document.body.classList.add('flight-mode','flight-preparing');
const nav=document.querySelector('.site-nav');
function fit(){document.documentElement.style.setProperty('--flight-nav',Math.ceil(nav.getBoundingClientRect().bottom)+'px');if(root.classList.contains('flight-preparing'))alignStart();}
fit();
function alignStart(){
if((!motionEnabled&&!returning)||!sourceImage)return;
const rect=sourceImage.getBoundingClientRect();
sourceRect={left:rect.left+crop[0]*rect.width,top:rect.top+crop[1]*rect.height,width:crop[2]*rect.width,height:crop[3]*rect.height};
const bounds=stage.getBoundingClientRect();
const movieScale=Math.min(bounds.width/(config.video.width||1280),bounds.height/(config.video.height||960));
const scale=sourceRect.width/((config.video.posterContentWidth||1178)*movieScale);
const posterCrop=config.video.posterCrop||[119,77,1041,1126];
const dx=sourceRect.left+sourceRect.width/2-(bounds.left+bounds.width/2)-(posterCrop[0]+posterCrop[2]/2-640)*movieScale*scale;
const dy=sourceRect.top+sourceRect.height/2-(bounds.top+bounds.height/2)-(posterCrop[1]+posterCrop[3]/2-640)*movieScale*scale;
const transform='translate('+dx+'px,'+dy+'px) scale('+scale+')';
flightTransform=transform;poster.style.transform=transform+mirror;video.style.transform=transform+mirror;
root.classList.add('flight-measure');
const target=stage.getBoundingClientRect();
root.classList.remove('flight-measure');
const floorCrop=config.video.floorCrop||[0,0,1,1];
const floorAspect=floor.naturalWidth/floor.naturalHeight||541/1193;
const targetH=Math.min(target.height,target.width/floorAspect);
const side=Math.min(bounds.width,bounds.height);
const endScale=targetH/(floorCrop[3]*side);
const endX=target.left+target.width/2-(bounds.left+bounds.width/2)-(floorCrop[0]+floorCrop[2]/2-.5)*side*endScale;
const endY=target.top+target.height/2-(bounds.top+bounds.height/2)-(floorCrop[1]+floorCrop[3]/2-.5)*side*endScale;
destinationTransform=`translate(${endX}px,${endY}px) scale(${endScale})`;
}
const imageReady=img=>new Promise((resolve,reject)=>{
if(controller.signal.aborted){resolve();return;}
if(img.complete){img.naturalWidth?resolve():reject(Error('Rzut niedostępny'));return;}
const cleanup=()=>{clearTimeout(timer);img.removeEventListener('load',loaded);img.removeEventListener('error',failed);controller.signal.removeEventListener('abort',aborted);};
const loaded=()=>{cleanup();resolve();};
const failed=()=>{cleanup();reject(Error('Rzut niedostępny'));};
const aborted=()=>{cleanup();resolve();};
const timer=setTimeout(failed,15000);
img.addEventListener('load',loaded,{once:true});img.addEventListener('error',failed,{once:true});controller.signal.addEventListener('abort',aborted,{once:true});
});
function commitLevel(next){level=next;floor.src=config.images[next];floor.alt='Widok '+(next==='pietro'?'piętra':'parteru')+' lokalu '+unitId+' z góry';root.querySelectorAll('[data-level]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.level===next)));const dl=root.querySelector('.flight-rooms');dl.replaceChildren();let total=0;for(const room of config.rooms[next]){const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=room.name;dd.textContent=room.area_m2.toLocaleString('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2})+' m²';row.append(dt,dd);dl.appendChild(row);total+=room.area_m2;}const row=document.createElement('div');row.className='flight-total';const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent='Razem';dd.textContent=total.toLocaleString('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2})+' m²';row.append(dt,dd);dl.appendChild(row);root.querySelector('.flight-live').textContent=label+' — '+(next==='pietro'?'Piętro':'Parter');}
let levelRequest=0;
const loadError=document.createElement('p');loadError.className='flight-area-note';loadError.setAttribute('role','status');loadError.hidden=true;facts.querySelector('.flight-tabs').after(loadError);
async function setLevel(next){
const request=++levelRequest;loadError.hidden=true;stage.setAttribute('aria-busy','true');
const candidate=new Image();candidate.src=config.images[next];
try {
await imageReady(candidate);
if(closed||request!==levelRequest)return;
commitLevel(next);
}catch(error){
if(closed||request!==levelRequest)return;
loadError.textContent='Nie udało się wczytać rzutu. Spróbuj ponownie.';loadError.hidden=false;
}finally{if(!closed&&request===levelRequest)stage.removeAttribute('aria-busy');}
}
commitLevel(level);
facts.inert=true;facts.setAttribute("aria-hidden","true");
const state={root,close,finish};active=state;
function finish(){
if(closed||finished)return;
const movieBounds=video.getBoundingClientRect();
revealRequested=true;clearTimeout(playbackTimer);video.pause();
stopSync();motionAnimations.forEach(a=>a.cancel());motionAnimations=[];poster.style.transform='';video.style.transform='';
if(!floor.complete||!floor.naturalWidth){
if(waitingForFloor)return;
waitingForFloor=true;
imageReady(floor).then(()=>{waitingForFloor=false;if(!closed)finish();}).catch(()=>{
if(closed)return;close();const details=document.querySelector('[data-investment-details]');if(details)details.open=true;location.hash='rzuty';
});
return;
}
finished=true;
if(playbackStarted)root.dataset.motionElapsedMs=String(Math.round(performance.now()-Number(root.dataset.motionStartedAt)));
root.classList.remove('flight-preparing');document.body.classList.remove('flight-preparing');
root.classList.add('flight-finishing');
if(document.activeElement===root.querySelector('.flight-skip'))root.querySelector('.flight-back').focus({preventScroll:true});
root.querySelector('.flight-skip').hidden=true;
facts.inert=false;facts.removeAttribute('aria-hidden');
root.querySelector('.flight-live').textContent='Parter lokalu '+unitId+'. Widok z góry.';
if(!motionEnabled){root.classList.remove('flight-finishing');root.classList.add('flight-ready');floor.style.transform='';return;}
const bounds=movieBounds;
const side=Math.min(bounds.width,bounds.height);
const crop=config.video.floorCrop||[0,0,1,1];
const start={left:bounds.left+(bounds.width-side)/2+crop[0]*side,
top:bounds.top+(bounds.height-side)/2+crop[1]*side,
width:crop[2]*side,height:crop[3]*side};
root.classList.add('flight-ready');
const target=stage.getBoundingClientRect();
const h=Math.min(target.height,target.width/(floor.naturalWidth/floor.naturalHeight));
const dx=start.left+start.width/2-(target.left+target.width/2);
const dy=start.top+start.height/2-(target.top+target.height/2);
const scale=start.height/h;
root.dataset.endpointAlignment=JSON.stringify({dx,dy,scale,ended:video.ended});
if(!reduced.matches&&animate&&!video.ended){
settleAnimation=floor.animate([
{transform:`translate(${dx}px,${dy}px) scale(${scale})`+mirror},
{transform:'translate(0,0) scale(1)'+mirror}
],{duration:300,easing:'cubic-bezier(.22,1,.36,1)'});
settleAnimation.finished.catch(()=>{});
}
root.classList.remove('flight-finishing');
root.classList.add('flight-settled');
}
async function reverseClose(restore=true){
if(closed||returning)return;
if(!finished||!videoEnabled||reduced.matches||!config.video.reverseSrc){close(restore);return;}
root.scrollTop=0;
returning=true;returnRestore=restore;
root.querySelector('.flight-back').disabled=true;
root.querySelectorAll('[data-level],.flight-floor-arrow').forEach(b=>b.disabled=true);
if(level!=='przyziemie'){await setLevel('przyziemie');if(level!=='przyziemie'){close(restore);return;}}
if(closed)return;
stopSync();settleAnimation?.cancel();motionAnimations.forEach(a=>a.cancel());motionAnimations=[];
video.src=config.video.reverseSrc;video.poster=config.video.last;
video.playbackRate=(config.video.durationSeconds||8)/((config.video.motionDurationMs||1750)/1000);video.defaultPlaybackRate=video.playbackRate;
try {
await whenVisible();if(closed)return;
armWatchdog();await video.play();if(closed)return;playbackStarted=true;
root.classList.remove('flight-ready','flight-finishing','flight-settled','flight-static');
root.classList.add('flight-returning','flight-video-playing');
document.body.classList.add('flight-returning');
facts.inert=true;facts.setAttribute('aria-hidden','true');
alignStart();
motionAnimations=[video].map(element=>element.animate([
{transform:flightTransform+mirror},{transform:destinationTransform+mirror}
],{duration:config.video.motionDurationMs||1750,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'}));
motionAnimations.forEach(a=>{a.pause();a.currentTime=config.video.motionDurationMs||1750;});
startSync();armWatchdog();
}catch(error){if(!closed)close(restore);}
}
function close(restore=true){if(closed)return;closed=true;controller.abort();clearTimeout(playbackTimer);video.pause();stopSync();motionAnimations.forEach(a=>a.cancel());settleAnimation?.cancel();video.removeAttribute('src');video.load();blocked.forEach(e=>e.inert=false);document.body.classList.remove('flight-mode','flight-preparing','flight-returning');document.body.style.removeProperty('--return-reveal');root.remove();active=null;if(restore){if(pushed)history.back();else{const backURL=new URL(oldHref);backURL.searchParams.delete('lokal');backURL.hash='';history.replaceState(null,'',backURL.pathname+backURL.search);}}window.scrollTo({top:oldScroll,behavior:'instant'});if(origin?.isConnected)origin.focus({preventScroll:true});window.removeEventListener('resize',fit);document.removeEventListener('visibilitychange',visibility);document.removeEventListener('keydown',key);window.removeEventListener('popstate',pop);window.removeEventListener('pagehide',leaving);reduced.removeEventListener('change',preference);}
async function whenVisible(){if(document.hidden)await new Promise(resolve=>{const done=()=>{if(!document.hidden||controller.signal.aborted){document.removeEventListener('visibilitychange',done);controller.signal.removeEventListener('abort',done);resolve();}};document.addEventListener('visibilitychange',done);controller.signal.addEventListener('abort',done,{once:true});});}
function key(e){if(e.key==='Escape'){e.preventDefault();if(returning)close(returnRestore);else reverseClose();}}
function pop(){if(returning)close(false);else reverseClose(false);}
function leaving(){close(false);}
function preference(){if(reduced.matches){settleAnimation?.cancel();if(returning)close(returnRestore);else finish();}}
function armWatchdog(){clearTimeout(playbackTimer);playbackTimer=setTimeout(()=>{root.dataset.fallback='stalled';if(returning)close(returnRestore);else finish();},30000);}
function visibility(){if(document.hidden){video.pause();stopSync();clearTimeout(playbackTimer);}else if(playbackStarted&&(returning||(!finished&&!revealRequested))&&!reduced.matches&&(animate||returning))video.play().then(()=>{startSync();armWatchdog();}).catch(()=>{if(returning)close(returnRestore);else finish();});}
root.querySelector('.flight-back').addEventListener('click',()=>reverseClose());root.querySelector('.flight-skip').addEventListener('click',finish);
root.querySelectorAll('[data-level]').forEach(b=>b.addEventListener('click',()=>setLevel(b.dataset.level)));
root.querySelectorAll('.flight-floor-arrow').forEach(b=>b.addEventListener('click',()=>setLevel(level==='pietro'?'przyziemie':'pietro')));
window.addEventListener('resize',fit);document.addEventListener('visibilitychange',visibility);document.addEventListener('keydown',key);window.addEventListener('popstate',pop);window.addEventListener('pagehide',leaving);reduced.addEventListener('change',preference);
root.querySelector('.flight-back').focus({preventScroll:true});
if(new URL(location.href).searchParams.get('lokal')!==unitId){history.pushState({unitFlight:true},'',location.pathname+'?lokal='+unitId+'#parter-3d');pushed=true;}
video.addEventListener('timeupdate',()=>{if(playbackStarted&&(!finished||returning)&&!document.hidden)armWatchdog();},{signal:controller.signal});
video.addEventListener('ended',()=>{if(returning)close(returnRestore);else finish();},{signal:controller.signal});
video.addEventListener('error',()=>{root.dataset.fallback='true';if(returning)close(returnRestore);else finish();},{signal:controller.signal});
try {
await Promise.all(motionEnabled?[imageReady(poster),imageReady(floor)]:[imageReady(floor)]);
if(closed||finished)return;
if(!floor.naturalWidth)throw Error('Rzut niedostępny');
if(!motionEnabled||revealRequested){finish();return;}
if(!animate||reduced.matches){finish();return;}
await whenVisible();
if(closed||finished)return;
if(reduced.matches){finish();return;}
fit();alignStart();
video.currentTime=0;
const durationMs=config.video.motionDurationMs||1750;
video.playbackRate=(video.duration||config.video.durationSeconds||8)/(durationMs/1000);
video.defaultPlaybackRate=video.playbackRate;
armWatchdog();
await video.play();
if(closed||finished)return;
playbackStarted=true;root.dataset.motionStartedAt=String(performance.now());
void video.getBoundingClientRect();
root.classList.remove('flight-preparing');document.body.classList.remove('flight-preparing');
root.classList.add('flight-video-playing');
if(flightTransform){
motionAnimations=[video].map(element=>element.animate([
{transform:flightTransform+mirror},{transform:destinationTransform+mirror}
],{duration:durationMs,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'}));
motionAnimations.forEach(a=>{a.pause();a.currentTime=0;});
startSync();
}
armWatchdog();
}catch(error){if(closed)return;root.dataset.fallback='true';finish();if(!floor.naturalWidth){close();document.querySelector('[data-investment-details]').open=true;location.hash='rzuty';}}
}
