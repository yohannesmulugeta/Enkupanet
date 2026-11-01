/* Enkupanet — a lightweight, dependency-free, bilingual company website. */
const {copy, products, origins, metadata, productInquiryUrl} = window.ENK_SITE;
const siteRoot=new URL('.',document.querySelector('script[src*="app.js"]').src);
let language=location.pathname.includes('/zh/')||new URLSearchParams(location.search).get('lang')==='zh'?'zh':'en';
let activeFilter='all';
let activeOrigin=0;
const $=(s)=>document.querySelector(s);
const escapeHTML=(s)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const t=()=>copy[language];
function updateMeta(name,value,attribute='name'){const el=document.querySelector('meta['+attribute+'="'+name+'"]');if(el)el.setAttribute('content',value);}
const homeUrl=(lang=language)=>new URL(lang==='zh'?'zh/':'',siteRoot);
const productUrl=(id,lang=language)=>new URL(`${lang==='zh'?'zh/':''}products/${id}/`,siteRoot);
const assetUrl=name=>new URL('assets/'+name,siteRoot).href;
// Keep relative images, icons and section links anchored to the home page when a quick view updates the URL.
const pageBase=document.createElement('base');
pageBase.href=homeUrl().href;
document.head.prepend(pageBase);
const pathProduct=()=>products.find(p=>location.pathname.endsWith(`/products/${p.id}/`));
function updatePageMeta(){
 const dialog=$('#productDialog');
 const product=dialog.open?products.find(p=>p.id===dialog.dataset.product):null;
 const title=product?`${product[language]} — Enkupanet`:metadata[language].title;
 const description=product?product[language==='zh'?'descZh':'descEn']:metadata[language].description;
 document.title=title;
 updateMeta('description',description);
 updateMeta('og:title',title,'property');
 updateMeta('og:description',description,'property');
 updateMeta('og:locale',language==='zh'?'zh_CN':'en_US','property');
 updateMeta('og:url',product?productUrl(product.id).href:homeUrl().href,'property');
 updateMeta('twitter:title',title);
 updateMeta('twitter:description',description);
 const image=assetUrl(product?.detailImg||product?.img||'green-coffee.webp');
 updateMeta('og:image',image,'property');
 updateMeta('og:image:alt',product?product[language]:'Ethiopian green coffee beans — Enkupanet Agro Trading','property');
 updateMeta('twitter:image',image);
 document.querySelector('link[rel="canonical"]').href=product?productUrl(product.id).href:homeUrl().href;
 document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link=>{
  const lang=link.hreflang==='zh-CN'?'zh':'en';
  link.href=product?productUrl(product.id,lang).href:homeUrl(lang).href;
 });
}
function generalInquiryUrl(){
 const subject=language==='zh'?'Enkupanet 采购咨询':'Enkupanet sourcing inquiry';
 const body=language==='zh'?[
  '您好，Enkupanet团队：','','请根据以下需求提供适用产品的供货情况与交易条款。','',
  '公司名称：','所需产品：','等级或规格：','目的地国家：','预计数量：','联系方式：'
 ]:[
  'Hello Enkupanet team,','','Please advise current availability and applicable terms for this requirement.','',
  'Company:','Product:','Grade or specifications:','Destination country:','Approximate quantity:','Preferred contact:'
 ];
 return 'mailto:enkupanet@gmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body.join('\n'));
}
function localize(){
 document.documentElement.lang=language==='zh'?'zh-CN':'en';
 updatePageMeta();
 $('#mobileToggle').setAttribute('aria-label',$('#mobileToggle').getAttribute('aria-expanded')==='true'?t().menuClose:t().menuOpen);
 document.querySelectorAll('[data-i18n]').forEach(el=>{const key=el.dataset.i18n;if(key in t())el.textContent=t()[key]});
 document.querySelectorAll('[data-i18n-html]').forEach(el=>{const key=el.dataset.i18nHtml;if(key in t())el.innerHTML=t()[key]});
 $('.catalogue-help-link').href=generalInquiryUrl();
 $('.partner-inquiry').href=generalInquiryUrl();
 $('#langEn').classList.toggle('active',language==='en');$('#langZh').classList.toggle('active',language==='zh');
 $('#langEn').setAttribute('aria-pressed',language==='en');$('#langZh').setAttribute('aria-pressed',language==='zh');
 $('#productPrev').setAttribute('aria-label',t().previousProducts);
 $('#productNext').setAttribute('aria-label',t().nextProducts);
 renderProducts();renderSteps();renderOrigins();
 const d=$('#productDialog');if(d.open&&d.dataset.product)fillDialog(products.find(p=>p.id===d.dataset.product));
}
function setLanguage(lang){const url=homeUrl(lang);url.hash=location.hash;location.href=url.href}
function featuredSpec(p){
 const order={sesame:['Purity','Oil content'],coffee:['Processing'],pulses:['Purity'],frankincense:['Grade range']};
 return (order[p.family]||[]).map(name=>p.specs.find(entry=>entry.en===name)).find(Boolean)||p.specs[0];
}
let premiumMotionObserver = null;
function renderProducts(){
 const list=products.filter(p=>activeFilter==='all'||p.family===activeFilter);
 $('#productGrid').innerHTML=list.map(p=>{
  const lead=featuredSpec(p);
  return `<a class="product-card" href="${productUrl(p.id).href}" data-product="${escapeHTML(p.id)}" aria-label="${escapeHTML(p[language]+' — '+t().detailButton)}"><div class="product-card-img"><img loading="lazy" decoding="async" src="${assetUrl(p.img)}" alt="${escapeHTML(p[language])}"></div><div class="product-card-info"><div class="product-card-top"><span>${escapeHTML(t().categories[p.family])}</span><span aria-hidden="true">↗</span></div><h3>${escapeHTML(p[language])}</h3><p class="product-local">${escapeHTML(p[language==='en'?'zh':'en'])}</p><p class="product-brief">${escapeHTML(p[language==='en'?'descEn':'descZh'])}</p>${lead?'<div class="product-card-spec"><span class="product-card-spec-label">'+escapeHTML(lead[language])+'</span><span class="product-card-spec-value">'+escapeHTML(lead[language==='en'?'vEn':'vZh'])+'</span></div>':''}</div></a>`;
 }).join('');
 $('#productGrid').querySelectorAll('[data-product]').forEach(link=>link.addEventListener('click',ev=>{if(ev.button===0&&!ev.metaKey&&!ev.ctrlKey&&!ev.shiftKey&&!ev.altKey){ev.preventDefault();openProduct(link.dataset.product)}}));
 $('#filters').querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b.dataset.filter===activeFilter);b.setAttribute('aria-pressed',b.dataset.filter===activeFilter)});
 $('#productCount').textContent=`${list.length} ${t().productCount}`;
 $('#productGrid').scrollLeft=0;
 if(premiumMotionObserver) registerMotion('.product-grid .product-card', 70);
}
function renderOrigins(){
 $('#originPins').innerHTML=origins.map((origin,i)=>`<span class="origin-pin${i===activeOrigin?' active':''}" style="--x:${origin.x}%;--y:${origin.y}%" aria-hidden="true">${i+1}</span>`).join('');
 $('#originList').innerHTML=origins.map((origin,i)=>`<button type="button" data-origin="${i}" aria-pressed="${i===activeOrigin}" class="${i===activeOrigin?'active':''}"><span>${String(i+1).padStart(2,'0')}</span><strong>${escapeHTML(origin[language])}</strong><small>${escapeHTML(origin[language==='en'?'zh':'en'])}</small></button>`).join('');
 $('#originSelection').textContent=`${t().originSelected}: ${origins[activeOrigin][language]} / ${origins[activeOrigin][language==='en'?'zh':'en']}`;
}
function renderSteps(){
 $('#stepsGrid').innerHTML=t().steps.map((s,i)=>`<div class="step" data-step="${i}"><span class="step-num">0${i+1}</span><div><h3>${escapeHTML(s[0])}</h3><p class="step-cn">${escapeHTML(s[1])}</p><p>${escapeHTML(s[2])}</p></div></div>`).join('');
 if(premiumMotionObserver) registerMotion('.steps-grid .step', 70);
 updateScrollStory();
}
function fillDialog(p){
 if(!p)return;
 const lang=language;
 $('#productDialog').dataset.product=p.id;
 $('#dialogImage').src=assetUrl(p.detailImg||p.img);
 $('#dialogImage').alt=p[lang];
 $('#dialogCategory').textContent=t().categories[p.family];
 $('#dialogTitle').textContent=p[lang];
 $('#dialogDescription').textContent=p[lang==='en'?'descEn':'descZh'];
 $('#dialogSpecHeading').textContent=t().specHeading;
 $('#dialogNote').textContent=t().specNote;
 $('#dialogSpecs').innerHTML=p.specs.map(item=>'<div class="spec-row"><span>'+escapeHTML(item[lang])+'</span><span>'+escapeHTML(item[lang==='en'?'vEn':'vZh'])+'</span></div>').join('');
 $('#dialogInquiry').href=productInquiryUrl(p,lang);
 $('#dialogInquiryLabel').textContent=t().inquiryButton;
 $('#dialogInquiryNote').textContent=t().inquiryNote;
 $('#dialogShare').href=productUrl(p.id).href;
 $('#dialogShare').textContent=t().shareProduct;
 $('#dialogFull').href=productUrl(p.id).href;
 $('#dialogFull').textContent=t().fullProductPage;
}
function openProduct(id,updateHistory=true){
 const p=products.find(p=>p.id===id);if(!p)return;
 if(updateHistory)history.pushState(null,'',productUrl(id));
 fillDialog(p);
 if(!$('#productDialog').open)$('#productDialog').showModal();
 document.body.classList.add('no-scroll');
 updatePageMeta();
}
function closeProduct(){if($('#productDialog').open)$('#productDialog').close();document.body.classList.remove('no-scroll')}
function setFilter(value){activeFilter=value;renderProducts()}
$('#langEn').addEventListener('click',()=>setLanguage('en'));$('#langZh').addEventListener('click',()=>setLanguage('zh'));
$('#filters').addEventListener('click',ev=>{const button=ev.target.closest('[data-filter]');if(button)setFilter(button.dataset.filter)});
$('#originList').addEventListener('click',ev=>{const button=ev.target.closest('[data-origin]');if(button){activeOrigin=Number(button.dataset.origin);renderOrigins()}});
for(const [id,direction] of [['productPrev',-1],['productNext',1]]){
 $('#'+id).addEventListener('click',()=>{
  const card=$('#productGrid .product-card');
  if(card)$('#productGrid').scrollBy({left:direction*(card.getBoundingClientRect().width+17),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
 });
}
document.querySelectorAll('[data-family]').forEach(el=>el.addEventListener('click',()=>setFilter(el.dataset.family)));
$('#dialogClose').addEventListener('click',closeProduct);
$('#productDialog').addEventListener('close',()=>{
 document.body.classList.remove('no-scroll');
 if(pathProduct())history.replaceState(null,'',homeUrl());
 updatePageMeta();
});
$('#productDialog').addEventListener('click',ev=>{if(ev.target===$('#productDialog'))closeProduct()});
$('#dialogShare').addEventListener('click',async ev=>{
 if(!navigator.clipboard?.writeText)return;
 ev.preventDefault();
 try{
  await navigator.clipboard.writeText($('#dialogShare').href);
  $('#dialogShare').textContent=t().linkCopied;
  setTimeout(()=>{$('#dialogShare').textContent=t().shareProduct},2200);
 }catch{location.href=$('#dialogShare').href}
});
addEventListener('popstate',()=>{
 const product=pathProduct();
 if(product)openProduct(product.id,false);else closeProduct();
 updatePageMeta();
});
function setMenuOpen(open){
  const mobile=matchMedia('(max-width: 920px)').matches;
  const active=Boolean(open && mobile);
  $('#mainNav').classList.toggle('open',active);
  document.body.classList.toggle('menu-open',active);
  $('#mobileToggle').setAttribute('aria-expanded',String(active));
  $('#mobileToggle').setAttribute('aria-label',active?t().menuClose:t().menuOpen);
}
$('#mobileToggle').addEventListener('click',()=>setMenuOpen(!$('#mainNav').classList.contains('open')));
matchMedia('(min-width: 921px)').addEventListener('change',()=>setMenuOpen(false));
$('#mainNav').querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenuOpen(false)));
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&$('#mainNav').classList.contains('open')){setMenuOpen(false);$('#mobileToggle').focus()}});
document.addEventListener('click',ev=>{if($('#mainNav').classList.contains('open')&&!$('#mainNav').contains(ev.target)&&!$('#mobileToggle').contains(ev.target))setMenuOpen(false)});
addEventListener('scroll',()=>$('#siteHeader').classList.toggle('scrolled',scrollY>20),{passive:true});
let scrollFrame=0;
function updateScrollStory(){
 const max=document.documentElement.scrollHeight-innerHeight;
 document.documentElement.style.setProperty('--reading-progress',max>0?String(Math.min(1,scrollY/max)):'0');
 const steps=[...document.querySelectorAll('#stepsGrid .step')];
 const target=innerHeight*.45;
 let nearest=null,distance=Infinity;
 for(const step of steps){const rect=step.getBoundingClientRect();const delta=Math.abs(rect.top+rect.height/2-target);if(delta<distance){distance=delta;nearest=step}}
 if(nearest&&$('#approach').getBoundingClientRect().bottom>0&&$('#approach').getBoundingClientRect().top<innerHeight){
  steps.forEach(step=>step.classList.toggle('current',step===nearest));
 }
}
addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;updateScrollStory()})},{passive:true});
addEventListener('resize',updateScrollStory);
$('#year').textContent=new Date().getFullYear();
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}})},{threshold:.08});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el))}else{document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'))}

// Progressive enhancement: scroll reveals without new animation dependencies.
// If motion is disabled, data saving is enabled or IntersectionObserver is
// unavailable, all content stays visible and fully usable.
function registerMotion(selector, staggerMs = 0) {
 if(!premiumMotionObserver) return;
 document.querySelectorAll(selector).forEach((el, index) => {
  if(el.dataset.motionBound === 'true') return;
  el.dataset.motion = 'reveal';
  el.dataset.motionBound = 'true';
  el.style.setProperty('--motion-delay', Math.min(index % 6, 5) * staggerMs + 'ms');
  premiumMotionObserver.observe(el);
 });
}
function initPremiumMotion() {
 const reduced = typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const saveData = Boolean(window.navigator && window.navigator.connection && window.navigator.connection.saveData);
 if(reduced || saveData || !('IntersectionObserver' in window)) return;

 premiumMotionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
   if(!entry.isIntersecting) return;
   entry.target.classList.add('is-in-view');
   premiumMotionObserver.unobserve(entry.target);
  });
 }, {threshold: .08, rootMargin: '0px 0px -5% 0px'});

 registerMotion('.section-intro, .catalogue-top, .catalogue-help, .story-content-inner, .coffee-copy, .origins-panel, .approach-header, .partner-section, .footer-main');
 registerMotion('.category-showcase .feature-card', 95);
 registerMotion('.product-grid .product-card', 70);
 registerMotion('.steps-grid .step', 75);
 document.documentElement.classList.add('motion-ready');
}

const linkedProduct=new URLSearchParams(location.search).get('product');
if(products.some(p=>p.id===linkedProduct))location.replace(productUrl(linkedProduct).href);
else if(language==='zh'&&!location.pathname.includes('/zh/'))location.replace(homeUrl('zh').href+location.hash);
localize();
initPremiumMotion();
updateScrollStory();
