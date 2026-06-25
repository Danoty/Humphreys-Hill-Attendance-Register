const $=id=>document.getElementById(id);

const UserAdmin={
  current:null,

  users(){
    return JSON.parse(localStorage.getItem("hhh_eventpro_users")||"[]");
  },

  saveUsers(users){
    localStorage.setItem("hhh_eventpro_users",JSON.stringify(users));
  },

  can(page){
    if(!this.current) return false;
    if(this.current.role==="Admin") return true;
    return (this.current.permissions||[]).includes(page);
  },

  applyAccess(){
    document.querySelectorAll(".nav").forEach(btn=>{
      const page=btn.dataset.page;
      if(!this.can(page)) btn.style.display="none";
    });
  },

  create(){
    if(!this.can("users")){alert("Access denied.");return}
    const name=$("newUserName").value.trim();
    const username=$("newUsername").value.trim();
    const password=$("newPassword").value.trim();
    const role=$("newUserRole").value;
    if(!name||!username||!password){alert("Fill name, username and password.");return}
    const users=this.users();
    if(users.some(u=>u.username===username)){alert("Username already exists.");return}
    const permissions=[...document.querySelectorAll(".perm:checked")].map(x=>x.value);
    users.push({id:"USR-"+Date.now(),name,username,password,role,permissions});
    this.saveUsers(users);
    ["newUserName","newUsername","newPassword"].forEach(id=>$(id).value="");
    this.render();
    Dashboard.toast("User created");
  },

  remove(id){
    if(!confirm("Delete this user?"))return;
    const users=this.users().filter(u=>u.id!==id);
    this.saveUsers(users);
    this.render();
  },

  render(){
    const box=$("usersTable");
    if(!box) return;
    const users=this.users();
    box.innerHTML=`
      <table>
        <thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Permissions</th><th>Action</th></tr></thead>
        <tbody>
        ${users.map(u=>`<tr>
          <td>${esc(u.name)}</td>
          <td>${esc(u.username)}</td>
          <td><span class="role-badge">${esc(u.role)}</span></td>
          <td>${esc((u.permissions||[]).join(", "))}</td>
          <td>${u.username==="admin"?"Protected":`<button class="btn danger" onclick="UserAdmin.remove('${u.id}')">Delete</button>`}</td>
        </tr>`).join("")}
        </tbody>
      </table>
    `;
  }
};

const Dashboard={
  toast(msg){
    const t=$("toast");
    t.textContent=msg;
    t.classList.add("show");
    setTimeout(()=>t.classList.remove("show"),2300);
  },

  showPage(id){
    if(!UserAdmin.can(id)){
      alert("Access denied for this user.");
      return;
    }
    document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
    $(id).classList.add("active");
    document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
    $("pageTitle").textContent=id==="registrations"?"Attendance Register":id[0].toUpperCase()+id.slice(1);
    document.querySelector(".sidebar").classList.remove("open");
    this.renderAll();
  },

  renderAll(){
    const regs=Store.regs();
    $("statEvents").textContent=Store.events().length;
    $("statRegs").textContent=regs.length;
    $("statChecked").textContent=regs.filter(r=>r.checkedIn).length;
    $("statVip").textContent=regs.filter(r=>r.guestType==="VIP Guest").length;
    Events.render();
    Events.latest();
    Registration.renderTable();
    Registration.recent();
    Registration.badges();
    Reports.populateEventFilter();
    Reports.renderFiltered();
    UserAdmin.render();
  },

  printRegister(){
    this.showPage("registrations");
    setTimeout(()=>window.print(),300);
  },

  printFiltered(){
    this.showPage("reports");
    setTimeout(()=>window.print(),300);
  },

  backup(){
    downloadFile("eventpro_backup.json",JSON.stringify({events:Store.events(),registrations:Store.regs(),users:UserAdmin.users()},null,2),"application/json");
  },

  wipe(){
    if(!confirm("Wipe all local event and registration data? Users will remain."))return;
    Store.wipe();
    this.renderAll();
  }
};

document.addEventListener("DOMContentLoaded",()=>{
  const user=JSON.parse(sessionStorage.getItem(Store.sessionKey)||"null");
  if(!user){location.href="login.html";return}
  UserAdmin.current=user;
  $("currentUser").textContent=user.name+" • "+user.role;

  UserAdmin.applyAccess();

  $("logoutBtn").onclick=()=>{sessionStorage.removeItem(Store.sessionKey);location.href="login.html"};
  $("menuBtn").onclick=()=>document.querySelector(".sidebar").classList.toggle("open");
  document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>Dashboard.showPage(b.dataset.page));

  $("createEventBtn").onclick=()=>Events.create();
  $("importBtn").onclick=()=>Registration.importFiles();
  $("clearRegsBtn").onclick=()=>Registration.clear();
  $("searchInput").oninput=()=>Registration.search();
  $("printBadgesBtn").onclick=()=>window.print();

  $("csvBtn").onclick=()=>Reports.attendanceCSV();
  $("pdfBtn").onclick=()=>Reports.pdfAll();
  $("mealBtn").onclick=()=>Reports.mealCSV();
  $("roomBtn").onclick=()=>Reports.roomCSV();
  $("vipBtn").onclick=()=>Reports.vipCSV();
  $("eventCsvBtn").onclick=()=>Reports.filteredCSV();
  $("eventPdfBtn").onclick=()=>Reports.filteredPDF();
  $("applyReportFilterBtn").onclick=()=>Reports.applyFilter();
  $("printFilteredBtn").onclick=()=>window.print();

  $("printRegisterBtn").onclick=()=>Dashboard.printRegister();
  $("printReportBtn").onclick=()=>Dashboard.printRegister();
  $("backupBtn").onclick=()=>Dashboard.backup();
  $("wipeBtn").onclick=()=>Dashboard.wipe();
  $("installBtn").onclick=()=>Dashboard.toast("On Android Chrome: Menu → Add to Home screen");
  $("createUserBtn").onclick=()=>UserAdmin.create();

  Dashboard.renderAll();
});
