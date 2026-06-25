const Reports={
  selectedEvent:"",
  fromDate:"",
  toDate:"",

  currentRows(){
    return this.filterRows(Store.regs());
  },

  filterRows(rows){
    return rows.filter(r=>{
      const matchEvent=!this.selectedEvent || r.eventId===this.selectedEvent;
      const d=this.extractDate(r.submittedAt);
      const after=!this.fromDate || d>=this.fromDate;
      const before=!this.toDate || d<=this.toDate;
      return matchEvent && after && before;
    });
  },

  extractDate(value){
    if(!value) return "";
    const parsed=new Date(value);
    if(!isNaN(parsed)) return parsed.toISOString().slice(0,10);
    const m=String(value).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if(m){
      const mm=m[1].padStart(2,"0");
      const dd=m[2].padStart(2,"0");
      return `${m[3]}-${mm}-${dd}`;
    }
    return "";
  },

  populateEventFilter(){
    const select=document.getElementById("reportEventFilter");
    if(!select) return;
    const events=Store.events();
    const current=select.value;
    select.innerHTML=`<option value="">All Events</option>`+events.map(e=>`<option value="${e.id}">${esc(e.name)} - ${esc(e.date)}</option>`).join("");
    select.value=current;
  },

  applyFilter(){
    this.selectedEvent=document.getElementById("reportEventFilter").value;
    this.fromDate=document.getElementById("reportFromDate").value;
    this.toDate=document.getElementById("reportToDate").value;
    this.renderFiltered();
    Dashboard.toast("Report filter applied");
  },

  renderFiltered(){
    const rows=this.currentRows();
    const box=document.getElementById("filteredReportTable");
    if(!box) return;
    if(!rows.length){
      box.innerHTML="<p class='muted'>No records match the selected event/date filter.</p>";
      return;
    }
    const eventLabel=this.selectedEvent ? (Store.events().find(e=>e.id===this.selectedEvent)?.name || "Selected Event") : "All Events";
    box.innerHTML=`
      <div class="report-title">
        <div>
          <h2>${esc(eventLabel)} Attendance</h2>
          <p><b>From:</b> ${esc(this.fromDate||"Beginning")} &nbsp; <b>To:</b> ${esc(this.toDate||"Today")}</p>
        </div>
        <div class="badge">${rows.length} Records</div>
      </div>
      <table>
        <thead>
          <tr><th>No.</th><th>Event</th><th>Name</th><th>ID/Passport</th><th>Phone</th><th>Organization</th><th>Guest Type</th><th>Status</th><th>Date</th></tr>
        </thead>
        <tbody>
          ${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.eventName)}</td><td>${esc(r.name)}</td><td>${esc(r.idNumber)}</td><td>${esc(r.phone)}</td><td>${esc(r.organization||"")}</td><td>${esc(r.guestType||"")}</td><td>${r.checkedIn?"Checked In":"Pending"}</td><td>${esc(r.submittedAt)}</td></tr>`).join("")}
        </tbody>
      </table>
    `;
  },

  csv(name,rows){
    if(!rows.length){alert("No records.");return}
    const headers=["Event","Venue","Name","ID","Phone","Email","Organization","Guest Type","Accommodation","Meal","Status","Date"];
    const body=rows.map(r=>[r.eventName,r.venue,r.name,r.idNumber,r.phone,r.email,r.organization,r.guestType,r.accommodation,r.mealPreference,r.checkedIn?"Checked In":"Pending",r.submittedAt]);
    downloadFile(name,[headers,...body].map(row=>row.map(v=>`"${String(v||"").replace(/"/g,'""')}"`).join(",")).join("\n"),"text/csv");
  },

  filteredCSV(){
    const eventName=this.selectedEvent ? (Store.events().find(e=>e.id===this.selectedEvent)?.name || "selected_event") : "all_events";
    this.csv(eventName.replaceAll(" ","_").toLowerCase()+"_attendance.csv",this.currentRows());
  },

  attendanceCSV(){this.csv("all_attendance_register.csv",Store.regs())},
  mealCSV(){this.csv("meal_report.csv",Store.regs().filter(r=>r.mealPreference&&r.mealPreference!=="No Meal"))},
  roomCSV(){this.csv("accommodation_report.csv",Store.regs().filter(r=>r.accommodation==="Yes"))},
  vipCSV(){this.csv("vip_report.csv",Store.regs().filter(r=>r.guestType==="VIP Guest"))},

  filteredPDF(){this.pdf(this.currentRows(),"filtered_attendance_report.pdf")},
  pdfAll(){this.pdf(Store.regs(),"all_attendance_report.pdf")},

  pdf(records,filename){
    if(!records.length){alert("No records.");return}
    if(!window.jspdf){alert("PDF library not loaded. Check internet.");return}
    const{jsPDF}=window.jspdf;
    const doc=new jsPDF("landscape");
    let y=14;
    doc.setFillColor(6,44,34);
    doc.rect(0,0,297,24,"F");
    doc.setTextColor(255,255,255);
    doc.setFontSize(16);
    doc.text("Humphreys Hill House - Attendance Register",14,10);
    doc.setFontSize(9);
    doc.text("Generated: "+new Date().toLocaleString(),14,18);

    doc.setTextColor(0);
    y=34;
    const eventName=this.selectedEvent ? (Store.events().find(e=>e.id===this.selectedEvent)?.name || "Selected Event") : "All Events";
    doc.setFontSize(11);
    doc.text("Report: "+eventName,14,y);
    y+=7;
    doc.text("Total: "+records.length,14,y);
    doc.text("Checked In: "+records.filter(r=>r.checkedIn).length,55,y);
    doc.text("Accommodation: "+records.filter(r=>r.accommodation==="Yes").length,105,y);
    doc.text("VIP: "+records.filter(r=>r.guestType==="VIP Guest").length,170,y);
    y+=12;

    doc.setFontSize(8);
    doc.text("No.",14,y); doc.text("Event",24,y); doc.text("Name",70,y); doc.text("ID",110,y); doc.text("Phone",135,y); doc.text("Organization",165,y); doc.text("Status",215,y); doc.text("Date",245,y);
    y+=7;

    records.forEach((r,i)=>{
      if(y>185){doc.addPage();y=18}
      doc.text(String(i+1),14,y);
      doc.text(doc.splitTextToSize(String(r.eventName||""),42),24,y);
      doc.text(doc.splitTextToSize(String(r.name||""),38),70,y);
      doc.text(String(r.idNumber||""),110,y);
      doc.text(String(r.phone||""),135,y);
      doc.text(doc.splitTextToSize(String(r.organization||""),45),165,y);
      doc.text(r.checkedIn?"Checked In":"Pending",215,y);
      doc.text(doc.splitTextToSize(String(r.submittedAt||""),40),245,y);
      try{doc.addImage(r.signature,"PNG",265,y+2,22,8)}catch(e){}
      y+=13;
    });

    doc.save(filename);
  }
};