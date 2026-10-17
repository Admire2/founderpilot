import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
const D = "Guidance only - not final, not verified, no warranty. Use at your own risk. For binding numbers, order a Certified Partner review.";
const n = (q: URLSearchParams, k: string, d: number) => { const v = parseFloat(q.get(k) || ""); return isNaN(v) ? d : v; };
const r = (x: number, p = 1) => +x.toFixed(p);

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const suite = (q.get("suite") || "").toLowerCase();
  const dom = (q.get("domain") || q.get("type") || "auto").toLowerCase();
  const o: any = { suite, domain: dom, disclaimer: D };
  let ok = true;

  if (suite === "maxi") {
    if (dom.includes("pcb")) { o.trace_width_mm = r(n(q,"I",2)/2.5,2); }
    else if (dom.includes("power")||dom.includes("battery")) { o.duty=r(n(q,"Vout",3.3)/n(q,"Vin",5),2); o.runtime_h=r(n(q,"wh",10)/n(q,"W",1),1); }
    else if (dom.includes("rf")||dom.includes("antenna")) { const l=300/n(q,"f",2400); o.wavelength_m=r(l,2); o.quarter_wave_mm=r(l*250,0); }
    else if (dom.includes("firmware")) { o.tx_time_ms=r(n(q,"bytes",1000)*10/(n(q,"baud",115200)/1000),2); }
    else if (dom.includes("component")||dom.includes("sourcing")) { o.derated_V=r(n(q,"V",12)*1.5,0); o.derated_W=r(n(q,"P",1)*2,1); }
    else if (dom.includes("emc")||dom.includes("emi")) { o.margin_dB=r(n(q,"limit",60)-n(q,"measured",52),1); }
    else if (dom.includes("thermal")||dom.includes("enclosure")) { o.deltaT_C=r(n(q,"P",2)*n(q,"R",25),1); }
    else if (dom.includes("iot")||dom.includes("mesh")) { o.runtime_days=r(n(q,"wh",10)/n(q,"W",0.05)/24,1); }
    else if (dom.includes("ai")||dom.includes("accelerator")) { o.inference_ms=r(n(q,"ops",8e6)/(n(q,"gops",1)*1e9)*1000,2); }
    else if (dom.includes("robot")||dom.includes("motor")) { o.torque_Nm=r(n(q,"Kt",0.1)*n(q,"I",2),2); }
    else if (dom.includes("automation")) { o.scan_ms=r(n(q,"tasks",50)*n(q,"us",100)/1000,2); }
    else if (dom.includes("audio")||dom.includes("waveform")) { o.wavelength_mm=r(343/n(q,"f",1000)*1000,0); }
    else if (dom.includes("test")||dom.includes("dfm")) { o.fpy_pct=r(Math.exp(-n(q,"dpu",0.1))*100,1); }
    else ok=false;
  }
  else if (suite === "rivet") {
    if (dom.includes("cad")||dom.includes("model")) { o.mass_kg=r(n(q,"cm3",1000)*n(q,"rho",2.7)/1000,2); }
    else if (dom.includes("stress")||dom.includes("fea")) { const s=n(q,"F",100)*1000/n(q,"A",1000); o.stress_MPa=r(s,1); o.SF=r(250/s,2); }
    else if (dom.includes("gear")) { const g=n(q,"N2",60)/n(q,"N1",12); o.ratio=r(g,2); o.torque_out_Nm=r(n(q,"Tin",10)*g*0.95,1); }
    else if (dom.includes("thermal")||dom.includes("fluid")) { o.deltaT_C=r(n(q,"P",50)*n(q,"R",2),1); o.flow_m3s=r(n(q,"A",0.01)*n(q,"v",1),3); }
    else if (dom.includes("material")) { o.specific_strength=r(n(q,"MPa",250)/n(q,"rho",2.7),0); }
    else if (dom.includes("tolerance")||dom.includes("fit")) { const Dm=n(q,"D",50); o.IT7_um=r(16*(0.45*Math.cbrt(Dm)+0.001*Dm),1); }
    else if (dom.includes("hydraulic")||dom.includes("pneumatic")) { o.pressure_bar=r(n(q,"F",50)*10/n(q,"A",50),1); }
    else if (dom.includes("robot")||dom.includes("arm")) { o.torque_Nm=r(n(q,"kg",5)*9.81*n(q,"r",0.5),1); }
    else if (dom.includes("automotive")||dom.includes("chassis")) { const v=n(q,"kmh",100)/3.6; o.braking_m=r(v*v/(2*n(q,"mu",0.7)*9.81),1); }
    else if (dom.includes("aerospace")||dom.includes("drone")) { o.TWR=r(n(q,"thrust",20)/(n(q,"kg",2)*9.81),2); }
    else if (dom.includes("consumer")) { o.impact_J=r(n(q,"kg",0.5)*9.81*n(q,"h",1.5),2); }
    else if (dom.includes("enclosure")||dom.includes("ip")) { o.wall_mm=r(n(q,"P",100)/n(q,"sigma",50)*2+1,1); }
    else if (dom.includes("test")||dom.includes("fixture")) { o.clamp_kN=r(n(q,"F",10)*1.5,1); }
    else ok=false;
  }
  else if (suite === "volt") {
    if (dom.includes("cable")) { const mm2=Math.ceil(n(q,"I",30)/6); o.cable_mm2=mm2; o.vdrop_V=r(2*n(q,"I",30)*n(q,"L",20)*0.0175/mm2,2); }
    else if (dom.includes("solar")||dom.includes("renewable")) { o.array_kW=r(n(q,"kwh",5)/n(q,"psh",5)*1.25,2); }
    else if (dom.includes("motor")||dom.includes("hvac")||dom.includes("drive")) { const I=n(q,"P",5)*1000/(Math.sqrt(3)*n(q,"V",400)*0.85*0.9); o.current_A=r(I,1); o.breaker_A=Math.ceil(I*1.25); }
    else if (dom.includes("earth")) { o.R_ohm=r(n(q,"R",10)/n(q,"rods",4)*0.85,2); }
    else if (dom.includes("transformer")) { o.ratio=r(n(q,"V1",11000)/n(q,"V2",400),1); }
    else if (dom.includes("light")) { o.fixtures=Math.ceil(n(q,"lux",300)*n(q,"area",100)/n(q,"lumens",3000)); }
    else if (dom.includes("generator")||dom.includes("ups")) { o.kVA=r(n(q,"kW",10)/0.8,1); o.runtime_h=r(n(q,"kwh",20)/n(q,"kW",10),1); }
    else if (dom.includes("ev")) { o.charge_h=r(n(q,"kwh",60)/n(q,"kW",7.4),1); }
    else if (dom.includes("battery")) { o.runtime_h=r(n(q,"wh",1000)/n(q,"W",100),1); }
    else if (dom.includes("code")||dom.includes("distribution")||dom.includes("automation")) { const I=n(q,"I",30); o.breaker_A=Math.ceil(I*1.25); o.cable_mm2=Math.ceil(I/6); }
    else ok=false;
  }
  else if (suite === "terra") {
    if (dom.includes("bridge")||dom.includes("culvert")) { const L=n(q,"L",20),w=n(q,"w",20),P=n(q,"P",100); const nG=Math.max(2,Math.round(w/2.5)); const wD=0.2*25*w+1.5*nG; const lane=9.3*w; const M_D=wD*L*L/8, M_L=P*L/4+lane*L*L/8, Mu=1.25*M_D+1.75*M_L; o.girders=nG; o.factored_moment_kNm=r(Mu,0); o.required_S_cm3=r(Mu*1e6/345/1000,0); o.deflection_limit_mm=r(L*1000/800,0); }
    else if (dom.includes("steel")) { o.S_req_cm3=r(n(q,"M",500)*1e6/345/1000,0); }
    else if (dom.includes("concrete")) { const V=n(q,"L",10)*n(q,"W",10)*n(q,"T",0.2); o.volume_m3=r(V,2); o.bags=Math.ceil(V*320/50); o.rebar_kg=Math.ceil(V*80); }
    else if (dom.includes("foundation")||dom.includes("geotech")) { const A=n(q,"P",500)/n(q,"qa",150); o.area_m2=r(A,2); o.side_m=r(Math.sqrt(A),2); }
    else if (dom.includes("wind")||dom.includes("seismic")) { o.wind_Pa=r(0.613*Math.pow(n(q,"v",40),2),0); o.base_shear_kN=r(n(q,"Cs",0.2)*n(q,"W",1000),0); }
    else if (dom.includes("hydro")||dom.includes("drainage")||dom.includes("water")||dom.includes("sewer")) { o.Q_m3s=r(n(q,"C",0.7)*n(q,"A",10000)*n(q,"i",50)*2.78e-7,3); }
    else if (dom.includes("timber")||dom.includes("masonry")) { o.S_req_cm3=r(n(q,"M",100)*1e6/n(q,"Fb",12)/1000,0); }
    else if (dom.includes("retaining")) { const phi=n(q,"phi",30)*Math.PI/180; const Ka=(1-Math.sin(phi))/(1+Math.sin(phi)); o.Ka=r(Ka,2); o.thrust_kN_m=r(0.5*Ka*n(q,"gamma",18)*Math.pow(n(q,"H",3),2),1); }
    else if (dom.includes("road")||dom.includes("paving")) { o.asphalt_tons=r(n(q,"area",1000)*n(q,"T",0.05)*2.4,1); }
    else if (dom.includes("grading")) { o.cut_fill_m3=r(n(q,"area",1000)*n(q,"depth",0.3),1); }
    else if (dom.includes("green")||dom.includes("leed")) { o.EUI_kWh_m2=r(n(q,"kwh",100000)/n(q,"area",1000),1); }
    else if (dom.includes("construction")||dom.includes("management")) { o.labor_cost=r(n(q,"hours",500)*n(q,"rate",45),0); o.duration_days=r(n(q,"hours",500)/(n(q,"crew",5)*8),1); }
    else ok=false;
  }
  else ok=false;

  if (!ok) return NextResponse.json({ suite, domain: dom, error: "no calculator for this domain yet", disclaimer: D });
  return NextResponse.json(o);
}