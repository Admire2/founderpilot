"use client";
import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SessionTracker(){
  useEffect(()=>{
    const path=window.location.pathname;
    if(!path.startsWith("/suite/")) return;
    const suite=path.split("/")[2]||"suite";
    const et=()=>new Date().toLocaleString("en-US",{timeZone:"America/New_York",hour12:false});
    const startEt=et(); const start=Date.now(); let email="anonymous"; let ended=false;
    
    let deviceId = localStorage.getItem("fp_device_id");
    if (!deviceId) {
      deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem("fp_device_id", deviceId);
    }

    supabase.auth.getSession().then((r:any)=>{ email=r?.data?.session?.user?.email||"anonymous"; });
    
    const end=()=>{ if(ended)return; ended=true;
      const dur=Math.round((Date.now()-start)/1000); if(dur<5)return;
      const body=JSON.stringify({email,suite,start_et:startEt,end_et:et(),duration_seconds:dur,device_id:deviceId});
      if(navigator.sendBeacon){ navigator.sendBeacon("/api/track/session", new Blob([body],{type:"application/json"})); }
      else { fetch("/api/track/session",{method:"POST",body,headers:{"Content-Type":"application/json"},keepalive:true}); } 
    };
    window.addEventListener("pagehide",end);
    return ()=>{ window.removeEventListener("pagehide",end); end(); };
  },[]);
  return null;
}