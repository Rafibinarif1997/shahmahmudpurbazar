const DB_KEY="smb_ads_v1",USER_KEY="smb_user_v1",USERS_KEY="smb_users_v1",FAV_KEY="smb_fav_v1";
const categoryMap={
"Vehicles":["Cars","Motorcycles","Bicycles","Auto Rickshaw","Trucks & Buses","Vehicle Parts"],
"Property":["Land","Apartments","Houses","Shops & Commercial Space","Office Space","Property for Rent"],
"Phones & Tablets":["Mobile Phones","Tablets","Phone Accessories","Smart Watches"],
"Electronics":["TV","Laptop & Computer","Camera","Audio","Gaming","Other Electronics"],
"Home, Furniture & Garden":["Furniture","Home Decor","Kitchen","Garden","Appliances"],
"Fashion":["Men","Women","Kids","Shoes","Bags & Accessories","Watches"],
"Beauty & Personal Care":["Cosmetics","Skin Care","Hair Care","Perfume","Health & Personal Care"],
"Services":["Tutoring","Cleaning","Transport","Photography","IT & Digital","Other Services"],
"Repair & Construction":["Electrician","Plumber","AC & Fridge Repair","Construction Materials","Mechanic","Painter"],
"Commercial Equipment & Machinery":["Factory Equipment","Restaurant Equipment","Office Equipment","Tools","Machinery"],
"Leisure & Activities":["Sports","Gym & Fitness","Music","Books","Tickets & Events","Hobbies"],
"Babies & Kids":["Baby Products","Toys","Kids Clothing","Strollers","School Items"],
"Food, Agriculture & Supplies":["Vegetables","Fruits","Fish","Livestock Feed","Seeds","Farm Products"],
"Animals & Pets":["Cattle","Goat","Poultry","Pets","Pet Supplies"],
"Jobs":["Full Time","Part Time","Sales Jobs","Driver Jobs","Office Jobs","Other Jobs"],
"Seeking Work - CVs":["CVs","Job Seekers","Freelancers","Skilled Workers"],
"Business & Industry":["Business for Sale","Wholesale","Retail","Industrial Products","Tools"]
};
const seed=[
{id:"demo1",title:"iPhone 13 128GB — ভালো কন্ডিশন",price:42000,category:"Phones & Tablets",subcategory:"Mobile Phones",location:"শাহমাহমুদপুর",seller:"Demo Seller",phone:"",status:"approved",time:"১২ মিনিট আগে",badge:"VERIFIED"},
{id:"demo2",title:"Bajaj Pulsar 150 — বিক্রি হবে",price:125000,category:"Vehicles",subcategory:"Motorcycles",location:"মহামায়া",seller:"Demo Seller",phone:"",status:"approved",time:"৪৫ মিনিট আগে",badge:"URGENT"},
{id:"demo3",title:"দেশি গরু — সুস্থ ও ভালো জাত",price:110000,category:"Animals & Pets",subcategory:"Cattle",location:"শাহমাহমুদপুর",seller:"Demo Seller",phone:"",status:"approved",time:"১ ঘণ্টা আগে"},
{id:"demo4",title:"কাঠের ডাইনিং টেবিল ও চেয়ার সেট",price:18000,category:"Home, Furniture & Garden",subcategory:"Furniture",location:"মহামায়া",seller:"Demo Seller",phone:"",status:"approved",time:"২ ঘণ্টা আগে"}
];
function ads(){let a=JSON.parse(localStorage.getItem(DB_KEY)||"null");if(!a){localStorage.setItem(DB_KEY,JSON.stringify(seed));return [...seed]}return a}
function save(a){localStorage.setItem(DB_KEY,JSON.stringify(a))}
function money(n){return "৳ "+Number(n||0).toLocaleString("en-US")}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function toast(x){const t=document.getElementById("toast");if(!t)return;t.textContent=x;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function currentUser(){try{return JSON.parse(localStorage.getItem(USER_KEY)||"null")}catch{return null}}
function card(a){return `<article class="product" onclick="location.href='ad-details.html?id=${encodeURIComponent(a.id)}'"><button class="heart" onclick="event.stopPropagation();fav('${a.id}',this)">♡</button><div class="photo">${escapeHtml(a.subcategory||a.category||"AD")}</div><div class="body">${a.badge?`<span class="badge">${escapeHtml(a.badge)}</span>`:""}<h3>${escapeHtml(a.title)}</h3><div class="price">${money(a.price)}</div><div class="meta">⌖ ${escapeHtml(a.location||"চাঁদপুর")} · ${escapeHtml(a.time||"এখন")}</div></div></article>`}
function fav(id,b){let f=JSON.parse(localStorage.getItem(FAV_KEY)||"[]");if(f.includes(id)){f=f.filter(x=>x!==id);if(b)b.textContent="♡";toast("Favourite থেকে সরানো হয়েছে")}else{f.push(id);if(b)b.textContent="♥";toast("Favourite-এ যোগ হয়েছে")}localStorage.setItem(FAV_KEY,JSON.stringify(f))}
function setupHeader(){const form=document.getElementById("searchForm");if(form)form.addEventListener("submit",e=>{e.preventDefault();const q=document.getElementById("search")?.value.trim();location.href="search.html"+(q?"?q="+encodeURIComponent(q):"")});const u=currentUser(),al=document.getElementById("accountLink");if(u&&al){al.textContent=u.name||"Account";al.href="profile.html"}}
document.addEventListener("DOMContentLoaded",()=>{setupHeader();const l=document.getElementById("latestAds");if(l)l.innerHTML=ads().filter(a=>a.status==="approved").slice(0,8).map(card).join("")});
window.marketplaceCategoryMap=categoryMap;window.marketplace={ads,save,money,escapeHtml,currentUser,toast};
