function seedUsers(){
  const existing=JSON.parse(localStorage.getItem("hhh_eventpro_users")||"[]");
  if(existing.length) return;
  const users=[
    {id:"USR-ADMIN",name:"Administrator",username:"admin",password:"admin123",role:"Admin",permissions:["overview","events","registrations","checkin","badges","reports","users","settings"]},
    {id:"USR-CEO",name:"Chief Executive Officer",username:"ceo",password:"ceo123",role:"CEO",permissions:["overview","events","registrations","checkin","badges","reports","settings"]},
    {id:"USR-MANAGER",name:"Hotel Manager",username:"manager",password:"manager123",role:"Manager",permissions:["overview","events","registrations","checkin","badges","reports"]},
    {id:"USR-RECEPTION",name:"Reception Desk",username:"reception",password:"reception123",role:"Reception",permissions:["overview","registrations","checkin","badges"]},
    {id:"USR-REPORTS",name:"Reports Officer",username:"reports",password:"reports123",role:"Reports Officer",permissions:["overview","reports","registrations"]}
  ];
  localStorage.setItem("hhh_eventpro_users",JSON.stringify(users));
}
function login(){
  seedUsers();
  const username=document.getElementById("username").value.trim();
  const password=document.getElementById("password").value;
  const users=JSON.parse(localStorage.getItem("hhh_eventpro_users")||"[]");
  const user=users.find(u=>u.username===username && u.password===password);
  if(!user){
    document.getElementById("loginMessage").textContent="Wrong username or password.";
    return;
  }
  sessionStorage.setItem(Store.sessionKey,JSON.stringify(user));
  location.href="dashboard.html";
}
seedUsers();
document.getElementById("loginBtn").onclick=login;
document.addEventListener("keydown",e=>{if(e.key==="Enter")login()});
