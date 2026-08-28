window.SUPABASE_URL='https://jeupbfoceqmnpwlklche.supabase.co';
window.SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpldXBiZm9jZXFtbnB3bGtsY2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4Nzc4NjEsImV4cCI6MjEwMzQ1Mzg2MX0.-1NNm67t4HiB-I8fgTZcOwDHVrwmFtTH7T6DnkveXt4';
async function sb(path,options={}){
 const headers=Object.assign({"apikey":window.SUPABASE_ANON_KEY,"Content-Type":"application/json"},options.headers||{});
 const token=localStorage.getItem("sb_access_token"); if(token) headers.Authorization="Bearer "+token;
 const r=await fetch(window.SUPABASE_URL+"/rest/v1/"+path,Object.assign({},options,{headers}));
 const text=await r.text(); let data; try{data=text?JSON.parse(text):null}catch{data=text}
 if(!r.ok) throw new Error(data?.message||data?.error_description||text||"Request failed");
 return data;
}
async function auth(path,body){
 const r=await fetch(window.SUPABASE_URL+"/auth/v1/"+path,{method:"POST",headers:{"apikey":window.SUPABASE_ANON_KEY,"Content-Type":"application/json"},body:JSON.stringify(body)});
 const text=await r.text(); let data; try{data=text?JSON.parse(text):null}catch{data=text}
 if(!r.ok) throw new Error(data?.msg||data?.message||data?.error_description||text||"Authentication failed");
 return data;
}
function sbSession(){try{return JSON.parse(localStorage.getItem("sb_session")||"null")}catch{return null}}
function setSbSession(data){if(data?.access_token){localStorage.setItem("sb_access_token",data.access_token);localStorage.setItem("sb_session",JSON.stringify(data));}}
function clearSbSession(){localStorage.removeItem("sb_access_token");localStorage.removeItem("sb_session");}
