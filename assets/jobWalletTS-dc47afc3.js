import{t as s}from"./translate-ea8f1c55.js";const i={archaeologist:{useComputers:!1,speakAncienLanguages:!0,readRunes:!0,makeExcavation:!0,findSecretPassages:!1},spy:{useComputers:!0,speakAncienLanguages:!1,readRunes:!1,makeExcavation:!1,findSecretPassages:!0}},r=()=>WA.player.state.job,u=()=>{WA.player.state.askForJobWalletWebsiteClose=!0},b=()=>WA.player.state.job&&i[WA.player.state.job]?Object.keys(i[WA.player.state.job]).filter(e=>i[WA.player.state.job][e]):null,m=()=>s("views.jobWallet.title",{job:s(`views.jobWallet.jobs.${r()}.name`)}),d=()=>s(`views.jobWallet.jobs.${r()}.attributes`,{name:WA.player.name}),p=()=>s(`views.jobWallet.jobs.${r()}.description`),W=()=>{const e=document.createElement("ul"),n=b();for(let t=0;t<n.length;t++){const o=document.createElement("li");o.innerHTML=s(`views.jobWallet.jobs.${r()}.permissions.${n[t]}`),e.appendChild(o)}return e},g=()=>s("views.jobWallet.close"),y=()=>{u()};document.addEventListener("DOMContentLoaded",()=>{WA.onInit().then(async()=>{console.log("coucou");const e=document.getElementById("photo"),n=document.getElementById("title"),t=document.getElementById("attributes"),o=document.getElementById("description"),l=document.getElementById("permissions"),a=document.getElementById("closeWalletWebsiteButton"),c=await WA.player.getWokaPicture();e&&e.setAttribute("src",c),n&&(n.innerText=m()),t&&(t.innerHTML=d()),o&&(o.innerText=p()),l&&l.appendChild(W()),a&&(a.innerText=g(),a.addEventListener("click",()=>{y()}))}).catch(e=>console.error(e))});