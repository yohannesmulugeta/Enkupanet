import {createRequire} from 'node:module';
import {copyFile, mkdir, readFile, readdir, rm, lstat, stat, writeFile} from 'node:fs/promises';
import {dirname, join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=resolve(root,'_site');
const site='https://enkupanetagrotrading.com/';
const {copy,products,metadata,productInquiryUrl}=createRequire(import.meta.url)(join(root,'site-data.js'));
const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const pageUrl=(product,lang)=>site+(lang==='zh'?'zh/':'')+(product?`products/${product.id}/`:'');
const featuredSpec=product=>{
 const order={sesame:['Purity','Oil content'],coffee:['Processing'],pulses:['Purity'],frankincense:['Grade range']};
 return order[product.family].map(label=>product.specs.find(spec=>spec.en===label)).find(Boolean)||product.specs[0];
};
const labels={
 en:{home:'Home',collection:'Collection',details:'Product details',other:'Explore more products',compare:'Compare products in this family',unlisted:'Not listed in profile',scroll:'Scroll to compare specifications',sourcing:'Discuss this product',prompt:'Tell us the destination, approximate quantity and required specifications. Availability and terms are confirmed per inquiry.',back:'Back to collection',specs:'Specifications',note:'Specifications are from the 2026 company profile. Confirm the requirements for the current lot before trading.',email:'Email a product inquiry',contact:'Contact Enkupanet',page:'Product',family:'Product family'},
 zh:{home:'首页',collection:'产品系列',details:'产品详情',other:'探索更多产品',compare:'同类产品规格对比',unlisted:'公司简介未列明',scroll:'左右滑动查看规格对比',sourcing:'咨询此产品',prompt:'请告知目的地、预计数量及所需规格。供货情况和条款以具体询价确认为准。',back:'返回产品系列',specs:'产品指标',note:'规格源自2026年公司简介。交易前请确认当前批次的具体要求。',email:'发送产品询价',contact:'联系 Enkupanet',page:'产品',family:'产品类别'}
};

function renderCard(product,lang){
 const lead=featuredSpec(product);
 const other=lang==='zh'?'en':'zh';
 return `<a class="product-card" href="products/${product.id}/" data-product="${product.id}" aria-label="${escapeHtml(product[lang]+' — '+copy[lang].detailButton)}"><div class="product-card-img"><img loading="lazy" decoding="async" src="${lang==='zh'?'../':''}assets/${escapeHtml(product.img)}" alt="${escapeHtml(product[lang])}"></div><div class="product-card-info"><div class="product-card-top"><span>${escapeHtml(copy[lang].categories[product.family])}</span><span aria-hidden="true">↗</span></div><h3>${escapeHtml(product[lang])}</h3><p class="product-local">${escapeHtml(product[other])}</p><p class="product-brief">${escapeHtml(product[lang==='zh'?'descZh':'descEn'])}</p><div class="product-card-spec"><span class="product-card-spec-label">${escapeHtml(lead[lang])}</span><span class="product-card-spec-value">${escapeHtml(lead[lang==='zh'?'vZh':'vEn'])}</span></div></div></a>`;
}

function localizeSource(html,lang){
 if(lang==='en')return html;
 for(const [kind,attribute] of [['data-i18n-html','html'],['data-i18n','text']]){
  const pattern=new RegExp(`<([a-z][a-z0-9]*)\\b([^>]*\\b${kind}="([^"]+)"[^>]*)>[\\s\\S]*?<\\/\\1>`,'g');
  html=html.replace(pattern,(match,tag,attributes,key)=>key in copy.zh?`<${tag}${attributes}>${attribute==='html'?copy.zh[key]:escapeHtml(copy.zh[key])}</${tag}>`:match);
 }
 return html;
}

function replaceMeta(html,lang){
 const home=pageUrl(null,lang);
 const title=metadata[lang].title;
 const description=metadata[lang].description;
 const replace=(pattern,value)=>{if(!pattern.test(html))throw new Error(`Missing metadata: ${pattern}`);html=html.replace(pattern,value)};
 replace(/<html lang="[^"]+">/,`<html lang="${lang==='zh'?'zh-CN':'en'}">`);
 replace(/<title>[^<]*<\/title>/,`<title>${escapeHtml(title)}</title>`);
 replace(/<meta name="description" content="[^"]*" \/>/,`<meta name="description" content="${escapeHtml(description)}" />`);
 replace(/<link rel="canonical" href="[^"]*" \/>/,`<link rel="canonical" href="${home}" />`);
 replace(/<link rel="alternate" hreflang="zh-CN" href="[^"]*" \/>/,`<link rel="alternate" hreflang="zh-CN" href="${pageUrl(null,'zh')}" />`);
 replace(/<meta property="og:url" content="[^"]*" \/>/,`<meta property="og:url" content="${home}" />`);
 replace(/<meta property="og:title" content="[^"]*" \/>/,`<meta property="og:title" content="${escapeHtml(title)}" />`);
 replace(/<meta property="og:description" content="[^"]*" \/>/,`<meta property="og:description" content="${escapeHtml(description)}" />`);
 replace(/<meta property="og:locale" content="[^"]*" \/>/,`<meta property="og:locale" content="${lang==='zh'?'zh_CN':'en_US'}" />`);
 replace(/<meta name="twitter:title" content="[^"]*" \/>/,`<meta name="twitter:title" content="${escapeHtml(title)}" />`);
 replace(/<meta name="twitter:description" content="[^"]*" \/>/,`<meta name="twitter:description" content="${escapeHtml(description)}" />`);
 return html;
}

function renderHome(source,lang){
 let html=replaceMeta(localizeSource(source,lang),lang);
 html=html.replace('<div class="product-grid" id="productGrid"></div>',`<div class="product-grid" id="productGrid">${products.map(product=>renderCard(product,lang)).join('')}</div>`);
 if(lang==='zh'){
  html=html.replace(/(href|src)="(assets\/|styles\.css|premium\.css|site-data\.js|app\.js)/g,'$1="../$2');
  html=html.replace('aria-label="Enkupanet Home"','aria-label="Enkupanet 首页"');
 }
 return html;
}

function comparison(product,lang){
 const fields={sesame:['Origin','Purity','Oil content','Moisture','FFA'],pulses:['Botanical name','Purity','Moisture','Size','Packing']}[product.family];
 if(!fields)return '';
 const family=products.filter(item=>item.family===product.family);
 const words=labels[lang];
 const headers=family.map(item=>`<th scope="col"><a href="../${item.id}/"${item.id===product.id?' aria-current="page"':''}>${escapeHtml(item[lang])}</a></th>`).join('');
 const rows=fields.map(field=>{
  const known=family.flatMap(item=>item.specs).find(spec=>spec.en===field);
  const cells=family.map(item=>{const spec=item.specs.find(entry=>entry.en===field);return `<td>${spec?escapeHtml(spec[lang==='zh'?'vZh':'vEn']):`<span class="unlisted">${words.unlisted}</span>`}</td>`}).join('');
  return `<tr><th scope="row">${escapeHtml(known[lang])}</th>${cells}</tr>`;
 }).join('');
 return `<section class="compare-section" aria-labelledby="compare-heading"><div class="detail-wrap"><div class="section-label">${escapeHtml(words.family)} / ${escapeHtml(copy[lang].categories[product.family])}</div><h2 id="compare-heading">${escapeHtml(words.compare)}</h2><p class="compare-hint">${escapeHtml(words.scroll)}</p><div class="compare-scroll" tabindex="0" role="region" aria-label="${escapeHtml(words.scroll)}"><table><thead><tr><th scope="col">${escapeHtml(words.specs)}</th>${headers}</tr></thead><tbody>${rows}</tbody></table></div></div></section>`;
}

function productFooter(lang,homeRelative,rootRelative){
 const words=copy[lang];
 return `<footer id="connect">
    <div class="detail-wrap footer-inner">
      <div class="footer-topline"><span>ENKUPANET / ETHIOPIA</span><span>${escapeHtml(words.footerProducts)}</span></div>
      <div class="footer-grid">
        <div class="footer-main">
          <div class="footer-brand"><img src="${rootRelative}assets/brand-mark.png" alt="" width="70" height="70"><span>ENKUPANET<small>AGRO TRADING ONE MEMBER PLC</small></span></div>
          <h2>${words.footerHeading}</h2>
          <p class="footer-intro">${escapeHtml(words.footerContactIntro)}</p>
          <a class="footer-email" href="mailto:enkupanet@gmail.com">enkupanet@gmail.com <span aria-hidden="true">↗</span></a>
          <a class="footer-phone" href="tel:+251913188830">+251 913 188 830</a>
          <p class="footer-contact-person">Netsanet Frew Temesgen <span>— CEO</span></p>
        </div>
        <nav class="footer-directory" aria-labelledby="footerExploreHeading">
          <h3 id="footerExploreHeading">${escapeHtml(words.footerExplore)}</h3>
          <a href="${homeRelative}#catalogue">${escapeHtml(words.footerCatalog)}</a>
          <a href="${homeRelative}#origins">${escapeHtml(words.footerOrigins)}</a>
          <a href="${homeRelative}#approach">${escapeHtml(words.footerApproach)}</a>
          <span class="footer-directory-label">${escapeHtml(words.footerProductLabel)}</span>
          <p>${escapeHtml(words.footerProducts)}</p>
        </nav>
      </div>
      <div class="footer-bottom"><span>© ${new Date().getFullYear()} ENKUPANET AGRO TRADING ONE MEMBER PLC</span><a href="#main">${escapeHtml(words.backToTop)}</a><details class="credits"><summary>${escapeHtml(words.credits)}</summary><p>${escapeHtml(words.creditsText)}</p><p>Farm photo / 农田照片: <a href="https://commons.wikimedia.org/wiki/File:Beautiful_green_farm_land_in_Eastern_Ethiopia.jpg">Lemazelalem3 / Wikimedia Commons</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a> · cropped, resized and adjusted / 已裁剪、调整尺寸及调色.</p></details></div>
    </div>
  </footer>`;
}

function productPage(product,lang){
 const words=labels[lang];
 const other=lang==='zh'?'en':'zh';
 const rootRelative=lang==='zh'?'../../../':'../../';
 const homeRelative='../../';
 const image=product.detailImg||product.img;
 const description=product[lang==='zh'?'descZh':'descEn'];
 const canonical=pageUrl(product,lang);
 const related=products.filter(item=>item.id!==product.id).sort((a,b)=>(a.family===product.family?-1:1)-(b.family===product.family?-1:1)).slice(0,3);
 const highlights=product.specs.slice(0,3).map(spec=>`<div><dt>${escapeHtml(spec[lang])}</dt><dd>${escapeHtml(spec[lang==='zh'?'vZh':'vEn'])}</dd></div>`).join('');
 const specRows=product.specs.map(spec=>`<tr><th scope="row">${escapeHtml(spec[lang])}</th><td>${escapeHtml(spec[lang==='zh'?'vZh':'vEn'])}</td></tr>`).join('');
 const relatedCards=related.map(item=>`<a class="related-card" href="../${item.id}/"><img src="${rootRelative}assets/${escapeHtml(item.img)}" alt="" loading="lazy"><span>${escapeHtml(copy[lang].categories[item.family])}</span><strong>${escapeHtml(item[lang])}</strong><small>${escapeHtml(item[other])}</small></a>`).join('');
 const data=JSON.stringify({'@context':'https://schema.org','@type':'Product',name:product[lang],description,image:site+'assets/'+image,url:canonical}).replace(/</g,'\\u003c');
 return `<!doctype html>
<html lang="${lang==='zh'?'zh-CN':'en'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#0E752C" />
  <meta name="description" content="${escapeHtml(description)}" />
  <title>${escapeHtml(product[lang])} — Enkupanet</title>
  <link rel="canonical" href="${canonical}" />
  <link rel="alternate" hreflang="en" href="${pageUrl(product,'en')}" />
  <link rel="alternate" hreflang="zh-CN" href="${pageUrl(product,'zh')}" />
  <link rel="alternate" hreflang="x-default" href="${pageUrl(product,'en')}" />
  <meta property="og:type" content="product" />
  <meta property="og:site_name" content="Enkupanet Agro Trading One Member PLC" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:title" content="${escapeHtml(product[lang])} — Enkupanet" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:locale" content="${lang==='zh'?'zh_CN':'en_US'}" />
  <meta property="og:image" content="${site}assets/${escapeHtml(image)}" />
  <meta property="og:image:alt" content="${escapeHtml(product[lang])}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(product[lang])} — Enkupanet" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${site}assets/${escapeHtml(image)}" />
  <script type="application/ld+json">${data}</script>
  <link rel="icon" href="${rootRelative}assets/brand-mark.png" type="image/png" />
  <link rel="preload" href="${rootRelative}assets/${escapeHtml(image)}" as="image" />
  <link rel="stylesheet" href="${rootRelative}styles.css" />
  <link rel="stylesheet" href="${rootRelative}premium.css?v=20261101a11y" />
  <link rel="stylesheet" href="${rootRelative}product.css?v=20261101a11y" />
</head>
<body>
  <a class="skip-link" href="#main">${lang==='zh'?'跳转到正文':'Skip to content'}</a>
  <div class="topline" aria-hidden="true"><span>${escapeHtml(copy[lang].topline)}</span><span class="topline-right">ENKUPANET / ETHIOPIA</span></div>
  <header class="detail-header"><div class="detail-wrap detail-nav"><a class="brand" href="${homeRelative}" aria-label="Enkupanet ${words.home}"><img src="${rootRelative}assets/brand-mark.png" alt="" width="47" height="47"><span class="brand-copy"><strong>ENKUPANET</strong><small>AGRO TRADING ONE MEMBER PLC</small></span></a><nav class="detail-links" aria-label="${words.home}"><a href="${homeRelative}#catalogue">${escapeHtml(copy[lang].navCollection)}</a><a href="${homeRelative}#origins">${escapeHtml(copy[lang].originLabel)}</a><a href="${homeRelative}#approach">${escapeHtml(copy[lang].navApproach)}</a><a href="${homeRelative}#connect">${escapeHtml(copy[lang].navContact)}</a></nav><div class="detail-languages" role="group" aria-label="Language / 语言"><a href="${rootRelative}products/${product.id}/"${lang==='en'?' aria-current="page"':''}>EN</a><span>/</span><a href="${rootRelative}zh/products/${product.id}/"${lang==='zh'?' aria-current="page"':''}>中文</a></div><details class="detail-mobile-menu"><summary aria-label="${lang==='zh'?'打开菜单':'Open menu'}">☰</summary><nav aria-label="${lang==='zh'?'手机导航':'Mobile navigation'}"><a href="${homeRelative}#catalogue">${escapeHtml(copy[lang].navCollection)}</a><a href="${homeRelative}#origins">${escapeHtml(copy[lang].originLabel)}</a><a href="${homeRelative}#approach">${escapeHtml(copy[lang].navApproach)}</a><a href="${homeRelative}#connect">${escapeHtml(copy[lang].navContact)}</a></nav></details></div></header>
  <main id="main" class="product-page">
    <nav class="detail-wrap breadcrumb" aria-label="Breadcrumb"><a href="${homeRelative}">${words.home}</a><span aria-hidden="true">/</span><a href="${homeRelative}#catalogue">${words.collection}</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(product[lang])}</span></nav>
    <section class="detail-hero"><div class="detail-wrap detail-hero-grid"><div class="detail-hero-copy"><span class="section-label">${escapeHtml(copy[lang].categories[product.family])} / ${String(products.indexOf(product)+1).padStart(2,'0')}</span><h1>${escapeHtml(product[lang])}</h1><p class="detail-translation" lang="${lang==='zh'?'en':'zh-CN'}">${escapeHtml(product[other])}</p><p class="detail-lede">${escapeHtml(description)}</p><dl class="detail-highlights">${highlights}</dl><div class="detail-hero-actions"><a class="detail-primary" href="${escapeHtml(productInquiryUrl(product,lang))}">${words.email} <span aria-hidden="true">↗</span></a><a class="detail-text-link" href="#specifications">${words.specs} ↓</a></div></div><div class="detail-photo"><img src="${rootRelative}assets/${escapeHtml(image)}" alt="${escapeHtml(product[lang])}" fetchpriority="high" decoding="async"><span>${escapeHtml(copy[lang].categories[product.family])}</span></div></div></section>
    <section class="detail-content detail-wrap" id="specifications"><div class="detail-specifications"><span class="section-label">${words.page} / ${words.details}</span><h2>${words.specs}</h2><table><tbody>${specRows}</tbody></table><p class="detail-note">${words.note}</p></div><div class="detail-inquiry"><span class="section-label">ENKUPANET / B2B</span><h2>${words.sourcing}</h2><p>${words.prompt}</p><a class="detail-primary" href="${escapeHtml(productInquiryUrl(product,lang))}">${words.email} <span aria-hidden="true">↗</span></a><a class="detail-contact" href="tel:+251913188830">+251 913 188 830</a></div></section>
    ${comparison(product,lang)}
    <section class="related-section detail-wrap"><div class="related-head"><div><span class="section-label">${words.collection}</span><h2>${words.other}</h2></div><a href="${homeRelative}#catalogue">${words.back} ↗</a></div><div class="related-grid">${relatedCards}</div></section>
  </main>
  ${productFooter(lang,homeRelative,rootRelative)}
</body>
</html>`;
}

async function writeOutput(relativePath,content){
 const destination=resolve(output,relativePath);
 if(relative(output,destination).startsWith('..'))throw new Error('Output path escapes _site');
 await mkdir(dirname(destination),{recursive:true});
 await writeFile(destination,content,'utf8');
}

async function build(){
 if(relative(root,output)!=='_site')throw new Error('Unexpected output directory');
 try{if((await lstat(output)).isSymbolicLink())throw new Error('_site must not be a symlink')}catch(error){if(error.code!=='ENOENT')throw error}
 if(products.length!==9||new Set(products.map(p=>p.id)).size!==9)throw new Error('Expected nine unique products');
 for(const product of products){
  if(!/^[a-z0-9-]+$/.test(product.id))throw new Error('Unsafe product ID');
  for(const name of [product.img,product.detailImg].filter(Boolean))await stat(join(root,'assets',name));
 }
 await rm(output,{recursive:true,force:true});
 await mkdir(join(output,'assets'),{recursive:true});
 for(const name of await readdir(join(root,'assets'))){
  const source=join(root,'assets',name);
  if((await stat(source)).isFile())await copyFile(source,join(output,'assets',name));
 }
 for(const name of ['styles.css','premium.css','product.css','app.js','site-data.js','robots.txt','sitemap.xml'])await copyFile(join(root,name),join(output,name));
 await writeFile(join(output,'.nojekyll'),'');
 const source=await readFile(join(root,'index.html'),'utf8');
 await writeOutput('index.html',renderHome(source,'en'));
 await writeOutput('zh/index.html',renderHome(source,'zh'));
 for(const product of products)for(const lang of ['en','zh'])await writeOutput(`${lang==='zh'?'zh/':''}products/${product.id}/index.html`,productPage(product,lang));
 console.log(`Built 2 localized home pages and ${products.length*2} static product pages in _site`);
}

await build();
