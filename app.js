let currentEvent=null,isSigning=false,lastPoint=null;
const $=id=>document.getElementById(id);
const KEYS={events:"elite_hotel_events",records:"elite_hotel_records"};

function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2500)}
function showPage(id){document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));$(id).classList.add("active");document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.page===id));$("pageTitle").textContent=id.charAt(0).toUpperCase()+id.slice(1);document.querySelector(".sidebar").classList.remove("open");renderAll()}
function showOnly(id){["loginPage","appPage","registerPage"].forEach(x=>$(x).classList.add("hidden"));$(id).classList.remove("hidden")}
function getEvents(){return JSON.parse(localStorage.getItem(KEYS.events)||"[]")}
function saveEvents(v){localStorage.setItem(KEYS.events,JSON.stringify(v))}
function getRecords(){return JSON.parse(localStorage.getItem(KEYS.records)||"[]")}
function saveRecords(v){localStorage.setItem(KEYS.records,JSON.stringify(v))}
function login(){if($("username").value==="admin"&&$("password").value==="admin123"){sessionStorage.setItem("logged","yes");showOnly("appPage");renderAll();toast("Welcome Admin")}else alert("Wrong login details")}
function logout(){sessionStorage.removeItem("logged");showOnly("loginPage")}
function renderAll(){renderStats();renderEvents();renderRecords();renderRecent()}
function renderStats(){const r=getRecords();$("statEvents").textContent=getEvents().length;$("statRecords").textContent=r.length;$("statRooms").textContent=r.filter(x=>x.accommodation==="Yes").length;$("statVip").textContent=r.filter(x=>x.guestType==="VIP Guest").length}
function createEvent(){const name=$("eventName").value.trim(),venue=$("venue").value.trim(),date=$("eventDate").value;if(!name||!venue||!date){alert("Fill event name, venue and date.");return}const event={id:"EVT-"+Date.now(),name,venue,date,capacity:$("capacity").value||"",packageType:$("packageType").value,mealPlan:$("mealPlan").value,columns:$("columns").value.split(",").map(x=>x.trim()).filter(Boolean),createdAt:new Date().toISOString()};const events=getEvents();events.unshift(event);saveEvents(events);["eventName","venue","eventDate","capacity","columns"].forEach(id=>$(id).value="");renderAll();toast("Event created")}
function eventLink(e){return location.origin+location.pathname+"?event="+btoa(unescape(encodeURIComponent(JSON.stringify(e))))}
function renderEvents(){const events=getEvents();if(!events.length){$("eventsList").innerHTML="<p class='muted'>No events created yet.</p>";return}$("eventsList").innerHTML="";events.forEach(e=>{const link=eventLink(e),div=document.createElement("div");div.className="event-card";div.innerHTML=`<h3>${esc(e.name)}</h3><p><b>Venue:</b> ${esc(e.venue)} &nbsp; <b>Date:</b> ${esc(e.date)}</p><p><b>Capacity:</b> ${esc(e.capacity||"Not set")} &nbsp; <b>Package:</b> ${esc(e.packageType)} &nbsp; <b>Meal:</b> ${esc(e.mealPlan)}</p><label>Registration Link<input value="${link}" readonly onclick="this.select()"></label><canvas id="qr-${e.id}" class="qr"></canvas><div class="actions"><a class="button" href="${link}" target="_blank">Open Form</a><a class="button" target="_blank" href="https://wa.me/?text=${encodeURIComponent("Please register here: "+link)}">Share WhatsApp</a><button data-link="${link}" class="copy">Copy Link</button><button data-id="${e.id}" class="downloadqr">Download QR</button><button data-id="${e.id}" class="gold duplicate">Duplicate</button><button data-id="${e.id}" class="danger delete">Delete</button></div><div class="notice">Share this link or QR code with participants.</div>`;$("eventsList").appendChild(div);QRCode.toCanvas($("qr-"+e.id),link,{width:150})});document.querySelectorAll(".copy").forEach(b=>b.onclick=()=>copyText(b.dataset.link));document.querySelectorAll(".downloadqr").forEach(b=>b.onclick=()=>downloadQR(b.dataset.id));document.querySelectorAll(".duplicate").forEach(b=>b.onclick=()=>duplicateEvent(b.dataset.id));document.querySelectorAll(".delete").forEach(b=>b.onclick=()=>deleteEvent(b.dataset.id))}
function copyText(t){navigator.clipboard?navigator.clipboard.writeText(t).then(()=>toast("Link copied")):prompt("Copy link:",t)}
function downloadQR(id){const a=document.createElement("a");a.href=$("qr-"+id).toDataURL("image/png");a.download=id+"_qr.png";a.click()}
function duplicateEvent(id){const e=getEvents().find(x=>x.id===id);if(!e)return;const copy={...e,id:"EVT-"+Date.now(),name:e.name+" Copy",createdAt:new Date().toISOString()};const events=getEvents();events.unshift(copy);saveEvents(events);renderAll();toast("Event duplicated")}
function deleteEvent(id){if(!confirm("Delete event?"))return;saveEvents(getEvents().filter(e=>e.id!==id));renderAll();toast("Event deleted")}
function loadRegister(encoded){try{currentEvent=JSON.parse(decodeURIComponent(escape(atob(encoded))))}catch(e){document.body.innerHTML="<main><div class='panel error'>Invalid registration link.</div></main>";return}$("regTitle").textContent=currentEvent.name;$("regDetails").innerHTML=`<b>Venue:</b> ${esc(currentEvent.venue)}<br><b>Date:</b> ${esc(currentEvent.date)}<br><b>Package:</b> ${esc(currentEvent.packageType||"")}<br><b>Meal Plan:</b> ${esc(currentEvent.mealPlan||"")}`;$("customFields").innerHTML=(currentEvent.columns||[]).map(c=>`<label>${esc(c)}<input class="custom-field" data-column="${esc(c)}"></label>`).join("");showOnly("registerPage");setTimeout(resizeSignature,100)}
function submitRegistration(){const name=$("fullName").value.trim(),id=$("idNumber").value.trim(),phone=$("phone").value.trim();if(!name||!id||!phone){alert("Fill full name, ID/passport and phone.");return}const key=`elite_done_${currentEvent.id}_${id}_${phone}`;if(localStorage.getItem(key)==="yes"){$("message").innerHTML="<div class='error'>Already registered on this device.</div>";return}const custom={};document.querySelectorAll(".custom-field").forEach(i=>custom[i.dataset.column]=i.value.trim());const record={registrationId:"REG-"+Date.now(),eventId:currentEvent.id,eventName:currentEvent.name,venue:currentEvent.venue,date:currentEvent.date,packageType:currentEvent.packageType||"",mealPlan:currentEvent.mealPlan||"",name,idNumber:id,phone,organization:$("organization").value.trim(),email:$("email").value.trim(),guestType:$("guestType").value,accommodation:$("accommodation").value,mealPreference:$("mealPreference").value,customValues:custom,signature:$("signatureCanvas").toDataURL("image/png"),submittedAt:new Date().toLocaleString()};localStorage.setItem(key,"yes");downloadFile(record.registrationId+"_"+name.replaceAll(" ","_")+".json",JSON.stringify(record,null,2),"application/json");$("message").innerHTML="<div class='success'><h3>Registration Completed</h3><p>Your registration file has downloaded. Send it to the administrator.</p></div>";["fullName","idNumber","phone","organization","email"].forEach(x=>$(x).value="");document.querySelectorAll(".custom-field").forEach(i=>i.value="");clearSignature()}
async function importFiles(){const files=$("importFiles").files;if(!files.length){alert("Choose registration files.");return}const records=getRecords();for(const file of files){try{const r=JSON.parse(await file.text());if(!records.some(x=>x.eventId===r.eventId&&x.idNumber===r.idNumber&&x.phone===r.phone))records.push(r)}catch(e){alert("Invalid file skipped: "+file.name)}}saveRecords(records);renderAll();toast("Files imported")}
function renderRecords(){const records=getRecords();if(!records.length){$("recordsTable").innerHTML="<p class='muted'>No imported records.</p>";return}const custom=[...new Set(records.flatMap(r=>Object.keys(r.customValues||{})))];const heads=custom.map(c=>`<th>${esc(c)}</th>`).join("");const rows=records.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.eventName)}</td><td>${esc(r.venue)}</td><td>${esc(r.name)}</td><td>${esc(r.idNumber)}</td><td>${esc(r.phone)}</td><td>${esc(r.organization||"")}</td><td>${esc(r.email||"")}</td><td>${esc(r.guestType||"")}</td><td>${esc(r.accommodation||"")}</td><td>${esc(r.mealPreference||"")}</td>${custom.map(c=>`<td>${esc(r.customValues?.[c]||"")}</td>`).join("")}<td><img class="sig-img" src="${r.signature}"></td><td>${esc(r.submittedAt)}</td></tr>`).join("");$("recordsTable").innerHTML=`<table><thead><tr><th>No.</th><th>Event</th><th>Venue</th><th>Name</th><th>ID</th><th>Phone</th><th>Organization</th><th>Email</th><th>Guest</th><th>Accommodation</th><th>Meal</th>${heads}<th>Signature</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table>`}
function renderRecent(){const r=getRecords().slice(-5).reverse();$("recentRecords").innerHTML=r.length?r.map(x=>`<p><b>${esc(x.name)}</b><br><span class="muted">${esc(x.eventName)} • ${esc(x.submittedAt)}</span></p>`).join(""):"<p class='muted'>No records yet.</p>"}
function exportRows(filterFn,name){const rows=getRecords().filter(filterFn);if(!rows.length){alert("No matching records.");return}const headers=["Event","Venue","Name","ID","Phone","Organization","Email","Guest Type","Accommodation","Meal","Date"];const body=rows.map(r=>[r.eventName,r.venue,r.name,r.idNumber,r.phone,r.organization,r.email,r.guestType,r.accommodation,r.mealPreference,r.submittedAt]);const csv=[headers,...body].map(row=>row.map(v=>`"${String(v||"").replace(/"/g,'""')}"`).join(",")).join("\n");downloadFile(name,csv,"text/csv")}
function downloadCSV(){const table=document.querySelector("#recordsTable table");if(!table){alert("No records.");return}const rows=[...table.querySelectorAll("tr")].map(r=>[...r.children].map(c=>`"${c.innerText.replace(/"/g,'""')}"`).join(",")).join("\n");downloadFile("hotel_attendance.csv",rows,"text/csv")}
function downloadPDF(){const records=getRecords();if(!records.length){alert("No records.");return}const{jsPDF}=window.jspdf;const doc=new jsPDF("landscape");let y=18;doc.setFontSize(16);doc.text("Hotel Event Attendance Report",14,y);y+=10;records.forEach((r,i)=>{doc.setFontSize(8);doc.text(`${i+1}. ${r.eventName} | ${r.name} | ${r.idNumber} | ${r.phone} | ${r.organization||""} | ${r.guestType||""} | ${r.submittedAt}`,14,y);y+=8;try{doc.addImage(r.signature,"PNG",14,y,45,15)}catch(e){}y+=18;if(y>185){doc.addPage();y=20}});doc.save("hotel_attendance_report.pdf")}
function clearRecords(){if(!confirm("Clear imported records?"))return;localStorage.removeItem(KEYS.records);renderAll();toast("Records cleared")}
function backup(){downloadFile("hotel_attendance_backup.json",JSON.stringify({events:getEvents(),records:getRecords()},null,2),"application/json")}
function resizeSignature(){const c=$("signatureCanvas");if(!c)return;const r=c.getBoundingClientRect();c.width=r.width||700;c.height=190;const ctx=c.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);ctx.lineWidth=2.5;ctx.lineCap="round";ctx.strokeStyle="#062c22"}
function pt(e){const r=$("signatureCanvas").getBoundingClientRect(),t=e.touches?e.touches[0]:e;return{x:t.clientX-r.left,y:t.clientY-r.top}}
function startSig(e){e.preventDefault();isSigning=true;lastPoint=pt(e)}
function drawSig(e){if(!isSigning)return;e.preventDefault();const p=pt(e),ctx=$("signatureCanvas").getContext("2d");ctx.beginPath();ctx.moveTo(lastPoint.x,lastPoint.y);ctx.lineTo(p.x,p.y);ctx.stroke();lastPoint=p}
function endSig(){isSigning=false}
function clearSignature(){resizeSignature()}
function downloadFile(name,content,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}
function esc(v){return String(v||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}

document.addEventListener("DOMContentLoaded",()=>{
$("loginBtn").onclick=login;$("logoutBtn").onclick=logout;$("createEventBtn").onclick=createEvent;$("importBtn").onclick=importFiles;$("csvBtn").onclick=downloadCSV;$("pdfBtn").onclick=downloadPDF;$("mealBtn").onclick=()=>exportRows(r=>r.mealPreference&&r.mealPreference!=="No Meal","meal_report.csv");$("roomBtn").onclick=()=>exportRows(r=>r.accommodation==="Yes","accommodation_report.csv");$("clearRecordsBtn").onclick=clearRecords;$("backupBtn").onclick=backup;$("installBtn").onclick=()=>toast("On Android Chrome: Menu → Add to Home screen");$("menuBtn").onclick=()=>document.querySelector(".sidebar").classList.toggle("open");document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>showPage(b.dataset.page));$("clearSignatureBtn").onclick=clearSignature;$("submitRegistrationBtn").onclick=submitRegistration;const c=$("signatureCanvas");c.addEventListener("mousedown",startSig);c.addEventListener("mousemove",drawSig);window.addEventListener("mouseup",endSig);c.addEventListener("touchstart",startSig,{passive:false});c.addEventListener("touchmove",drawSig,{passive:false});window.addEventListener("touchend",endSig);window.addEventListener("resize",resizeSignature);document.addEventListener("keydown",e=>{if(e.key==="Enter"&&!$("loginPage").classList.contains("hidden"))login()});const event=new URLSearchParams(location.search).get("event");if(event)loadRegister(event);else if(sessionStorage.getItem("logged")==="yes"){showOnly("appPage");renderAll()}else showOnly("loginPage")
});


