window.__CANGJIE_BUILD__ = "20260507-1908";
try{
  if(location.protocol.indexOf("http") === 0){
    var u = new URL(location.href);
    if(!u.searchParams.get("v")){
      u.searchParams.set("v", window.__CANGJIE_BUILD__);
      history.replaceState(null, "", u.toString());
    }
  }
}catch(err){}
