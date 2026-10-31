import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=join(root,'_site');
const site='https://yohannesmulugeta.github.io/Enkupanet/';
const {products}=createRequire(import.meta.url)(join(root,'site-data.js'));
const pages=['', 'zh/', ...products.flatMap(product=>[`products/${product.id}/`,`zh/products/${product.id}/`])];
const titles=new Set();

for(const page of pages){
 const html=await readFile(join(output,page,'index.html'),'utf8');
 const url=site+page;
 const lang=page.startsWith('zh/')?'zh':'en';
 const product=products.find(item=>page.endsWith(`/products/${item.id}/`)||page===`products/${item.id}/`);
 assert.match(html,new RegExp(`<html lang="${lang==='zh'?'zh-CN':'en'}">`),`${page} language`);
 assert.ok(html.includes(`<link rel="canonical" href="${url}"`),`${page} canonical`);
 assert.ok(html.includes(`<meta property="og:url" content="${url}"`),`${page} social URL`);
 assert.ok(html.includes(`<link rel="alternate" hreflang="en" href="${site}${product?`products/${product.id}/`:''}"`),`${page} English alternate`);
 assert.ok(html.includes(`<link rel="alternate" hreflang="zh-CN" href="${site}zh/${product?`products/${product.id}/`:''}"`),`${page} Chinese alternate`);
 const title=html.match(/<title>([^<]+)<\/title>/)?.[1];
 assert.ok(title&&!titles.has(title),`${page} unique title`);
 titles.add(title);
 assert.match(html,/<meta name="description" content="[^"]+"/,`${page} description`);
 if(product){
  assert.ok(html.includes(`<h1>${product[lang]}</h1>`),`${page} product heading`);
  const data=html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1];
  assert.equal(JSON.parse(data)['@type'],'Product',`${page} structured data`);
  assert.ok(html.includes('mailto:enkupanet@gmail.com?subject='),`${page} inquiry`);
 }else{
  assert.equal((html.match(/class="product-card"/g)||[]).length,9,`${page} server-rendered product cards`);
 }
 for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
  const link=match[1];
  if(link.startsWith('#')||/^(mailto:|tel:|https?:|data:)/.test(link))continue;
  const target=new URL(link,url);
  assert.ok(target.pathname.startsWith('/Enkupanet/'),`${page} link remains in site: ${link}`);
  const local=target.pathname.slice('/Enkupanet/'.length);
  const file=join(output,local,target.pathname.endsWith('/')?'index.html':'');
  await stat(file).catch(()=>assert.fail(`${page} missing local link: ${link}`));
 }
}

const sitemap=await readFile(join(output,'sitemap.xml'),'utf8');
assert.equal((sitemap.match(/<loc>/g)||[]).length,pages.length,'sitemap page count');
for(const page of pages)assert.ok(sitemap.includes(`<loc>${site+page}</loc>`),`sitemap: ${page}`);
console.log(`Checked ${pages.length} localized pages, metadata, links, inquiries and sitemap entries.`);