/* Professional attendance register overrides */
function renderRecords(){
  const records=getRecords();
  if(!records.length){
    $("recordsTable").innerHTML="<p class='muted'>No imported records.</p>";
    return;
  }

  const custom=[...new Set(records.flatMap(r=>Object.keys(r.customValues||{})))];
  const eventNames=[...new Set(records.map(r=>r.eventName).filter(Boolean))];
  const venueNames=[...new Set(records.map(r=>r.venue).filter(Boolean))];
  const eventLabel=eventNames.length===1?eventNames[0]:"Multiple Events";
  const venueLabel=venueNames.length===1?venueNames[0]:"Multiple Venues";
  const withAccommodation=records.filter(r=>r.accommodation==="Yes").length;
  const vipCount=records.filter(r=>r.guestType==="VIP Guest").length;
  const mealCount=records.filter(r=>r.mealPreference && r.mealPreference!=="No Meal").length;
  const dateLabel=new Date().toLocaleString();
  const customHeads=custom.map(c=>`<th>${esc(c)}</th>`).join("");

  const rows=records.map((r,i)=>`
    <tr>
      <td>${i+1}</td>
      <td>${esc(r.name)}</td>
      <td>${esc(r.idNumber)}</td>
      <td>${esc(r.phone)}</td>
      <td>${esc(r.organization||"")}</td>
      <td>${esc(r.email||"")}</td>
      <td>${esc(r.guestType||"")}</td>
      <td>${esc(r.accommodation||"")}</td>
      <td>${esc(r.mealPreference||"")}</td>
      ${custom.map(c=>`<td>${esc(r.customValues?.[c]||"")}</td>`).join("")}
      <td class="signature-cell"><img class="sig-img" src="${r.signature}"></td>
      <td>${esc(r.submittedAt)}</td>
    </tr>
  `).join("");

  $("recordsTable").innerHTML=`
    <div class="register-cover">
      <h1>Hotel Event Attendance Register</h1>
      <p>${esc(eventLabel)}</p>
      <p>${esc(venueLabel)}</p>
    </div>

    <div class="report-title">
      <div>
        <h2>Attendance Register</h2>
        <p><b>Event:</b> ${esc(eventLabel)}</p>
        <p><b>Venue:</b> ${esc(venueLabel)}</p>
        <p><b>Generated:</b> ${esc(dateLabel)}</p>
      </div>
      <div class="report-badge">${records.length} Registered</div>
    </div>

    <div class="attendance-summary">
      <div><span>Total Registered</span><b>${records.length}</b></div>
      <div><span>Accommodation</span><b>${withAccommodation}</b></div>
      <div><span>Meals</span><b>${mealCount}</b></div>
      <div><span>VIP Guests</span><b>${vipCount}</b></div>
    </div>

    <table class="attendance-table">
      <thead>
        <tr>
          <th>No.</th>
          <th>Full Name</th>
          <th>ID/Passport</th>
          <th>Phone</th>
          <th>Organization</th>
          <th>Email</th>
          <th>Guest Type</th>
          <th>Accommodation</th>
          <th>Meal</th>
          ${customHeads}
          <th>Signature</th>
          <th>Date/Time</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="print-footer">
      <p><b>Prepared by:</b> _______________________________ &nbsp;&nbsp;&nbsp; <b>Signature:</b> _______________________________</p>
      <p><b>Verified by:</b> _______________________________ &nbsp;&nbsp;&nbsp; <b>Date:</b> _______________________________</p>
    </div>
  `;
}

function downloadPDF(){
  const records=getRecords();
  if(!records.length){alert("No records.");return}
  const{jsPDF}=window.jspdf;
  const doc=new jsPDF("landscape");
  const eventNames=[...new Set(records.map(r=>r.eventName).filter(Boolean))];
  const venueNames=[...new Set(records.map(r=>r.venue).filter(Boolean))];
  const eventLabel=eventNames.length===1?eventNames[0]:"Multiple Events";
  const venueLabel=venueNames.length===1?venueNames[0]:"Multiple Venues";

  let y=14;
  doc.setFillColor(6,44,34);
  doc.rect(0,0,297,24,"F");
  doc.setTextColor(255,255,255);
  doc.setFontSize(16);
  doc.text("Hotel Event Attendance Register",14,10);
  doc.setFontSize(9);
  doc.text("Generated: "+new Date().toLocaleString(),14,18);

  doc.setTextColor(0,0,0);
  y=34;
  doc.setFontSize(12);
  doc.text("Event: "+eventLabel,14,y);
  doc.text("Venue: "+venueLabel,150,y);
  y+=8;
  doc.text("Total Registered: "+records.length,14,y);
  doc.text("Accommodation: "+records.filter(r=>r.accommodation==="Yes").length,70,y);
  doc.text("Meals: "+records.filter(r=>r.mealPreference && r.mealPreference!=="No Meal").length,125,y);
  doc.text("VIP Guests: "+records.filter(r=>r.guestType==="VIP Guest").length,175,y);
  y+=10;

  doc.setFontSize(8);
  doc.setFillColor(230,235,232);
  doc.rect(14,y-5,270,8,"F");
  doc.text("No.",16,y);
  doc.text("Name",26,y);
  doc.text("ID/Passport",72,y);
  doc.text("Phone",105,y);
  doc.text("Organization",135,y);
  doc.text("Guest",178,y);
  doc.text("Accom.",205,y);
  doc.text("Meal",225,y);
  doc.text("Date/Time",248,y);
  y+=7;

  records.forEach((r,i)=>{
    if(y>185){
      doc.addPage();
      y=18;
    }
    doc.text(String(i+1),16,y);
    doc.text(doc.splitTextToSize(String(r.name||""),42),26,y);
    doc.text(doc.splitTextToSize(String(r.idNumber||""),30),72,y);
    doc.text(doc.splitTextToSize(String(r.phone||""),28),105,y);
    doc.text(doc.splitTextToSize(String(r.organization||""),40),135,y);
    doc.text(doc.splitTextToSize(String(r.guestType||""),25),178,y);
    doc.text(String(r.accommodation||""),205,y);
    doc.text(doc.splitTextToSize(String(r.mealPreference||""),20),225,y);
    doc.text(doc.splitTextToSize(String(r.submittedAt||""),34),248,y);
    try{doc.addImage(r.signature,"PNG",260,y+2,22,8)}catch(e){}
    y+=13;
  });

  doc.save("professional_attendance_register.pdf");
}

document.addEventListener("DOMContentLoaded",()=>{
  const btn=document.getElementById("printRegisterBtn");
  if(btn){
    btn.onclick=()=>{
      showPage("records");
      setTimeout(()=>window.print(),300);
    };
  }
});
