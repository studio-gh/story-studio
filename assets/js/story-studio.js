/* Story Studio modular runtime. Inline scripts combined in original document order. */
const CANVAS_W=500,CANVAS_H=CANVAS_W*16/9;
let saved=[];
try{
  const rawSaved=localStorage.getItem("stickerStudioSaved");
  saved=rawSaved?JSON.parse(rawSaved):[];
  if(!Array.isArray(saved))saved=[];
}catch(e){
  saved=[];
  try{localStorage.removeItem("stickerStudioSaved")}catch(_){}
}
let layers=[],selectedId=null,history=[],historyIndex=-1,pendingEdits={},drag=null,dragBefore=null;
let pointers=new Map(),gesture=null,autosaveTimer=null,assetStore=new Map(),suppressClick=false,cropMode=false;
const $=id=>document.getElementById(id);
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function stateJSON(){return JSON.stringify(layers.map(l=>l.type==='image'?({...l,src:undefined}):l))}
function fullDraftJSON(){return JSON.stringify(layers)}
function saveDraft(){clearTimeout(autosaveTimer);autosaveTimer=setTimeout(()=>{try{localStorage.setItem("stickerStudioDraft",fullDraftJSON());localStorage.setItem("stickerStudioDraftAt",Date.now())}catch(e){console.warn("Draft save skipped",e)}},900)}
function commitHistory(){const snap=stateJSON();if(history[historyIndex]===snap){updateHistoryUI();saveDraft();return}history=history.slice(0,historyIndex+1);history.push(snap);historyIndex=history.length-1;updateHistoryUI();saveDraft()}
function updateHistoryUI(){if($('undoBtn'))$('undoBtn').disabled=historyIndex<=0;if($('redoBtn'))$('redoBtn').disabled=historyIndex>=history.length-1}
function restoreState(s){layers=JSON.parse(s).map(l=>{if(l.type==='image'&&!l.src&&l.assetId)l.src=assetStore.get(l.assetId)||'';return l});selectedId=layers.length?layers[layers.length-1].id:null;renderEditor();updateHistoryUI();saveDraft()}
function beginContinuousEdit(k){if(!pendingEdits[k])pendingEdits[k]=stateJSON()}
function finishContinuousEdit(k){if(!pendingEdits[k])return;const before=pendingEdits[k];delete pendingEdits[k];const after=stateJSON();if(before===after)return;history=history.slice(0,historyIndex+1);history.push(before,after);historyIndex=history.length-1;updateHistoryUI();saveDraft()}
function finishAllContinuousEdits(){Object.keys(pendingEdits).forEach(finishContinuousEdit)}
window.undo=()=>{finishAllContinuousEdits();if(historyIndex<=0)return;historyIndex--;restoreState(history[historyIndex]);toast("Undid last change")}
window.redo=()=>{finishAllContinuousEdits();if(historyIndex>=history.length-1)return;historyIndex++;restoreState(history[historyIndex]);toast("Redid last change")}
window.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="z"){const tag=document.activeElement?.tagName;if(tag==="INPUT"&&document.activeElement.type==="text")return;e.preventDefault();e.shiftKey?redo():undo()}})
window.show=function(id){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));$(id).classList.add('active');document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===id));if(id==='saved')renderSaved();window.scrollTo({top:0,behavior:'smooth'})}
function styleCSS(s){const color=(s.color||'#151515').toLowerCase();let x=`color:${color};font-size:${s.size||54}px;`;if(s.style==='outline'){const edge=color==='#ffffff'||color==='#fff'?'#151515':'#fff';x+=`-webkit-text-stroke:1px ${edge};paint-order:stroke fill;text-shadow:1px 1px 0 ${edge},-1px 1px 0 ${edge},1px -1px 0 ${edge},-1px -1px 0 ${edge};`}if(s.style==='shadow')x+='text-shadow:3px 3px 0 rgba(0,0,0,.3);';if(s.style==='bubble')x+='background:#fff;padding:12px 16px;border-radius:18px;box-shadow:0 3px 0 rgba(0,0,0,.12);';return x}
function card(s){const preview=s.cat==='Shape'?`<svg viewBox="0 0 180 180" style="width:70%;height:70%;overflow:visible"><circle cx="58" cy="72" r="35" fill="#ff961a"/><rect x="90" y="38" width="55" height="55" rx="10" fill="#151515"/><path d="M82 100 L120 160 L44 160 Z" fill="#ff961a"/></svg>`:`<div class="text-layer" style="${styleCSS(s)}">${esc(s.text)}</div>`;return `<article class="card"><div class="preview">${preview}</div><div class="card-info"><small>${s.cat==='Type'?'Typography':s.cat||'Created'}</small><div class="card-actions"><button class="remix-btn" onclick='remixSticker(${JSON.stringify(s)})'>Remix ↗</button><button class="save" aria-label="Save graphic" onclick='toggleSave(${JSON.stringify(s)})'>${saved.some(x=>x.id===s.id)?'♥':'♡'}</button></div></div></article>`}
function renderHome(){/* The home screen is intentionally focused on starting a new design. */}
window.remixSticker=s=>{show('create');if(s.cat==='Shape'){addShape('circle');return}const l={id:newId(),type:'text',text:s.text,fontFamily:s.style==='outline'?'Archivo Black':'DM Sans',fontSize:54,textWidth:300,color:s.color||'#151515',opacity:1,scale:1,rotation:0,x:CANVAS_W/2,y:CANVAS_H/2,letterSpacing:0,lineHeight:1,textAlign:'center',outline:s.style==='outline',outlineWidth:3,outlineColor:'#ffffff',shadow:s.style==='shadow',shadowBlur:8,shadowOffset:4,shadowColor:'#000000',curve:0,highlight:s.style==='bubble',highlightPadding:10,highlightRadius:18,highlightColor:'#ffffff',highlightOpacity:.95,visible:true,locked:false};commitHistory();layers.push(l);selectedId=l.id;renderEditor();commitHistory();toast('Remix ready. Make it yours.')};
function renderSaved(){$('savedGrid').innerHTML=saved.length?saved.map(card).join(''):`<div class="empty"><strong>Your library is empty.</strong><br><br>Create or save a design and it will appear here.</div>`}
window.toggleSave=s=>{if(saved.some(x=>x.id===s.id))saved=saved.filter(x=>x.id!==s.id);else saved=[s,...saved];localStorage.setItem('stickerStudioSaved',JSON.stringify(saved));renderHome();renderSaved();toast(saved.some(x=>x.id===s.id)?'Saved':'Removed')}
function newId(){return 'l'+Date.now()+Math.random().toString(16).slice(2)}
function addText(text=''){text=String(text).slice(0,120);commitHistory();let l={id:newId(),type:'text',text,fontFamily:'DM Sans',fontSize:54,textWidth:300,color:'#151515',opacity:1,scale:1,rotation:0,x:CANVAS_W/2,y:CANVAS_H/2,letterSpacing:0,lineHeight:1,textAlign:'center',outline:false,outlineWidth:3,outlineColor:'#ffffff',shadow:false,shadowBlur:8,shadowOffset:4,shadowColor:'#000000',curve:0,highlight:false,highlightPadding:10,highlightRadius:8,highlightColor:'#ffffff',highlightOpacity:.85,visible:true,locked:false};layers.push(l);selectedId=l.id;renderEditor();commitHistory();if(window.openEditorPanel)window.openEditorPanel('text');if(window.v60SetPanel)window.v60SetPanel(true,'text');const field=$('textValue');if(field){field.value=text;field.focus({preventScroll:true});field.setSelectionRange(0,field.value.length)} }
function addImage(src,name='Photo',iw=1000,ih=1000){commitHistory();const max=330,ratio=Math.max(iw,ih)/max,w=Math.max(40,iw/ratio),h=Math.max(40,ih/ratio),assetId=newId();assetStore.set(assetId,src);let l={id:newId(),assetId,type:'image',src,name,opacity:1,scale:1,rotation:0,x:CANVAS_W/2,y:CANVAS_H/2,w,h,fit:'contain',cropRatio:null,cropX:50,cropY:50,stickerOutline:0,stickerOutlineColor:'#ffffff',stickerShadow:0,visible:true,locked:false};layers.push(l);selectedId=l.id;renderEditor();commitHistory()}
window.addText=addText;
window.startTextEditing=function(){addText('');};

window.addShape=function(shape='circle'){commitHistory();const dims={circle:[150,150],square:[150,150],rectangle:[210,120],blob:[170,155],rounded:[190,125],triangle:[160,150],star:[155,155],speech:[190,145]};const [w,h]=dims[shape]||[150,150];const l={id:newId(),type:'shape',shape,name:shape.charAt(0).toUpperCase()+shape.slice(1),x:CANVAS_W/2,y:CANVAS_H/2,w,h,scale:1,rotation:0,opacity:1,color:'#ff961a',strokeColor:'#ff961a',strokeWidth:0,noFill:false,visible:true,locked:false};layers.push(l);selectedId=l.id;renderEditor();commitHistory();toast('Shape added')};
function selected(){return layers.find(l=>l.id===selectedId)}
function outlineFilter(l){if(!l.stickerOutline&&!l.stickerShadow)return 'none';const f=[];if(l.stickerOutline){const r=Math.max(1,Math.min(20,l.stickerOutline)),c=l.stickerOutlineColor||'#fff';for(let i=0;i<8;i++){const a=Math.PI*2*i/8;f.push(`drop-shadow(${Math.cos(a)*r}px ${Math.sin(a)*r}px 0 ${c})`)}}if(l.stickerShadow)f.push(`drop-shadow(${l.stickerShadow/2}px ${l.stickerShadow/2}px ${l.stickerShadow}px rgba(0,0,0,.35))`);return f.join(' ')}
function stageUnit(){const stage=$('stage');return stage?stage.clientWidth/CANVAS_W:1}
function renderEditor(){const stage=$('stage');const unit=stageUnit();const oldV=$('guideV'),oldH=$('guideH');stage.innerHTML='';if(oldV)stage.appendChild(oldV);if(oldH)stage.appendChild(oldH);layers.forEach(l=>{if(l.visible===false)return;const el=document.createElement('div');el.className='layer'+(l.id===selectedId?' selected':'')+(l.locked?' locked':'');el.dataset.id=l.id;el.style.left=(l.x*unit)+'px';el.style.top=(l.y*unit)+'px';el.style.opacity=l.opacity;el.style.transform=`translate(-50%,-50%) rotate(${l.rotation}deg) scale(${l.scale})`;
if(l.type==='text'){el.className+=' text-layer';el.style.fontFamily=`"${l.fontFamily}"`;el.style.fontSize=(l.fontSize*unit)+'px';el.style.color=l.color;el.style.letterSpacing=(l.letterSpacing||0)+'px';el.style.lineHeight=l.lineHeight||1;el.style.textAlign=l.textAlign||'center';el.style.width=((l.textWidth||300)*unit)+'px';el.style.maxWidth='none';el.style.whiteSpace='normal';if(l.highlight){el.style.backgroundColor=hexToRgba(l.highlightColor||'#fff',l.highlightOpacity??.85);el.style.padding=(l.highlightPadding||0)+'px';el.style.borderRadius=(l.highlightRadius||0)+'px';el.style.boxDecorationBreak='clone';el.style.webkitBoxDecorationBreak='clone'}if(l.outline){el.style.webkitTextStroke=`${l.outlineWidth||1}px ${l.outlineColor||'#fff'}`;el.style.paintOrder='stroke fill'}if(l.shadow){const o=l.shadowOffset||0;el.style.textShadow=`${o}px ${o}px ${l.shadowBlur||0}px ${l.shadowColor||'#000'}`}if(l.curve){el.innerHTML=curvedTextSVG(l);el.style.backgroundColor='transparent';el.style.padding='0';el.style.width=((l.curveMode==='circle'?(Math.max(70,Number(l.curveRadius)||130)*2+24):Math.max(220,Math.abs(l.curve)*5+220))*unit)+'px';el.style.height=((l.curveMode==='circle'?(Math.max(70,Number(l.curveRadius)||130)*2+24):Math.max(120,Math.abs(l.curve)*2+120))*unit)+'px'}else{const span=document.createElement('span');span.className='text-content';span.textContent=l.text||'TEXT';el.appendChild(span)}}else if(l.type==='shape'){el.className+=' shape-layer';el.style.width=(l.w*unit)+'px';el.style.height=(l.h*unit)+'px';el.innerHTML=shapeSVG(l);el.querySelector('svg').style.width='100%';el.querySelector('svg').style.height='100%'}else{const img=document.createElement('img');img.className='layer-media';img.src=l.src;img.style.width=(l.w*unit)+'px';img.style.height=(l.h*unit)+'px';img.style.objectFit=l.fit==='cover'?'cover':'contain';img.style.objectPosition=`${l.cropX??50}% ${l.cropY??50}%`;img.style.filter=outlineFilter(l);el.appendChild(img)}
if(l.type==='text'&&!l.curve){for(const side of ['left','right']){const wh=document.createElement('button');wh.type='button';wh.className='width-handle '+side;wh.setAttribute('aria-label','Resize text box width');wh.onpointerdown=e=>beginHandle(e,l.id,'width-'+side);el.appendChild(wh)}}
if(l.type==='image'||l.type==='shape'){const rh=document.createElement('button');rh.type='button';rh.className='handle resize-handle';rh.setAttribute('aria-label',l.type==='shape'?'Resize shape':'Resize image');rh.onpointerdown=e=>beginHandle(e,l.id,'resize');el.appendChild(rh);const rot=document.createElement('button');rot.type='button';rot.className='handle rotate-handle';rot.setAttribute('aria-label',l.type==='shape'?'Rotate shape':'Rotate image');rot.onpointerdown=e=>beginHandle(e,l.id,'rotate');el.appendChild(rot)}
const del=document.createElement('button');del.className='delete';del.textContent='×';del.onclick=e=>{e.stopPropagation();deleteLayer(l.id)};el.appendChild(del);
/* V9.4: stage uses a consistent 500-unit coordinate system at every responsive size. Text width no longer depends on its x-position, preventing apparent resize/wrapping while moving. */
el.onpointerdown=e=>{if(e.target.closest('button'))return;beginPointer(e,l.id)};el.onclick=()=>{if(suppressClick){suppressClick=false;return}selectedId=l.id;renderEditor()};stage.appendChild(el)});renderLayers();updatePanel();saveDraft();updateGuides(null)}

function shapeSVG(l){const fill=l.noFill?'none':(l.color||'#ff961a'),stroke=l.strokeColor||(l.noFill?'#ff961a':'none'),sw=l.strokeWidth||0;let body='';switch(l.shape){case'square':body='<rect x="5" y="5" width="90" height="90" />';break;case'rectangle':body='<rect x="2" y="24" width="96" height="52" rx="1" />';break;case'blob':body='<path d="M18 12 C31 -2 44 13 55 8 C75 -1 95 15 88 33 C83 45 99 56 85 75 C72 92 58 80 45 90 C29 101 10 84 15 68 C19 55 1 47 8 31 C10 23 12 17 18 12 Z" />';break;case'rounded':body='<rect x="4" y="18" width="92" height="64" rx="20" />';break;case'triangle':body='<path d="M50 4 L96 94 H4 Z" />';break;case'star':body='<path d="M50 2 L62 35 L98 36 L70 58 L80 94 L50 73 L20 94 L30 58 L2 36 L38 35 Z" />';break;case'speech':body='<path d="M8 8 H92 Q98 8 98 16 V68 Q98 76 90 76 H55 L32 96 V76 H8 Q2 76 2 68 V16 Q2 8 8 8 Z" />';break;default:body='<circle cx="50" cy="50" r="45" />'}return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true"><g fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round">${body}</g></svg>`}
function curvedTextSVG(l){
 const text=esc(l.text||'TEXT'),curve=l.curve||0;
 if(l.curveMode==='circle'){
  const r=Math.max(70,Number(l.curveRadius)||130),d=r*2+24,cx=d/2,cy=d/2,dir=l.curveDirection==='counterclockwise'?0:1;
  const path=dir===1?`M ${cx} ${cy-r} A ${r} ${r} 0 1 1 ${cx} ${cy+r} A ${r} ${r} 0 1 1 ${cx} ${cy-r}`:`M ${cx} ${cy-r} A ${r} ${r} 0 1 0 ${cx} ${cy+r} A ${r} ${r} 0 1 0 ${cx} ${cy-r}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${d}" viewBox="0 0 ${d} ${d}" style="overflow:visible"><defs><path id="curvePath" d="${path}"/></defs><text fill="${l.color||'#151515'}" stroke="${l.outline?(l.outlineColor||'#fff'):'none'}" stroke-width="${l.outline?(l.outlineWidth||1)*2:0}" paint-order="stroke" font-family="${esc(l.fontFamily)}" font-size="${l.fontSize}" font-weight="900" letter-spacing="${l.letterSpacing||0}px"><textPath href="#curvePath" startOffset="0%" textLength="${Math.PI*2*r}" lengthAdjust="spacing">${text}</textPath></text></svg>`;
 }
 const width=Math.max(220,Math.abs(curve)*5+220),height=Math.max(120,Math.abs(curve)*2+120),r=Math.max(70,110+Math.abs(curve)*2),arcLength=r*(Math.PI-.7),cy=curve>=0?height+r*.25:-r*.15,start=curve>=0?Math.PI+.35:Math.PI-.35,end=curve>=0?-.35:.35,sweep=curve>=0?1:0,x1=width/2+r*Math.cos(start),y1=cy+r*Math.sin(start),x2=width/2+r*Math.cos(end),y2=cy+r*Math.sin(end),path=`M ${x1} ${y1} A ${r} ${r} 0 0 ${sweep} ${x2} ${y2}`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow:visible"><defs><path id="curvePath" d="${path}"/></defs><text fill="${l.color||'#151515'}" stroke="${l.outline?(l.outlineColor||'#fff'):'none'}" stroke-width="${l.outline?(l.outlineWidth||1)*2:0}" paint-order="stroke" font-family="${esc(l.fontFamily)}" font-size="${l.fontSize}" font-weight="900" letter-spacing="${l.letterSpacing||0}px"><textPath href="#curvePath" startOffset="50%" text-anchor="middle" textLength="${arcLength}" lengthAdjust="spacingAndGlyphs">${text}</textPath></text></svg>`;
}
function updateLayerVisual(id){const l=layers.find(x=>x.id===id),el=document.querySelector(`.layer[data-id="${id}"]`);if(!l||!el)return;const unit=stageUnit();el.style.left=(l.x*unit)+'px';el.style.top=(l.y*unit)+'px';el.style.opacity=l.opacity;el.style.transform=`translate(-50%,-50%) rotate(${l.rotation}deg) scale(${l.scale})`;if(l.type==='shape'){el.style.width=(l.w*unit)+'px';el.style.height=(l.h*unit)+'px';el.innerHTML=shapeSVG(l)}if(l.type==='image'){const img=el.querySelector('.layer-media');if(img){img.style.width=(l.w*unit)+'px';img.style.height=(l.h*unit)+'px';img.style.objectFit=l.fit==='cover'?'cover':'contain';img.style.objectPosition=`${l.cropX??50}% ${l.cropY??50}%`;img.style.filter=outlineFilter(l)}}if(l.type==='text'){el.style.fontSize=(l.fontSize*unit)+'px';el.style.textAlign=l.textAlign||'center';el.style.width=((l.textWidth||300)*unit)+'px';el.style.maxWidth='none';if(l.curve){el.innerHTML=curvedTextSVG(l);const d=l.curveMode==='circle'?(Math.max(70,Number(l.curveRadius)||130)*2+24):Math.max(220,Math.abs(l.curve)*5+220);el.style.width=(d*unit)+'px';el.style.height=(d*unit)+'px';el.style.backgroundColor='transparent';el.style.padding='0'}else{const span=el.querySelector('.text-content');if(span)span.textContent=l.text||'TEXT'}}}
function stagePoint(e){const r=$('stage').getBoundingClientRect();return {x:(e.clientX-r.left)/(r.width/CANVAS_W),y:(e.clientY-r.top)/(r.height/CANVAS_H),r}}
function layerCenterPx(id){const el=document.querySelector(`.layer[data-id="${id}"]`);if(!el)return null;const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}}
function snapPosition(l,threshold=10){let sx=null,sy=null;const candidates=[{x:CANVAS_W/2,y:CANVAS_H/2,id:null}];layers.forEach(o=>{if(o.id!==l.id&&o.visible!==false)candidates.push({x:o.x,y:o.y,id:o.id})});for(const c of candidates){if(Math.abs(l.x-c.x)<=threshold){l.x=c.x;sx=c.x}if(Math.abs(l.y-c.y)<=threshold){l.y=c.y;sy=c.y}}return {x:sx,y:sy}}
function updateGuides(g){const v=$('guideV'),h=$('guideH');if(v)v.style.display=g?.x!=null?'block':'none';if(h)h.style.display=g?.y!=null?'block':'none';if(v&&g?.x!=null)v.style.left=(g.x/CANVAS_W*100)+'%';if(h&&g?.y!=null)h.style.top=(g.y/CANVAS_H*100)+'%'}
function beginPointer(e,id){
  if(e.target.closest('.delete,.handle'))return;
  const l=layers.find(x=>x.id===id);
  if(!l||l.locked)return;
  e.preventDefault();
  selectedId=id;
  // One finger is ALWAYS move. No accidental scaling/rotation.
  // Resize and rotate are explicit actions through their handles.
  const mode=(cropMode && l.type==='image' && l.fit==='cover')?'crop':'move';
  drag={id,ox:e.clientX,oy:e.clientY,x:l.x,y:l.y,cropX:l.cropX??50,cropY:l.cropY??50,before:stateJSON(),mode,moved:false};
  try{e.currentTarget.setPointerCapture(e.pointerId)}catch(_){}
}
function beginHandle(e,id,mode){
  e.stopPropagation();
  e.preventDefault();
  const l=layers.find(x=>x.id===id);
  if(!l||l.locked)return;
  selectedId=id;
  const r=document.querySelector(`.layer[data-id="${id}"]`)?.getBoundingClientRect();
  if(!r)return;
  const cx=r.left+r.width/2,cy=r.top+r.height/2;
  const startDist=Math.max(8,Math.hypot(e.clientX-cx,e.clientY-cy));
  const startAngle=Math.atan2(e.clientY-cy,e.clientX-cx);
  drag={id,ox:e.clientX,oy:e.clientY,scale:l.scale,rotation:l.rotation,w:l.w,h:l.h,textWidth:l.textWidth||300,before:stateJSON(),mode,centerX:cx,centerY:cy,startDist,startAngle,moved:false};
  $('stage').setPointerCapture?.(e.pointerId);
}
$('stage').addEventListener('pointermove',e=>{
  if(!drag)return;
  e.preventDefault();
  const l=layers.find(x=>x.id===drag.id);
  if(!l)return;
  const r=$('stage').getBoundingClientRect();
  const dx=e.clientX-drag.ox,dy=e.clientY-drag.oy;
  if(Math.abs(dx)+Math.abs(dy)>3){drag.moved=true;suppressClick=true}
  if(drag.mode==='move'){
    l.x=Math.max(0,Math.min(CANVAS_W,drag.x+dx/(r.width/CANVAS_W)));
    // X and Y use the same logical scale because the artboard is a fixed 500-unit 9:16 surface.
    const unit=r.width/CANVAS_W;
    l.y=Math.max(0,Math.min(CANVAS_H,drag.y+dy/unit));
    const guide=snapPosition(l,9);
    updateGuides(guide);
  }else if(drag.mode==='crop'){
    l.cropX=Math.max(0,Math.min(100,drag.cropX-dx/Math.max(1,r.width)*100));
    l.cropY=Math.max(0,Math.min(100,drag.cropY-dy/Math.max(1,r.height)*100));
    $('cropX').value=l.cropX;$('cropY').value=l.cropY;$('cropXVal').textContent=Math.round(l.cropX);$('cropYVal').textContent=Math.round(l.cropY);
  }else if(drag.mode==='width-left'||drag.mode==='width-right'){
    const sign=drag.mode==='width-right'?1:-1;
    l.textWidth=Math.max(80,Math.min(480,drag.textWidth+sign*dx/(r.width/500)));
    const el=document.querySelector(`.layer[data-id="${l.id}"]`);if(el){el.style.width=(l.textWidth*(r.width/500))+'px';el.style.maxWidth='none'}
  }else if(drag.mode==='resize'){
    const d1=Math.hypot(e.clientX-drag.centerX,e.clientY-drag.centerY);
    l.scale=Math.max(.25,Math.min(3,drag.scale*(d1/drag.startDist)));
  }else if(drag.mode==='rotate'){
    l.rotation=drag.rotation+(Math.atan2(e.clientY-drag.centerY,e.clientX-drag.centerX)-drag.startAngle)*180/Math.PI;
    const snap=Math.round(l.rotation/15)*15;
    if(Math.abs(l.rotation-snap)<3)l.rotation=snap;
  }
  updateLayerVisual(l.id);
},{passive:false});
$('stage').addEventListener('pointerup',e=>{
  if(!drag)return;
  const finished=drag;
  drag=null;
  updateGuides(null);
  finishGesture(finished.before);
  renderEditor();
  setTimeout(()=>{suppressClick=false},0);
});
$('stage').addEventListener('pointercancel',e=>{
  if(drag){drag=null;updateGuides(null);renderEditor()}
  suppressClick=false;
});
function finishGesture(before){const after=stateJSON();if(before===after)return;history=history.slice(0,historyIndex+1);history.push(before,after);historyIndex=history.length-1;updateHistoryUI();saveDraft()}

function renderLayers(){const tools=document.querySelector('.layer-tools');const hasSelection=!!selected()&&layers.length>0;if(tools){tools.hidden=!hasSelection;tools.setAttribute('aria-hidden',String(!hasSelection))}$('layers').innerHTML=layers.length?layers.slice().reverse().map(l=>`<div class="layer-row ${l.id===selectedId?'active':''}" onclick="selectLayer('${l.id}')"><div class="layer-thumb">${l.type==='image'?`<img src="${l.src}">`:l.type==='shape'?'◆':'T'}</div><div class="layer-name" title="${esc(l.type==='text'?l.text||'Text':l.type==='shape'?(l.name||'Shape'):l.name||'Photo')}">${esc(l.type==='text'?l.text||'Text':l.type==='shape'?(l.name||'Shape'):l.name||'Photo')}</div><div class="layer-order"><button type="button" class="mini" aria-label="Move layer up" title="Move layer up" onclick="event.stopPropagation();moveLayer('${l.id}',1)">↑</button><button type="button" class="mini" aria-label="Move layer down" title="Move layer down" onclick="event.stopPropagation();moveLayer('${l.id}',-1)">↓</button></div></div>`).join(''):`<div class="status">No layers yet.</div>`}
window.selectLayer=id=>{selectedId=id;renderEditor()}
window.moveLayer=(id,dir)=>{const i=layers.findIndex(x=>x.id===id),j=i+dir;if(i<0||j<0||j>=layers.length)return;commitHistory();[layers[i],layers[j]]=[layers[j],layers[i]];selectedId=id;renderEditor();commitHistory()}
function deleteLayer(id){commitHistory();layers=layers.filter(x=>x.id!==id);if(selectedId===id)selectedId=layers.length?layers[layers.length-1].id:null;renderEditor();commitHistory()}
window.duplicateSelected=()=>{const l=selected();if(!l)return;commitHistory();const n=JSON.parse(JSON.stringify(l));n.id=newId();n.x=Math.min(620,n.x+24);n.y=Math.min(CANVAS_H+120,n.y+24);layers.push(n);selectedId=n.id;renderEditor();commitHistory();toast('Layer duplicated')}
window.toggleSelectedVisibility=()=>{const l=selected();if(!l)return;commitHistory();l.visible=l.visible===false;renderEditor();commitHistory()}
window.toggleSelectedLock=()=>{const l=selected();if(!l)return;commitHistory();l.locked=!l.locked;renderEditor();commitHistory();toast(l.locked?'Layer locked':'Layer unlocked')}
function updatePanel(){const l=selected();document.body.classList.toggle('v62-curve-editing',!!(l&&l.type==='text'&&l.curve));const selectionSection=$('selectionControls')?.closest('.panel-section');if(selectionSection){selectionSection.hidden=!l;selectionSection.style.display=l?'':'none'}$('selectionControls').textContent=l?`${l.type==='text'?'Text':l.type==='shape'?'Shape':'Photo'} selected · drag to move`:'Select an item on the preview';if(!l){$('textControls').style.display='none';$('textEffectsControls').style.display='none';$('presetControls').style.display='none';$('imageControls').style.display='none';$('curveControls').style.display='none';document.body.classList.remove('v62-curve-editing');return}$('opacity').value=l.opacity*100;$('opacityVal').textContent=Math.round(l.opacity*100)+'%';$('scale').value=Math.round(l.scale*100);$('scaleVal').textContent=Math.round(l.scale*100)+'%';$('rotation').value=l.rotation;$('rotationVal').textContent=Math.round(l.rotation)+'°';$('zoom').value=Math.round(l.scale*100);$('zoomVal').textContent=Math.round(l.scale*100)+'%';$('color').value=l.color||'#151515';$('colorHex').value=(l.color||'#151515').toUpperCase();$('shapeControls').style.display=l.type==='shape'?'block':'none';$('curveControls').style.display=l.type==='text'&&!!l.curve?'block':'none';if(l.type==='shape'){ $('shapeFillBtn').classList.toggle('on',!l.noFill);$('shapeOutlineBtn').classList.toggle('on',!!l.noFill);$('shapeStroke').value=Math.max(1,l.strokeWidth||2);$('shapeStrokeVal').textContent=l.strokeWidth||2;$('shapeStrokeColor').value=l.strokeColor||'#ff961a';$('shapeStrokeHexInput').value=(l.strokeColor||'#ff961a').toUpperCase();}$('textControls').style.display=l.type==='text'?'block':'none';$('textEffectsControls').style.display=l.type==='text'?'block':'none';$('presetControls').style.display=l.type==='text'?'block':'none';$('imageControls').style.display=l.type==='image'?'block':'none';if(l.type!=='image'){cropMode=false;$('stage').classList.remove('crop-mode')}$('removeBgBtn').disabled=l.type!=='image';if(l.type==='image'){$('cropX').value=l.cropX??50;$('cropXVal').textContent=Math.round(l.cropX??50);$('cropY').value=l.cropY??50;$('cropYVal').textContent=Math.round(l.cropY??50);$('mediaOutline').value=l.stickerOutline||0;$('mediaOutlineVal').textContent=l.stickerOutline||0;$('mediaOutlineColor').value=l.stickerOutlineColor||'#ffffff';$('mediaOutlineHex').value=(l.stickerOutlineColor||'#ffffff').toUpperCase();$('mediaShadow').value=l.stickerShadow||0;$('mediaShadowVal').textContent=l.stickerShadow||0}if(l.type==='text'){$('textValue').value=l.text;$('fontSize').value=l.fontSize;$('fontSizeVal').textContent=l.fontSize;$('textWidth').value=l.textWidth||300;$('textWidthVal').textContent=l.textWidth||300;document.querySelectorAll('.align-btn').forEach(b=>b.classList.toggle('on',b.dataset.align===(l.textAlign||'center')));$('letterSpacing').value=l.letterSpacing||0;$('letterVal').textContent=l.letterSpacing||0;$('lineHeight').value=(l.lineHeight||1)*100;$('lineVal').textContent=(l.lineHeight||1).toFixed(1);$('outlineToggle').classList.toggle('on',!!l.outline);$('shadowToggle').classList.toggle('on',!!l.shadow);$('curveToggle').classList.toggle('on',!!l.curve);$('highlightToggle').classList.toggle('on',!!l.highlight);$('outlineControls').style.display=l.outline?'block':'none';$('shadowControls').style.display=l.shadow?'block':'none';$('curveControls').style.display=l.curve?'block':'none';$('highlightControls').style.display=l.highlight?'block':'none';$('outlineWidth').value=l.outlineWidth||3;$('outlineWidthVal').textContent=l.outlineWidth||3;$('outlineColor').value=l.outlineColor||'#ffffff';$('outlineColorHex').value=(l.outlineColor||'#ffffff').toUpperCase();$('shadowBlur').value=l.shadowBlur||0;$('shadowBlurVal').textContent=l.shadowBlur||0;$('shadowOffset').value=l.shadowOffset||0;$('shadowOffsetVal').textContent=l.shadowOffset||0;$('shadowColor').value=l.shadowColor||'#000';$('shadowColorHex').value=(l.shadowColor||'#000').toUpperCase();$('curveAmount').value=l.curve||45;$('curveVal').textContent=l.curve||45;$('curveRadius').value=l.curveRadius||130;$('curveRadiusVal').textContent=l.curveRadius||130;$('curveArcMode').classList.toggle('on',(l.curveMode||'arc')==='arc');$('curveCircleMode').classList.toggle('on',l.curveMode==='circle');$('curveClockwise').classList.toggle('on',(l.curveDirection||'clockwise')==='clockwise');$('curveCounterclockwise').classList.toggle('on',l.curveDirection==='counterclockwise');$('curveRadiusField').style.display=(l.curveMode==='circle')?'block':'none';$('highlightPad').value=l.highlightPadding||10;$('highlightPadVal').textContent=l.highlightPadding||10;$('highlightRadius').value=l.highlightRadius||8;$('highlightRadiusVal').textContent=l.highlightRadius||8;$('highlightColor').value=l.highlightColor||'#fff';$('highlightColorHex').value=(l.highlightColor||'#fff').toUpperCase();$('highlightOpacity').value=(l.highlightOpacity??.85)*100;$('highlightOpacityVal').textContent=Math.round((l.highlightOpacity??.85)*100)+'%';document.querySelectorAll('.font-btn').forEach(b=>b.classList.toggle('active',b.textContent.trim().toLowerCase().startsWith(l.fontFamily.split(' ')[0].toLowerCase())))}}
window.setShapeFill=filled=>{const l=selected();if(!l||l.type!=='shape')return;commitHistory();l.noFill=!filled;if(filled){l.strokeWidth=0}else{l.strokeWidth=Math.max(2,l.strokeWidth||2);l.strokeColor=l.strokeColor||'#ff961a'}renderEditor();commitHistory()};window.setShapeStroke=v=>{const l=selected();if(!l||l.type!=='shape')return;beginContinuousEdit('shapeStroke:'+l.id);l.strokeWidth=+v;$('shapeStrokeVal').textContent=v;updateLayerVisual(l.id);saveDraft()};window.setShapeStrokeColor=v=>{const l=selected();if(!l||l.type!=='shape'||!validHex(v))return;commitHistory();l.strokeColor=normalizeHex(v).toLowerCase();$('shapeStrokeHexInput').value=normalizeHex(v);$('shapeStrokeColor').value=v;updateLayerVisual(l.id);commitHistory();saveDraft()};window.setShapeStrokeColorFromHex=v=>{if(!validHex(normalizeHex(v))){toast('Enter a valid HEX color, e.g. #FF961A');$('shapeStrokeHexInput').value=(selected()?.strokeColor||'#ff961a').toUpperCase();return}setShapeStrokeColor(normalizeHex(v))};
window.setProp=(k,v)=>{const l=selected();if(!l)return;beginContinuousEdit('p:'+l.id+':'+k);l[k]=v;if(k==='fontSize')$('fontSizeVal').textContent=v;if(k==='opacity')$('opacityVal').textContent=Math.round(v*100)+'%';if(k==='rotation')$('rotationVal').textContent=Math.round(v)+'°';updateLayerVisual(l.id);if(l.type==='text'&&(k==='fontSize'||k==='letterSpacing'||k==='textWidth'))updateTextGeometry(l);saveDraft()}
window.setTextProp=(k,v)=>{const l=selected();if(!l||l.type!=='text')return;beginContinuousEdit('t:'+l.id+':'+k);l[k]=v;const map={letterSpacing:['letterVal',v],lineHeight:['lineVal',(+v).toFixed(1)],outlineWidth:['outlineWidthVal',v],shadowBlur:['shadowBlurVal',v],shadowOffset:['shadowOffsetVal',v],curve:['curveVal',v],curveRadius:['curveRadiusVal',v],highlightPadding:['highlightPadVal',v],highlightRadius:['highlightRadiusVal',v],highlightOpacity:['highlightOpacityVal',Math.round(v*100)+'%']};if(map[k])$(map[k][0]).textContent=map[k][1];renderEditor();if(k==='curve'||k==='curveRadius')window.dispatchEvent(new CustomEvent('storystudio:curvechange'))}
let visualRaf=0;window.setImageProp=(k,v)=>{const l=selected();if(!l||l.type!=='image')return;beginContinuousEdit('i:'+l.id+':'+k);l[k]=v;if(k==='stickerOutline')$('mediaOutlineVal').textContent=v;if(k==='stickerShadow')$('mediaShadowVal').textContent=v;cancelAnimationFrame(visualRaf);visualRaf=requestAnimationFrame(()=>updateLayerVisual(l.id))};window.setCropPosition=(axis,v)=>{const l=selected();if(!l||l.type!=='image')return;beginContinuousEdit('crop:'+l.id+':'+axis);l[axis==='x'?'cropX':'cropY']=v;$(axis==='x'?'cropXVal':'cropYVal').textContent=Math.round(v);cancelAnimationFrame(visualRaf);visualRaf=requestAnimationFrame(()=>updateLayerVisual(l.id))}
window.setZoom=v=>{const l=selected();if(!l)return;beginContinuousEdit('zoom:'+l.id);l.scale=Math.max(.25,Math.min(3,v/100));$('zoomVal').textContent=Math.round(l.scale*100)+'%';updateLayerVisual(l.id);saveDraft()}
window.adjustZoom=d=>{const l=selected();if(!l)return;setZoom(Math.round((l.scale+d)*100));finishContinuousEdit('zoom:'+l.id)}
window.setScale=v=>{const l=selected();if(!l)return;beginContinuousEdit('scale:'+l.id);l.scale=+v;updateLayerVisual(l.id);$('scaleVal').textContent=Math.round(l.scale*100)+'%';saveDraft()}
window.setText=v=>{const l=selected();if(!l||l.type!=='text')return;const max=120;const clipped=String(v).slice(0,max);const input=$('textValue');if(input&&input.value!==clipped)input.value=clipped;const count=$('textCharCount');if(count)count.textContent=clipped.length+' / '+max;beginContinuousEdit('text:'+l.id);l.text=clipped;const layer=document.querySelector(`.layer[data-id="${l.id}"]`);if(l.curve){updateLayerVisual(l.id)}else{const el=layer&&layer.querySelector('.text-content');if(el)el.textContent=clipped||'TEXT'}saveDraft()}
window.setTextBoxWidth=v=>{const l=selected();if(!l||l.type!=='text')return;beginContinuousEdit('textWidth:'+l.id);l.textWidth=Math.max(80,Math.min(480,v));$('textWidthVal').textContent=Math.round(l.textWidth);updateLayerVisual(l.id);saveDraft()};
window.setTextAlign=align=>{const l=selected();if(!l||l.type!=='text')return;commitHistory();l.textAlign=align;updateLayerVisual(l.id);document.querySelectorAll('.align-btn').forEach(b=>b.classList.toggle('on',b.dataset.align===align));commitHistory();saveDraft()}
function updateTextGeometry(l){const el=document.querySelector(`.layer[data-id="${l.id}"]`);if(!el)return;const unit=stageUnit();el.style.fontSize=(l.fontSize*unit)+'px';el.style.letterSpacing=(l.letterSpacing||0)+'px';el.style.width=((l.textWidth||300)*unit)+'px';el.style.textAlign=l.textAlign||'center'}
window.setFont=(f,b)=>{const l=selected();if(!l||l.type!=='text')return;commitHistory();l.fontFamily=f;document.querySelectorAll('.font-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderEditor();commitHistory()}
window.toggleEffect=e=>{const l=selected();if(!l||l.type!=='text')return;commitHistory();if(e==='outline')l.outline=!l.outline;if(e==='shadow')l.shadow=!l.shadow;if(e==='curve'){l.curve=l.curve?0:45;l.curveMode=l.curveMode||'arc';l.curveRadius=l.curveRadius||130;l.curveDirection=l.curveDirection||'clockwise'}if(e==='highlight')l.highlight=!l.highlight;renderEditor();commitHistory()};
window.setCurveMode=mode=>{const l=selected();if(!l||l.type!=='text')return;commitHistory();l.curveMode=mode;l.curve=l.curve||45;l.curveRadius=l.curveRadius||130;l.curveDirection=l.curveDirection||'clockwise';renderEditor();commitHistory()};
window.setCurveDirection=direction=>{const l=selected();if(!l||l.type!=='text')return;commitHistory();l.curveDirection=direction;renderEditor();commitHistory()}
const textPresets={meme:{fontFamily:'Archivo Black',fontSize:62,color:'#ffffff',outline:true,outlineWidth:5,outlineColor:'#151515',shadow:true,shadowBlur:8,shadowOffset:4,highlight:false,curve:0},editorial:{fontFamily:'Playfair Display',fontSize:58,color:'#151515',outline:false,shadow:false,highlight:false,curve:0},impact:{fontFamily:'Bebas Neue',fontSize:76,color:'#ffffff',outline:true,outlineWidth:4,outlineColor:'#151515',shadow:true,shadowBlur:4,shadowOffset:3,highlight:false,curve:0},bubble:{fontFamily:'DM Sans',fontSize:54,textWidth:300,color:'#151515',outline:false,shadow:true,shadowBlur:8,shadowOffset:3,highlight:true,highlightColor:'#ffffff',highlightOpacity:.95,highlightPadding:12,highlightRadius:18,curve:0},marker:{fontFamily:'Permanent Marker',fontSize:58,color:'#ff961a',outline:false,shadow:false,highlight:false,curve:0},clean:{fontFamily:'DM Sans',fontSize:54,textWidth:300,color:'#151515',outline:false,shadow:false,highlight:false,curve:0}};
window.applyTextPreset=name=>{const l=selected(),p=textPresets[name];if(!l||l.type!=='text')return;commitHistory();Object.assign(l,p);if(p.color==='#ffffff')l.color='#2c2c2c';if(p.color==='#ff4d2e')l.color='#ff9614';if(p.outlineColor==='#151515')l.outlineColor='#2c2c2c';if(p.highlightColor==='#ffffff')l.highlightColor='#fffefa';l.fontFamily=p.fontFamily==='Playfair Display'?'DM Sans':p.fontFamily;renderEditor();commitHistory();toast(name+' style applied')}
window.fitImage=()=>{const l=selected();if(!l||l.type!=='image')return;commitHistory();l.fit='contain';renderEditor();commitHistory()}
window.fillImage=()=>{const l=selected();if(!l||l.type!=='image')return;commitHistory();l.fit='cover';renderEditor();commitHistory()}
window.toggleCropMode=()=>{const l=selected();if(!l||l.type!=='image'){toast('Select a photo first');return}if(l.fit!=='cover'){toast('Choose a crop ratio or Fill first');return}cropMode=!cropMode;$('cropModeBtn').classList.toggle('on',cropMode);$('cropModeBtn').textContent=cropMode?'Done adjusting crop':'Adjust crop on canvas';$('cropModeHint').textContent=cropMode?'Drag the photo inside its frame. Tap Done adjusting crop when finished.':'Choose a crop ratio, then adjust the photo directly on the canvas.';const st=$('stage');st.classList.toggle('crop-mode',cropMode);toast(cropMode?'Crop mode: drag photo inside frame':'Crop adjusted')};
window.applyCrop=ratio=>{cropMode=false;$('cropModeBtn')?.classList.remove('on');$('cropModeBtn').textContent='Adjust crop on canvas';$('stage').classList.remove('crop-mode');const l=selected();if(!l||l.type!=='image')return;commitHistory();const [a,b]=ratio.split(':').map(Number);let w=360,h=w*b/a;if(h>440){h=440;w=h*a/b}l.w=w;l.h=h;l.fit='cover';l.cropRatio=ratio;l.cropX=50;l.cropY=50;renderEditor();commitHistory();toast('Crop '+ratio)}
function validHex(v){return /^#([0-9a-f]{6}|[0-9a-f]{3})$/i.test(v)}function normalizeHex(v){v=v.trim();if(!v.startsWith('#'))v='#'+v;if(/^#[0-9a-f]{3}$/i.test(v))v='#'+v.slice(1).split('').map(x=>x+x).join('');return v.toUpperCase()}
function setColorControl(prop,hex){const v=normalizeHex(hex);if(!validHex(v)){toast('Enter a valid HEX color');return}const l=selected();if(!l)return;const key=prop==='mediaOutlineColor'?'stickerOutlineColor':prop;finishAllContinuousEdits();commitHistory();l[key]=v.toLowerCase();const n=$(prop),t=$(prop+'Hex');if(n)n.value=v;if(t)t.value=v;renderEditor();commitHistory()}
window.pickScreenColor=async prop=>{if(!window.EyeDropper){toast('Eyedropper is not supported here');return}try{const r=await new EyeDropper().open();setColorControl(prop,r.sRGBHex)}catch(e){if(e?.name!=='AbortError')toast('Could not sample color')}}
function wireColors(){['color','outlineColor','shadowColor','highlightColor','mediaOutlineColor'].forEach(prop=>{const n=$(prop),t=$(prop+'Hex');if(n)n.addEventListener('input',()=>setColorControl(prop,n.value));if(t)t.addEventListener('change',()=>setColorControl(prop,t.value))})}
async function normalizeImageFile(file){const name=(file.name||'').toLowerCase();if(name.endsWith('.heic')||name.endsWith('.heif')||file.type==='image/heic'||file.type==='image/heif'){try{const mod=await import('https://esm.sh/heic2any@0.0.4');const blob=await mod.default({blob:file,toType:'image/png'});return Array.isArray(blob)?blob[0]:blob}catch(e){toast('HEIC conversion failed. Try JPG or PNG.');throw e}}return file}
async function handleFile(file){if(!file)return;const stage=$('stage');try{stage?.classList.add('busy');$('status').textContent='Preparing photo…';file=await normalizeImageFile(file);const optimized=await optimizeImage(file);const src=optimized.data;addImage(src,file.name||'Photo',optimized.width,optimized.height);$('status').textContent='Photo added. Drag to move only; use Scale to resize and Crop controls to reframe.'}catch(e){console.error(e);toast('Could not add that photo')}finally{stage?.classList.remove('busy')}}
function readData(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}
async function optimizeImage(file){let src,img,w0,h0;try{if(window.createImageBitmap){img=await createImageBitmap(file);w0=img.width;h0=img.height}else{src=await readData(file);img=await loadImg(src);w0=img.naturalWidth||img.width;h0=img.naturalHeight||img.height}}catch(e){src=await readData(file);img=await loadImg(src);w0=img.naturalWidth||img.width;h0=img.naturalHeight||img.height}const max=1200,scale=Math.min(1,max/Math.max(w0,h0));const w=Math.max(1,Math.round(w0*scale)),h=Math.max(1,Math.round(h0*scale));const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{alpha:true});ctx.drawImage(img,0,0,w,h);if(img.close)img.close();const type=(file.type||'').toLowerCase();const needsAlpha=type==='image/png'||type==='image/webp'||type==='image/gif';const mime=needsAlpha?'image/png':'image/webp';const data=c.toDataURL(mime,needsAlpha?undefined:.80);if(data.length>1800000&&!needsAlpha)return {data:c.toDataURL('image/jpeg',.76),width:w,height:h,mime:'image/jpeg'};return {data,width:w,height:h,mime}}
window.handleFile=handleFile
window.pasteFromClipboard=async()=>{try{if(!navigator.clipboard?.read)throw 0;const items=await navigator.clipboard.read();for(const item of items){const type=item.types.find(t=>t.startsWith('image/'));if(type){const b=await item.getType(type);return handleFile(b)}}toast('No image found in clipboard')}catch(e){toast('Clipboard permission blocked. Use paste from your keyboard.')}}
document.addEventListener('paste',e=>{const item=[...(e.clipboardData?.items||[])].find(x=>x.type.startsWith('image/'));if(item){e.preventDefault();handleFile(item.getAsFile())}})
window.removeBackground=async()=>{const l=selected();if(!l||l.type!=='image')return;const fb=$('bgProcessFeedback'),title=$('bgpTitle'),sub=$('bgpSub'),bar=$('bgpProgress'),btn=$('removeBgBtn');let progressTimer;const show=(pct,msg,detail)=>{fb.classList.add('active');fb.classList.remove('done');title.textContent=msg;sub.textContent=detail;bar.style.width=pct+'%';setProgress(pct)};try{btn.disabled=true;btn.textContent='Removing…';show(3,'Preparing your cutout…','Keep this screen open. The first removal may take a little longer.');let n=5;progressTimer=setInterval(()=>{if(n<88){n+=n<20?3:n<55?1.2:.35;bar.style.width=Math.min(88,n)+'%';setProgress(Math.min(88,n))}},650);const srcImg=await loadImg(l.src);const max=1024,sc=Math.min(1,max/Math.max(srcImg.naturalWidth,srcImg.naturalHeight));const cc=document.createElement('canvas');cc.width=Math.max(1,Math.round(srcImg.naturalWidth*sc));cc.height=Math.max(1,Math.round(srcImg.naturalHeight*sc));cc.getContext('2d').drawImage(srcImg,0,0,cc.width,cc.height);const input=await new Promise((resolve,reject)=>cc.toBlob(b=>b?resolve(b):reject(Error('Could not prepare image')),'image/png'));show(12,'Removing the background…','Your image is being processed. You can keep waiting; it has not frozen.');const mod=await import('https://esm.sh/@imgly/background-removal@1.7.0');const fn=mod.default||mod.removeBackground;if(typeof fn!=='function')throw Error('unavailable');const blob=await fn(input,{progress:(k,c,t)=>{if(t){const pct=Math.max(12,Math.min(96,Math.round(c/t*100)));bar.style.width=pct+'%';setProgress(pct);sub.textContent='Processing image… '+pct+'%'}}});l.src=URL.createObjectURL(blob);if(l.assetId)assetStore.set(l.assetId,l.src);else{l.assetId=newId();assetStore.set(l.assetId,l.src)}l.fit='contain';l.name=(l.name||'photo').replace(/\.[^.]+$/,'')+' cutout.png';commitHistory();renderEditor();clearInterval(progressTimer);fb.classList.add('done');title.textContent='Background removed!';sub.textContent='Your cutout is ready. You can now erase any small leftovers.';bar.style.width='100%';setProgress(100);$('status').textContent='Background removed. Outline is now ready.';setTimeout(()=>{fb.classList.remove('active','done');setProgress(0)},2600)}catch(e){console.error(e);clearInterval(progressTimer);fb.classList.add('active');fb.classList.remove('done');title.textContent='Could not remove the background';sub.textContent='Check your connection and try again. Your original photo is still available.';bar.style.width='0%';$('status').textContent='Background removal could not load.';toast('Background removal unavailable');setProgress(0)}finally{clearInterval(progressTimer);btn.disabled=false;btn.textContent='Remove background'}}
window.stickerize=async()=>{const l=selected();if(!l||l.type!=='image'){toast('Select a photo first');return}await removeBackground();const x=selected();if(x&&x.type==='image'){commitHistory();x.stickerOutline=7;x.stickerOutlineColor='#ffffff';x.stickerShadow=10;renderEditor();commitHistory();toast('Photo cutout ready')}}
function setProgress(n){$('progress').style.width=n+'%'}
window.newCanvas=()=>{finishAllContinuousEdits();if(!layers.length)return;commitHistory();layers=[];selectedId=null;renderEditor();commitHistory();localStorage.removeItem('stickerStudioDraft');toast('New design')}
window.saveComposition=()=>{const data={layers:layers.map(l=>({...l}))};saved=[{id:'comp'+Date.now(),text:'Composition',cat:'Created',color:'#151515',style:'clean',data},...saved];localStorage.setItem('stickerStudioSaved',JSON.stringify(saved));toast('Composition saved')}
async function renderBlob(){const base=1400,baseH=Math.round(base*CANVAS_H/CANVAS_W),c=document.createElement('canvas');c.width=base;c.height=baseH;const ctx=c.getContext('2d',{alpha:true});ctx.clearRect(0,0,base,baseH);for(const l of layers){if(l.visible===false)continue;ctx.save();ctx.globalAlpha=l.opacity;ctx.translate(l.x*(base/CANVAS_W),l.y*(base/CANVAS_W));ctx.rotate(l.rotation*Math.PI/180);ctx.scale(l.scale*(base/CANVAS_W),l.scale*(base/CANVAS_W));if(l.type==='text'){drawTextCanvas(ctx,l)}else if(l.type==='shape'){drawShapeCanvas(ctx,l)}else{try{const img=await loadImg(l.src);drawImageCanvas(ctx,l,img)}catch(e){console.warn('Could not render image layer',e)}}ctx.restore()}const pad=2;const px=ctx.getImageData(0,0,base,baseH).data;let minX=base,minY=baseH,maxX=-1,maxY=-1;for(let y=0;y<baseH;y++){for(let x=0;x<base;x++){if(px[(y*base+x)*4+3]>8){if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y}}}if(maxX<0)return new Blob();minX=Math.max(0,minX-pad);minY=Math.max(0,minY-pad);maxX=Math.min(base-1,maxX+pad);maxY=Math.min(baseH-1,maxY+pad);const out=document.createElement('canvas');out.width=maxX-minX+1;out.height=maxY-minY+1;out.getContext('2d').drawImage(c,minX,minY,out.width,out.height,0,0,out.width,out.height);return await new Promise(r=>out.toBlob(r,'image/png'))}

function drawShapeCanvas(ctx,l){const w=l.w||150,h=l.h||150;ctx.fillStyle=l.noFill?'rgba(0,0,0,0)':(l.color||'#ff961a');ctx.strokeStyle=l.strokeColor||(l.noFill?'#ff961a':'#151515');ctx.lineWidth=l.strokeWidth||0;ctx.beginPath();switch(l.shape){case'square':ctx.rect(-w/2,-h/2,w,h);break;case'rectangle':ctx.rect(-w/2,-h*.26,w,h*.52);break;case'blob':{const sx=w/100,sy=h/100;ctx.moveTo(-32*sx,-38*sy);ctx.bezierCurveTo(-19*sx,-52*sy,-6*sx,-37*sy,5*sx,-42*sy);ctx.bezierCurveTo(25*sx,-51*sy,45*sx,-35*sy,38*sx,-17*sy);ctx.bezierCurveTo(33*sx,-5*sy,49*sx,6*sy,35*sx,25*sy);ctx.bezierCurveTo(22*sx,42*sy,8*sx,30*sy,-5*sx,40*sy);ctx.bezierCurveTo(-21*sx,51*sy,-40*sx,34*sy,-35*sx,18*sy);ctx.bezierCurveTo(-31*sx,5*sy,-49*sx,-3*sy,-42*sx,-19*sy);ctx.bezierCurveTo(-40*sx,-27*sy,-38*sx,-33*sy,-32*sx,-38*sy);ctx.closePath();break}case'rounded':roundedRect(ctx,-w/2,-h/2,w,h,Math.min(w,h)*.18);break;case'triangle':ctx.moveTo(0,-h/2);ctx.lineTo(w/2,h/2);ctx.lineTo(-w/2,h/2);ctx.closePath();break;case'star':for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?w*.25:w*.5,x=Math.cos(a)*r,y=Math.sin(a)*r;if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.closePath();break;case'speech':roundedRect(ctx,-w/2,-h/2,w,h,Math.min(w,h)*.12);ctx.moveTo(-w*.18,h/2);ctx.lineTo(-w*.32,h*.68);ctx.lineTo(-w*.05,h/2);ctx.closePath();break;default:ctx.ellipse(0,0,w/2,h/2,0,0,Math.PI*2)}if(!l.noFill)ctx.fill();if(l.strokeWidth>0||l.noFill)ctx.stroke()}
function drawTextCanvas(ctx,l){ctx.font=`900 ${l.fontSize}px "${l.fontFamily}"`;ctx.textAlign=l.textAlign||'center';ctx.textBaseline='middle';const rawLines=String(l.text||'TEXT').split(/\n/),lh=l.fontSize*(l.lineHeight||1),boxW=(l.textWidth||300),lines=[];rawLines.forEach(raw=>{const words=raw.split(/\s+/);let line='';words.forEach(word=>{const test=line?line+' '+word:word;if(line&&ctx.measureText(test).width>boxW){lines.push(line);line=word}else line=test});lines.push(line)});const maxW=Math.max(...lines.map(t=>ctx.measureText(t).width)),totalH=lines.length*lh;if(l.highlight){const p=l.highlightPadding||0;ctx.fillStyle=hexToRgba(l.highlightColor||'#fff',l.highlightOpacity??.85);roundedRect(ctx,-maxW/2-p,-totalH/2-p,maxW+p*2,totalH+p*2,Math.min(l.highlightRadius||0,40));ctx.fill()}if(l.shadow){ctx.shadowColor=l.shadowColor||'#000';ctx.shadowBlur=l.shadowBlur||0;ctx.shadowOffsetX=l.shadowOffset||0;ctx.shadowOffsetY=l.shadowOffset||0}if(l.curve){const chars=[...String(l.text||'TEXT')],dir=l.curveMode==='circle'?(l.curveDirection==='counterclockwise'?-1:1):(l.curve>=0?1:-1),advances=chars.map(ch=>Math.max(1,ctx.measureText(ch).width+(l.letterSpacing||0))),totalAdvance=advances.reduce((a,b)=>a+b,0);
 if(l.curveMode==='circle'){
  const radius=Math.max(Number(l.curveRadius)||130,totalAdvance/(Math.PI*2)),step=(Math.PI*2)/Math.max(1,chars.length);
  chars.forEach((ch,i)=>{const a=dir*(i*step),xx=Math.sin(a)*radius,yy=radius-Math.cos(a)*radius;ctx.save();ctx.translate(xx,yy);ctx.rotate(a);drawTextWithOutline(ctx,ch,0,0,l);ctx.restore()});
 }else{
  const curveStrength=Math.min(1,Math.abs(l.curve)/100),totalAngle=Math.max(.08,curveStrength*Math.PI),radius=Math.max(90,totalAdvance/totalAngle),actualAngle=totalAdvance/radius;let cursor=-actualAngle/2;
  chars.forEach((ch,i)=>{const a=dir*(cursor+advances[i]/(2*radius)),xx=Math.sin(a)*radius,yy=(l.curve>=0?-1:1)*(radius-Math.cos(a)*radius);ctx.save();ctx.translate(xx,yy);ctx.rotate(a*dir);drawTextWithOutline(ctx,ch,0,0,l);ctx.restore();cursor+=advances[i]/radius});
 }
}else {const x=l.textAlign==='left'?-maxW/2:l.textAlign==='right'?maxW/2:0;lines.forEach((line,i)=>drawTextWithOutline(ctx,line,x,(i-(lines.length-1)/2)*lh,l))}}
function drawTextWithOutline(ctx,text,x,y,l){if(l.outline){ctx.lineJoin='round';ctx.strokeStyle=l.outlineColor||'#fff';ctx.lineWidth=(l.outlineWidth||1)*2;ctx.strokeText(text,x,y)}ctx.fillStyle=l.color||'#151515';ctx.fillText(text,x,y)}
function drawImageCanvas(ctx,l,img){const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;let sx=0,sy=0,sw=iw,sh=ih;if(l.fit==='cover'){const target=l.w/l.h,source=iw/ih;if(source>target){sw=ih*target;sx=(iw-sw)*(l.cropX??50)/100}else{sh=iw/target;sy=(ih-sh)*(l.cropY??50)/100}}const fit=Math.min(l.w/sw,l.h/sh),dw=sw*fit,dh=sh*fit;if(l.stickerOutline){const r=Math.max(1,l.stickerOutline),c=l.stickerOutlineColor||'#fff';const f=[];for(let i=0;i<8;i++){const a=2*Math.PI*i/8;f.push(`drop-shadow(${Math.cos(a)*r}px ${Math.sin(a)*r}px 0 ${c})`)}ctx.filter=f.join(' ');ctx.drawImage(img,sx,sy,sw,sh,-dw/2,-dh/2,dw,dh);ctx.filter='none'}else{ctx.drawImage(img,sx,sy,sw,sh,-dw/2,-dh/2,dw,dh)}if(l.stickerShadow){ctx.filter=`drop-shadow(${l.stickerShadow/2}px ${l.stickerShadow/2}px ${l.stickerShadow}px rgba(0,0,0,.35))`;ctx.drawImage(img,sx,sy,sw,sh,-dw/2,-dh/2,dw,dh);ctx.filter='none'}}
function roundedRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function hexToRgba(hex,a){hex=hex.replace('#','');if(hex.length===3)hex=hex.split('').map(x=>x+x).join('');const n=parseInt(hex,16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`}
function loadImg(src){return new Promise((res,rej)=>{const i=new Image();i.onload=async()=>{try{if(i.decode)await i.decode()}catch(_){}res(i)};i.onerror=rej;i.src=src})}
window.exportPNG=async()=>{if(!layers.length){toast('Add something first');return}finishAllContinuousEdits();const status=$('status');if(status)status.textContent='Exporting transparent PNG…';const blob=await renderBlob();const a=document.createElement('a');a.download='story-studio.png';a.href=URL.createObjectURL(blob);a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('PNG exported · transparent + tightly cropped');if(status)status.textContent='PNG ready to add to your Stories or posts.'}
window.copyPNG=async()=>{try{finishAllContinuousEdits();const blob=await renderBlob();if(!navigator.clipboard?.write)throw 0;await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);toast('Graphic copied')}catch(e){toast('Copy is not supported here. Use Export PNG.')}}
window.sharePNG=async()=>{try{finishAllContinuousEdits();const blob=await renderBlob();const file=new File([blob],'sticker-studio.png',{type:'image/png'});if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share({files:[file],title:'Story Studio'});toast('Shared')}else{await copyPNG()}}catch(e){if(e?.name!=='AbortError')toast('Share is not available here')}}
function toast(t){const e=$('toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1700)}
window.addEventListener('error',e=>{
  console.error('Story Studio runtime error:',e.error||e.message);
  const status=$('status');
  if(status)status.textContent='A feature ran into a problem. Your design is still here; try that action again.';
});
window.addEventListener('unhandledrejection',e=>{
  console.error('Sticker Studio async error:',e.reason);
});

wireColors();
try{
  // Start with a blank canvas only when no recoverable draft exists.
  // Keep an empty canvas on a fresh start. Existing saved compositions remain untouched.
  // Autosaved drafts are retained as a recovery copy, not deleted on every boot.
  layers=[];
  selectedId=null;
  renderEditor();
  renderHome();renderSaved();
}catch(e){
  console.error('Sticker Studio boot error:',e);
  const status=$('status');
  if(status)status.textContent='Something went wrong while loading the editor. Refresh to try again.';
}



(function(){
const dict={
"YOUR STORY, YOUR STYLE":"SEU STORY, SUA IDENTIDADE",
"Create your Story.":"Crie seu Story.",
"Build Stories that look and feel like you. Combine expressive type, photo cutouts and bold graphic elements, then export your design and add it to your post.":"Crie Stories com a sua identidade. Combine textos marcantes, recortes de fotos e elementos gráficos. Depois, exporte sua criação e publique.",
"Your way.":"Do seu jeito.",
"Create your Story ↗":"Crie seu Story ↗",
"What will make your Story yours?":"O que vai deixar seu Story com a sua cara?",
"Saved designs.":"Criações salvas.",
"Your designs are saved on this device.":"Suas criações ficam salvas neste dispositivo.",
"Create or save a design and it will appear here.":"Crie ou salve um design para encontrá-lo aqui.",
"Photo outline":"Contorno da foto",
"Photo shadow":"Sombra da foto",
"New design":"Nova criação",
"✦ Cutout + outline":"✦ Recorte com contorno",
"Cutout + outline":"Recorte com contorno",
"Copy graphic":"Copiar arte",
"Saved graphics.":"Artes salvas.",
"Your graphics are saved on this device.":"Suas artes ficam salvas neste dispositivo.",
"Your library is empty.":"Sua biblioteca está vazia.",
"Create or save a graphic and it will appear here.":"Crie ou salve uma arte para encontrá-la aqui.",
"Save graphic":"Salvar arte",
"Graphic copied":"Arte copiada",
"PNG ready to add to your Stories or posts.":"PNG pronto para usar nos seus Stories ou publicações.",
"Photo cutout ready":"Recorte de foto pronto",
"Make it stand out.":"Faça seu Story se destacar.",
"Stickerize":"Recorte com contorno",
"Copy sticker":"Copiar arte",
"Sticker copied":"Arte copiada",
"Save sticker":"Salvar arte",
"DESIGN TOOLS FOR STORIES":"FERRAMENTAS CRIATIVAS PARA STORIES",
"Create your first graphic ↗":"Crie sua primeira arte ↗",
"Create expressive text, photo cutouts and bold graphic elements that make your Stories feel unmistakably yours. Export transparent PNGs and add them to your posts.":"Crie textos marcantes, recortes de fotos e elementos gráficos para deixar seus Stories com a sua cara. Exporte em PNG com fundo transparente e publique onde quiser.",
"START WITH AN IDEA":"TUDO COMEÇA COM UMA IDEIA",
"What will make your Story different?":"O que vai fazer seu Story se destacar?",
"Make a statement":"Dê destaque à sua mensagem",
"Create a custom photo cutout":"Crie um recorte de foto do seu jeito",
"Add a graphic twist":"Dê um toque gráfico",
"FROM IDEA TO STORY":"DA IDEIA À PUBLICAÇÃO",
"Build":"Monte",
"Customize":"Personalize",
"Add to your Story":"Publique no seu Story",
"Make every Story":"Faça cada Story",
"stand out.":"se destacar.",
"Start creating ↗":"Comece a criar ↗",
"Browse ideas":"Explore ideias",
"Home":"Início",
"Create":"Criar",
"Explore":"Explorar",
"Saved":"Salvos",
"Undo":"Desfazer",
"Redo":"Refazer",
"+ Text":"+ Texto",
"+ Photo":"+ Foto",
"Export PNG":"Exportar PNG",
"Preview":"Prévia",
"Quick tools":"Ferramentas rápidas",
"Paste image":"Colar imagem",
"Remove background":"Remover fundo",
"New canvas":"Nova tela",
"Share":"Compartilhar",
"Add shape":"Adicionar forma",
"Circle":"Círculo",
"Square":"Quadrado",
"Rectangle":"Retângulo",
"Rounded":"Cantos arredondados",
"Blob":"Forma orgânica",
"Triangle":"Triângulo",
"Star":"Estrela",
"Bubble":"Balão",
"Selected layer":"Camada selecionada",
"Select a layer on the canvas.":"Selecione uma camada na tela.",
"Opacity":"Opacidade",
"Scale":"Escala",
"Rotation":"Rotação",
"Zoom":"Zoom",
"Color":"Cor",
"Eyedropper":"Conta-gotas",
"Layers":"Camadas",
"Shape style":"Estilo da forma",
"Fill":"Preenchimento",
"● Fill":"● Preenchimento",
"Outline only":"Somente contorno",
"◯ Outline only":"◯ Somente contorno",
"Outline width":"Espessura do contorno",
"Outline color":"Cor do contorno",
"Text":"Texto",
"Font":"Fonte",
"Your text":"Seu texto",
"Your text updates on the preview as you type.":"O texto aparece na prévia enquanto você digita.",
"Type your text here…":"Digite seu texto aqui…",
"Size":"Tamanho",
"Text box width":"Largura da caixa de texto",
"Text width":"Largura do texto",
"Adjust size and width to control how your text wraps.":"Ajuste o tamanho e a largura para controlar a quebra das linhas.",
"Alignment":"Alinhamento",
"Left":"À esquerda",
"Center":"Centralizado",
"Right":"À direita",
"Quick styles":"Estilos rápidos",
"Meme":"Meme",
"Editorial":"Editorial",
"Impact":"Impacto",
"Marker":"Marcador",
"Clean":"Minimalista",
"Text design":"Estilo do texto",
"Text looks":"Estilos de texto",
"Letter spacing":"Espaçamento entre letras",
"Line height":"Altura da linha",
"Effects":"Efeitos",
"Drop shadow":"Sombra projetada",
"Curved text":"Texto curvo",
"Highlight":"Realce",
"Photo":"Foto",
"Fit":"Ajustar",
"Adjust crop on canvas":"Ajustar recorte na tela",
"Crop horizontal":"Recorte horizontal",
"Crop vertical":"Recorte vertical",
"Add text or a photo from the toolbar above. Paste image imports an image from your clipboard.":"Adicione texto ou uma foto pela barra acima. Use “Colar imagem” para inserir uma imagem da área de transferência.",
"Shape layer selected. Drag inside to move only. Use Scale and Rotation controls to transform; use crop mode to reframe photos.":"Forma selecionada. Arraste para movê-la e use os controles de escala e rotação para ajustar.",
"Text layer selected. Drag inside to move only. Use Scale and Rotation controls to transform; use crop mode to reframe photos.":"Texto selecionado. Arraste para movê-lo e use os controles de escala e rotação para ajustar.",
"Image layer selected. Drag inside to move only. Use Scale and Rotation controls to transform; use crop mode to reframe photos.":"Imagem selecionada. Arraste para movê-la e use os controles de escala e rotação para ajustar.",
"PNG exported · transparent + tightly cropped":"PNG exportado com fundo transparente e recorte ajustado",
"Add something first":"Adicione algo primeiro",
"Select a photo first":"Selecione uma foto primeiro",
"Processing photo…":"Processando foto…",
"Exporting transparent PNG…":"Exportando PNG com fundo transparente…",
"PNG ready for Stories, WhatsApp or Telegram.":"PNG pronto para usar nos Stories, WhatsApp ou Telegram.",
"Cutouts":"Recortes",
"Type effects":"Efeitos de texto",
"Graphic shapes":"Formas gráficas",
"Outline":"Contorno",
"Nothing here yet. Try another search.":"Ainda não há nada aqui. Tente outra busca.",
"Shapes":"Formas",
"Style":"Estilo",
"Removing background…":"Removendo o fundo…",
"Keep this screen open. This can take a little while on your first cutout.":"Mantenha esta tela aberta. Na primeira vez, o recorte pode demorar um pouco.",
"＋ Add shape":"＋ Adicionar forma",
"Erase leftovers":"Apagar sobras",
"Finish erasing":"Concluir limpeza",
"Brush size":"Tamanho do pincel",
"Paint over leftover pixels to erase them. Your changes update the cutout.":"Passe o pincel sobre as sobras para apagá-las. O recorte será atualizado.",
"Crop 1:1":"Recorte 1:1",
"Crop 4:5":"Recorte 4:5",
"Crop 9:16":"Recorte 9:16",
"Crop 16:9":"Recorte 16:9",
"Choose a crop ratio, then tap Adjust crop on canvas and drag the photo inside its frame.":"Escolha a proporção e toque em “Ajustar recorte na tela”. Depois, arraste a foto dentro da moldura.",
"Choose a crop ratio, then move the image inside the frame.":"Escolha a proporção e mova a imagem dentro da moldura.",
"WOW!":"UAU!",
"Story":"Story",
"BAM!":"OPA!",
"Hey!":"Ei!",
"Note":"Nota",
"hello":"olá",
"Width":"Largura",
"Blur":"Desfoque",
"Offset":"Deslocamento",
"Shadow color":"Cor da sombra",
"Curve":"Curvatura",
"Padding":"Espaçamento interno",
"Radius":"Raio",
"Highlight color":"Cor do realce",
"Duplicate":"Duplicar",
"Hide":"Ocultar",
"Lock":"Bloquear",
"Your library":"Sua biblioteca",
"No layers yet.":"Nenhuma camada por enquanto.",
"Change language":"Mudar idioma",
"How it works":"Como funciona",
"Creation tools":"Ferramentas de criação",
"Align left":"Alinhar à esquerda",
"Align center":"Centralizar",
"Align right":"Alinhar à direita",
"Meme style":"Estilo meme",
"Editorial style":"Estilo editorial",
"Impact style":"Estilo de impacto",
"Bubble style":"Estilo balão",
"Marker style":"Estilo marcador",
"Clean style":"Estilo minimalista",
"Move layer up":"Mover camada para cima",
"Move layer down":"Mover camada para baixo",
"Make Stories people stop for.":"Crie conteúdo que as pessoas parem para ver.",
"Make your Story stand out.":"Faça seu Story se destacar.",
"Create content people stop to watch.":"Crie conteúdo que as pessoas parem para ver."
,"Outline color hex code":"Código hexadecimal da cor do contorno",
"Hex color":"Código hexadecimal da cor",
"Pick a color from the design":"Escolher uma cor da arte",
"Photo outline hex code":"Código hexadecimal do contorno da foto",
"Text outline hex code":"Código hexadecimal do contorno do texto",
"Shadow hex code":"Código hexadecimal da sombra",
"Highlight hex code":"Código hexadecimal do realce",
"Apply":"Aplicar",
"Cancel":"Cancelar",
"Close":"Fechar",
"Delete":"Excluir",
"Remove":"Remover",
"Done":"Concluir",
"Loading…":"Carregando…",
"Please wait…":"Aguarde…",
"Something went wrong while loading the editor. Refresh to try again.":"O editor encontrou um problema ao carregar. Atualize a página e tente novamente.",
"A feature ran into a problem. Your design is still here; try that action again.":"Uma ferramenta encontrou um problema. Sua criação continua aqui. Tente novamente.",
"Could not open cutout for editing":"Não foi possível abrir o recorte para edição",
"Could not render image layer":"Não foi possível renderizar a camada de imagem",
"Cutout cleanup finished.":"Limpeza do recorte concluída.",
"Tap photo to erase":"Toque na foto para apagar",
"Erase mode is ready. On the preview above, touch and drag over leftover pixels. Only the painted area will be erased; the photo will not move.":"A limpeza está pronta. Na prévia acima, toque e arraste sobre as sobras. Só a área pintada será apagada, sem mover a foto.",
"Erase mode ready. Touch and drag over leftover pixels on the preview.":"Modo de limpeza pronto. Toque e arraste sobre as sobras na prévia.",
"Create a new Story":"Criar um novo Story",
"PNG exported · transparent + tightly cropped":"PNG exportado com fundo transparente e recorte ajustado",
"Text layer selected.":"Texto selecionado.",
"Image layer selected.":"Imagem selecionada.",
"Shape layer selected.":"Forma selecionada.",
"Move layer up":"Mover camada para cima",
"Move layer down":"Mover camada para baixo",
"Mode":"Modo","Arc":"Arco","Circle":"Círculo","Radius":"Raio","Direction":"Direção","Clockwise":"Sentido horário","Counterclockwise":"Sentido anti-horário",
"Copy PNG":"Copiar PNG",
"Element settings":"Ajustes do elemento",
"Your Story starts here":"Seu Story começa aqui",
"Edit text":"Editar texto",
"Edit shape":"Editar forma",
"Edit photo":"Editar foto",};
let lang="pt";
const languageVersion="ptbr-default-v1";
try{
 const savedVersion=localStorage.getItem("storyStudioLanguageVersion");
 if(savedVersion!==languageVersion){
  // Migrate existing installs: the new product default is Brazilian Portuguese.
  localStorage.setItem("storyStudioLanguage","pt");
  localStorage.setItem("stickerStudioLanguage","pt");
  localStorage.setItem("storyStudioLanguageVersion",languageVersion);
  lang="pt";
 }else{
  lang=(localStorage.getItem("storyStudioLanguage")||"pt")==="en"?"en":"pt";
 }
}catch(e){lang="pt";}
const originalText=new WeakMap();
const reverseDict=Object.fromEntries(Object.entries(dict).map(([en,pt])=>[pt,en]));
function translateTextNode(node){
 if(!node||node.nodeType!==Node.TEXT_NODE)return;
 if(!originalText.has(node))originalText.set(node,node.nodeValue);
 const original=originalText.get(node),trim=original.trim();
 if(!trim)return;
 const translated=lang==="pt"?(dict[trim]||trim):(reverseDict[trim]||trim);
 node.nodeValue=original.replace(trim,translated);
}
function translateTree(root){
 if(!root)return;
 if(root.nodeType===Node.TEXT_NODE){translateTextNode(root);return}
 root.childNodes&&root.childNodes.forEach(translateTree);
 if(root.nodeType===Node.ELEMENT_NODE){
  ["placeholder","aria-label","title"].forEach(attr=>{
   const key="original"+attr.replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase());
   if(root.hasAttribute(attr)&&!root.dataset[key])root.dataset[key]=root.getAttribute(attr);
   const original=root.dataset[key];
   if(original)root.setAttribute(attr,lang==="pt"?(dict[original]||original):(reverseDict[original]||original));
  });
 }
}
function applyLanguage(){
 document.documentElement.lang=lang==="pt"?"pt-BR":"en";
 translateTree(document.body);
 const b=document.getElementById("languageToggle");
 if(b){b.textContent=lang==="pt"?"EN":"PT-BR";b.setAttribute("aria-label",lang==="pt"?"Mudar idioma para inglês":"Mudar idioma para português");}
}
window.toggleLanguage=function(){
 lang=lang==="pt"?"en":"pt";
 try{localStorage.setItem("storyStudioLanguage",lang);localStorage.setItem("stickerStudioLanguage",lang);localStorage.setItem("storyStudioLanguageVersion",languageVersion)}catch(e){}
 applyLanguage();
 window.refreshBrandCopy&&window.refreshBrandCopy();
 const b=document.getElementById("languageToggle");
 if(b){b.style.transform="scale(.97)";setTimeout(()=>b.style.transform="",120)}
};
document.addEventListener("click",function(e){
 const b=e.target.closest("#languageToggle");
 if(b){e.preventDefault();e.stopPropagation();window.toggleLanguage()}
});
const observer=new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>translateTree(n))));
window.refreshBrandCopy=function(){
 const hero=document.querySelector('#home .hero h1');
 const sub=document.querySelector('#home .hero .sub');
 const createBtn=document.querySelector('#home .hero .actions .btn');
 if(lang==="pt"){
  if(hero)hero.innerHTML='Faça seu Story<br><span class="headline-accent">se destacar.</span>';
  if(sub)sub.textContent='Crie conteúdo que as pessoas parem para ver, com textos marcantes, fotos e elementos gráficos que tenham a sua cara.';
  if(createBtn)createBtn.textContent='Criar meu Story ↗';
  document.title="Story Studio — Faça seu Story se destacar";
 }else{
  if(hero)hero.innerHTML='Make your Story<br><span class="headline-accent">stand out.</span>';
  if(sub)sub.textContent='Create content people stop to watch, with bold type, photos and graphic elements that feel unmistakably yours.';
  if(createBtn)createBtn.textContent='Create my Story ↗';
  document.title="Story Studio — Make your Story stand out";
 }
};
const originalShow=window.show;
if(typeof originalShow==='function'&&!originalShow.__languageRefresh){
 const wrappedShow=function(){const result=originalShow.apply(this,arguments);applyLanguage();return result};
 wrappedShow.__languageRefresh=true;
 window.show=wrappedShow;
}
function init(){
 applyLanguage();
 window.refreshBrandCopy();
 observer.observe(document.body,{subtree:true,childList:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();



/* Detect the virtual keyboard without hiding the live canvas while editing. */
(function(){
 const textFieldIds=['textValue'];
 const isEditing=()=>textFieldIds.some(id=>{const el=document.getElementById(id);return el&&document.activeElement===el}) ||
   (document.activeElement && document.activeElement.matches('.field input[type="text"], .field textarea, .field select'));
 let baseHeight=window.innerHeight;
 function syncKeyboard(){
   const vv=window.visualViewport;
   const open=!!(isEditing() && vv && (vv.height < window.innerHeight * .78 || window.innerHeight-vv.height > 140));
   document.body.classList.toggle('keyboard-open',open);
   if(open){
     const top=Math.max(8,Math.min(48,Math.round((vv.offsetTop||0)+8)));
     document.documentElement.style.setProperty('--keyboard-preview-top',top+'px');
   }else document.documentElement.style.removeProperty('--keyboard-preview-top');
 }
 if(window.visualViewport){
   window.visualViewport.addEventListener('resize',syncKeyboard);
   window.visualViewport.addEventListener('scroll',syncKeyboard);
 }
 document.addEventListener('focusin',()=>setTimeout(syncKeyboard,80));
 document.addEventListener('focusout',()=>setTimeout(syncKeyboard,180));
 window.addEventListener('resize',syncKeyboard);
})();



/* Manual alpha eraser: capture gestures before layer dragging can start. */
let eraseMode=false,eraseStroke=null;
window.toggleEraseMode=async()=>{
 const l=selected();if(!l||l.type!=='image'){toast('Select a photo first');return}
 try{
  if(!l.src)throw new Error('Missing image');
  const img=await loadImg(l.src);
  const c=document.createElement('canvas');c.width=img.naturalWidth||img.width;c.height=img.naturalHeight||img.height;
  c.getContext('2d',{alpha:true}).drawImage(img,0,0,c.width,c.height);
  l.eraseCanvas=c;
  eraseMode=true;document.body.classList.add('erase-mode');
  $('eraseModeBtn').classList.add('active');$('eraseModeBtn').textContent='Tap photo to erase';$('eraserSizeWrap').style.display='block';$('eraserHint').style.display='block';
  $('eraserHint').textContent='Erase mode is ready. On the preview above, touch and drag over leftover pixels. Only the painted area will be erased; the photo will not move.';
  $('status').textContent='Erase mode ready. Touch and drag over leftover pixels on the preview.';
  $('stage').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(e){console.error(e);toast('Could not open cutout for editing')}
};
window.clearEraseMode=()=>{
 eraseMode=false;eraseStroke=null;document.body.classList.remove('erase-mode');
 $('eraseModeBtn')?.classList.remove('active');if($('eraseModeBtn'))$('eraseModeBtn').textContent='Erase leftovers';if($('eraserSizeWrap'))$('eraserSizeWrap').style.display='none';if($('eraserHint'))$('eraserHint').style.display='none';
 if($('status'))$('status').textContent='Cutout cleanup finished.';
};
function eraseAt(e){
 if(!eraseStroke)return;
 const r=eraseStroke.img.getBoundingClientRect(),c=eraseStroke.canvas,ctx=c.getContext('2d');
 if(!r.width||!r.height)return;
 const x=Math.max(0,Math.min(c.width,(e.clientX-r.left)/r.width*c.width)),y=Math.max(0,Math.min(c.height,(e.clientY-r.top)/r.height*c.height));
 const radius=(+$('eraserSize').value/2)*(c.width/r.width);
 ctx.save();ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(x,y,Math.max(1,radius),0,Math.PI*2);ctx.fill();ctx.restore();
}
document.addEventListener('pointerdown',e=>{
 if(!eraseMode)return;
 const layerEl=e.target.closest?.('#stage .layer');
 if(!layerEl)return;
 const id=layerEl.dataset.id,l=layers.find(x=>x.id===id);
 if(!l||l.type!=='image'||id!==selectedId||!l.eraseCanvas)return;
 const img=layerEl.querySelector('.layer-media');if(!img)return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 commitHistory();
 eraseStroke={img,canvas:l.eraseCanvas,id:l.id};
 try{layerEl.setPointerCapture(e.pointerId)}catch(_){}
 eraseAt(e);
},{capture:true});
document.addEventListener('pointermove',e=>{if(eraseStroke){e.preventDefault();e.stopPropagation();eraseAt(e)}},{capture:true});
function finishEraseStroke(){
 if(!eraseStroke)return;
 const stroke=eraseStroke;eraseStroke=null;
 const l=layers.find(x=>x.id===stroke.id);if(!l)return;
 l.src=stroke.canvas.toDataURL('image/png');if(!l.assetId)l.assetId=newId();assetStore.set(l.assetId,l.src);
 l.name=(l.name||'photo').replace(/ cutout\.png$/,'')+' cutout.png';
 renderEditor();commitHistory();saveDraft();
}
document.addEventListener('pointerup',finishEraseStroke,{capture:true});
document.addEventListener('pointercancel',finishEraseStroke,{capture:true});



/* V37: when Android opens the keyboard, bring the active text field into view below the pinned preview. */
(function(){
  let lastOpen=false;
  function keepEditorVisible(){
    const field=document.getElementById('textEntryField');
    const input=document.getElementById('textValue');
    if(!field||!input)return;
    const focused=document.activeElement===input;
    const vv=window.visualViewport;
    const open=focused && !!vv && (vv.height < window.innerHeight*.78 || window.innerHeight-vv.height>140);
    if(open){
      document.body.classList.add('keyboard-open');
      if(!lastOpen){
        requestAnimationFrame(()=>requestAnimationFrame(()=>{
          field.scrollIntoView({behavior:'auto',block:'start'});
        }));
      }
    }
    lastOpen=open;
  }
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize',keepEditorVisible);
    window.visualViewport.addEventListener('scroll',keepEditorVisible);
  }
  document.addEventListener('focusin',()=>setTimeout(keepEditorVisible,100));
})();



(function(){
  function prioritizeTextControls(){
    const panel=document.querySelector('#create .panel');
    const text=document.getElementById('textControls');
    if(panel&&text&&text.parentElement===panel&&panel.firstElementChild!==text){
      panel.insertBefore(text,panel.firstElementChild);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',prioritizeTextControls,{once:true});
  else prioritizeTextControls();
})();



/* V41: keep the character count in sync whenever a text layer is selected. */
(function(){
 const sync=()=>{
   const input=document.getElementById('textValue');
   const count=document.getElementById('textCharCount');
   if(input&&count)count.textContent=String(input.value||'').length+' / 120';
 };
 document.addEventListener('input',e=>{if(e.target&&e.target.id==='textValue')sync()});
 document.addEventListener('click',e=>{if(e.target.closest('.layer-row'))setTimeout(sync,0)});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
})();



/* V43: preserve a visible preview when navigating text formatting options. */
(function(){
  const input=document.getElementById('textValue');
  if(!input)return;
  function keepPreviewAndField(){
    if(document.activeElement!==input)return;
    const field=document.getElementById('textEntryField');
    if(field){
      requestAnimationFrame(()=>{
        const r=field.getBoundingClientRect();
        if(r.top<154 || r.top>window.innerHeight-150){
          window.scrollBy({top:r.top-154,behavior:'auto'});
        }
      });
    }
  }
  input.addEventListener('focus',()=>setTimeout(keepPreviewAndField,180));
  if(window.visualViewport)window.visualViewport.addEventListener('resize',()=>{
    if(document.activeElement===input)setTimeout(keepPreviewAndField,80);
  });
})();



function toggleShapeMenu(){
 const menu=document.getElementById('shapeOptionsMenu');
 const panelToggle=document.getElementById('shapeMenuToggle');
 if(!menu)return;
 const opening=menu.hidden;
 menu.hidden=!opening;
 if(panelToggle)panelToggle.setAttribute('aria-expanded',String(opening));
 const dockToggle=document.getElementById('addShapeMenuToggle');
 if(dockToggle)dockToggle.setAttribute('aria-expanded',String(opening));
 if(opening)document.getElementById('shapeMenuToggle')?.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function closeShapeMenu(){
 const menu=document.getElementById('shapeOptionsMenu');
 const panelToggle=document.getElementById('shapeMenuToggle');
 if(menu)menu.hidden=true;
 if(panelToggle)panelToggle.setAttribute('aria-expanded','false');
 const dockToggle=document.getElementById('addShapeMenuToggle');
 if(dockToggle)dockToggle.setAttribute('aria-expanded','false');
}



(function(){
 const panel=document.querySelector('#create .panel');
 if(!panel)return;
 try{renderLayers()}catch(e){console.warn('Layer panel initialisation skipped',e)}
 const sectionIds=['textControls','presetControls','textEffectsControls','outlineControls','shadowControls','curveControls','highlightControls','imageControls','shapeControls','selectionControls'];
 const revealForMode=mode=>{
   const chosen=mode==='text'?['textControls','presetControls','textEffectsControls','outlineControls','shadowControls','curveControls','highlightControls']:
      mode==='photo'?['imageControls','selectionControls']:
      mode==='shape'?['shapeControls','selectionControls']:
      mode==='layers'?['layers']:sectionIds;
   sectionIds.forEach(id=>{const el=document.getElementById(id);if(el)el.hidden=!chosen.includes(id)});
   const layersSection=document.getElementById('layers')?.closest('.panel-section');
   const quickSection=panel.querySelector(':scope > .panel-section');
   const selector=chosen.map(id=>'#'+id).join(',');
   panel.querySelectorAll(':scope > .panel-section').forEach(section=>{
     const containsChosen=!!selector&&(section.matches(selector)||!!section.querySelector(selector));
     const show=(section===quickSection&&mode==='tools')||
       (section===layersSection&&(mode==='layers'||mode==='tools'))||containsChosen;
     section.hidden=!show;
     if(show)section.style.removeProperty('display');
     else section.style.setProperty('display','none','important');
   });
 };
 if(!panel.querySelector('.panel-sheet-handle')){
  const handle=document.createElement('button');
  handle.type='button';handle.className='panel-sheet-handle';
  handle.innerHTML='<strong id="v60PanelTitle">Ferramentas</strong><span id="v60PanelHint">Toque para abrir</span>';
  handle.setAttribute('aria-expanded','false');panel.insertBefore(handle,panel.firstChild);
  handle.addEventListener('click',()=>window.v60SetPanel(!panel.classList.contains('v60-open'),'tools'));
 }
 function mobile(){return window.matchMedia('(max-width:799px)').matches}
 window.v60SetPanel=function(open,mode){
  if(!mobile())return;
  panel.classList.toggle('v60-open',!!open);
  if(open)revealForMode(mode||'tools');
  else panel.querySelectorAll(':scope > .panel-section').forEach(section=>{section.hidden=true;section.style.setProperty('display','none','important');});
  const h=panel.querySelector('.panel-sheet-handle');
  if(h)h.setAttribute('aria-expanded',String(!!open));
  const title=document.getElementById('v60PanelTitle'),hint=document.getElementById('v60PanelHint');
  if(title)title.textContent=mode==='text'?'Editar texto':mode==='photo'?'Editar foto':mode==='shape'?'Editar formas':mode==='layers'?'Camadas':'Ferramentas';
  if(hint)hint.textContent=open?'Toque para recolher':'Toque para abrir';
 };
 const openForButton=button=>{
  const label=(button.innerText||'').toLowerCase();
  if(label.includes('text')||label.includes('texto'))window.v60SetPanel(true,'text');
  else if(label.includes('photo')||label.includes('foto'))window.v60SetPanel(true,'photo');
  else if(label.includes('shape')||label.includes('forma')||label.includes('style')||label.includes('estilo'))window.v60SetPanel(true,'shape');
  else window.v60SetPanel(true,'tools');
 };
 document.addEventListener('click',e=>{
  if(!mobile())return;
  const b=e.target.closest('#create .creation-dock button');
  if(b)openForButton(b);
 },true);
 document.addEventListener('focusin',e=>{
  if(!mobile())return;
  if(e.target&&e.target.id==='textValue'){
   window.v60SetPanel(true,'text');
  }
 });
 document.addEventListener('focusout',e=>{
  if(e.target&&e.target.id==='textValue')setTimeout(()=>{
   if(!document.activeElement||document.activeElement.id!=='textValue'){
    if(!(window.visualViewport&&window.visualViewport.height<window.innerHeight*.8)){
      document.body.classList.remove('keyboard-open');
      if(mobile())window.v60SetPanel(true,'text');
    }
   }
  },140);
 });
 document.addEventListener('click',e=>{
  if(!mobile())return;
  const row=e.target.closest('.layer-row');
  if(row){window.v60SetPanel(true,'layers');return}
  const layer=e.target.closest('.layer');
  if(layer){
   const item=layers.find(l=>l.id===layer.dataset.id);
   window.v60SetPanel(true,item?.type==='image'?'photo':item?.type==='shape'?'shape':'text');
  }
 },true);
 const resizeObserver=new ResizeObserver(()=>{if(!mobile()||!document.body.classList.contains('keyboard-open'))return;});
 window.addEventListener('resize',()=>{if(!mobile()){panel.classList.remove('v60-open');document.body.classList.remove('keyboard-open');sectionIds.forEach(id=>{const el=document.getElementById(id);if(el)el.hidden=false})}});
 if(mobile()){
  panel.classList.remove('v60-open');
  window.v60SetPanel(false,'tools');
 }
})();


/* V61: keep every layer aligned with the logical 9:16 canvas when mobile preview scales. */
(function(){
  const stage=document.getElementById('stage');
  if(!stage || typeof window.renderEditor!=='function' || typeof ResizeObserver==='undefined')return;
  let lastWidth=stage.getBoundingClientRect().width;
  let frame=0;
  const observer=new ResizeObserver(entries=>{
    const nextWidth=entries[0]?.contentRect?.width ?? stage.getBoundingClientRect().width;
    if(Math.abs(nextWidth-lastWidth)<0.5)return;
    lastWidth=nextWidth;
    if(frame)cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{
      frame=0;
      if(document.documentElement.contains(stage))window.renderEditor();
    });
  });
  observer.observe(stage);
  window.addEventListener('orientationchange',()=>{
    requestAnimationFrame(()=>{
      lastWidth=stage.getBoundingClientRect().width;
      window.renderEditor();
    });
  });
})();



(function(){
 const field=document.getElementById('textEntryField'),input=document.getElementById('textValue');
 if(!field||!input)return;
 if(!document.getElementById('finishTextEditing')){
  const done=document.createElement('button');done.type='button';done.id='finishTextEditing';done.className='text-edit-done';done.textContent='Concluir edição';
  done.addEventListener('click',()=>{input.blur();document.body.classList.remove('keyboard-open');if(window.v60SetPanel)window.v60SetPanel(true,'text');});
  field.appendChild(done);
 }
 const sync=()=>{
  const vv=window.visualViewport;
  const open=document.activeElement===input&&!!vv&&(vv.height<window.innerHeight*.82||window.innerHeight-vv.height>120);
  document.body.classList.toggle('keyboard-open',open);
 };
 input.addEventListener('focus',()=>{if(window.v60SetPanel)window.v60SetPanel(true,'text');sync();setTimeout(sync,100)});
 input.addEventListener('blur',()=>setTimeout(()=>{document.body.classList.remove('keyboard-open');if(window.v60SetPanel)window.v60SetPanel(true,'text');},160));
 if(window.visualViewport){window.visualViewport.addEventListener('resize',sync);window.visualViewport.addEventListener('scroll',sync)}
 window.addEventListener('resize',sync);
})();



(function(){
 const body=document.body,stage=document.getElementById('stage'),input=document.getElementById('textValue');
 if(!stage||!input)return;
 function sync(){
  const selected=typeof window.selected==='function'?window.selected():null;
  const isCurve=!!(selected&&selected.type==='text'&&selected.curve);
  body.classList.toggle('v62-curve-editing',isCurve);
 }
 const observer=new MutationObserver(sync);observer.observe(stage,{childList:true,subtree:true,attributes:true});
 document.addEventListener('input',e=>{if(e.target===input)sync()});
 document.addEventListener('click',e=>{if(e.target.closest('#curveToggle,#curveArcMode,#curveCircleMode,#curveControls input,#curveControls button'))setTimeout(sync,0)},true);
 window.addEventListener('resize',sync);
 sync();
})();



(function(){
 const body=document.body,stage=document.getElementById('stage'),panel=document.querySelector('#create .panel');
 if(!stage||!panel)return;
 function isCurve(){
  const l=typeof selected==='function'?selected():null;
  return !!(l&&l.type==='text'&&l.curve);
 }
 function sync(){
  const active=isCurve();
  body.classList.toggle('v62-curve-editing',active);
  if(!active){const curve=document.getElementById('curveControls');if(curve){curve.hidden=false;curve.style.display='none'}const presets=document.getElementById('presetControls');if(presets){presets.hidden=false;presets.style.removeProperty('display')}return;}
  const text=document.getElementById('textControls');
  const effects=document.getElementById('textEffectsControls');
  const presets=document.getElementById('presetControls');
  [text,effects].forEach(el=>{if(el){el.hidden=false;el.style.removeProperty('display')}});
  if(presets){presets.hidden=true;presets.style.setProperty('display','none','important')}
  const curve=document.getElementById('curveControls');
  if(curve){curve.hidden=false;curve.style.display='block'}
  requestAnimationFrame(()=>{
   const target=document.getElementById('curveControls');
   if(target){
    const r=target.getBoundingClientRect();
    const p=panel.getBoundingClientRect();
    const nextTop=r.top-p.top+panel.scrollTop-8;
    panel.scrollTop=Math.max(0,nextTop);
   }
  });
 }
 document.addEventListener('click',e=>{
  if(e.target.closest('#curveToggle,#curveArcMode,#curveCircleMode,#curveClockwise,#curveCounterclockwise,.layer,.layer-row'))setTimeout(sync,50);
 },true);
 document.addEventListener('input',e=>{if(e.target.closest('#curveControls'))sync()});
 window.addEventListener('storystudio:curvechange',sync);
 const observer=new MutationObserver(sync);observer.observe(stage,{subtree:true,childList:true,attributes:true});
 window.addEventListener('resize',sync);
 sync();
})();



(function(){
 const panel=document.querySelector('#create .panel');
 const stage=document.getElementById('stage');
 const dock=document.querySelector('#create .creation-dock');
 if(!panel||!stage||!dock)return;
 const quick=panel.querySelector(':scope > .panel-section');
 const selection=document.getElementById('selectionPanelSection');
 const layersSection=document.getElementById('layersPanelSection');
 const text=document.getElementById('textControls');
 const effects=document.getElementById('textEffectsControls');
 const presets=document.getElementById('presetControls');
 const photo=document.getElementById('imageControls');
 const shape=document.getElementById('shapeControls');
 const menu=document.getElementById('shapeOptionsMenu');
 const panelHead=document.createElement('div');
 panelHead.className='v63-panel-head';
 panelHead.innerHTML='<strong id="v63PanelTitle">Editar elemento</strong><button type="button" class="v63-panel-close" id="v63PanelClose">Concluir</button>';
 panel.insertBefore(panelHead,panel.firstChild);
 panel.querySelector('.panel-sheet-handle')?.remove();
 if(menu)dock.appendChild(menu);
 if(quick)quick.hidden=true;
 if(presets)presets.hidden=true;
 function mobile(){return matchMedia('(max-width:799px)').matches}
 function sync(){
  const selectedLayer=typeof selected==='function'?selected():null;
  const count=Array.isArray(layers)?layers.length:0;
  const kind=selectedLayer?.type||'';
  const hasSelection=!!selectedLayer;
  document.body.classList.toggle('v63-empty',count===0);
  document.body.classList.toggle('v63-context-text',kind==='text');
  document.body.classList.toggle('v63-context-shape',kind==='shape');
  document.body.classList.toggle('v63-context-photo',kind==='image');
  const showLayers=count>0;
   const requestedMode=window.__v63RequestedPanelMode||'';
   const creationMode=mobile()&&count===0&&['text','photo','shape'].includes(requestedMode);
   const showPanel=hasSelection||showLayers||creationMode;
   panel.classList.toggle('v63-visible',showPanel);
   panel.classList.toggle('v63-create-mode',!hasSelection&&count===0&&showPanel);
   panel.classList.toggle('v60-open',showPanel);
   panel.style.display=showPanel?'block':'none';
  panelHead.hidden=!showPanel;
  const title=document.getElementById('v63PanelTitle');
  if(title)title.textContent=kind==='text'?'Editar texto':kind==='shape'?'Editar forma':kind==='image'?'Editar foto':'Camadas';
  if(quick)quick.hidden=true;
   const setSection=(section,visible)=>{if(!section)return;section.hidden=!visible;if(visible)section.style.removeProperty('display')};
   setSection(text,kind==='text'||(creationMode&&requestedMode==='text'));
   setSection(effects,kind==='text'||(creationMode&&requestedMode==='text'));
  if(presets)presets.hidden=true;
   setSection(photo,kind==='image'||(creationMode&&requestedMode==='photo'));
  setSection(selection,hasSelection);
   setSection(shape,kind==='shape'||(creationMode&&requestedMode==='shape'));
  setSection(layersSection,count>0);
  const exportBtn=document.getElementById('exportStoryBtn');
  if(exportBtn)exportBtn.disabled=count===0;
  const close=document.getElementById('v63PanelClose');
  if(close)close.textContent=hasSelection?'Concluir':'Fechar';
   if(close)close.hidden=!showPanel;
  const hint=document.querySelector('#create .v62-empty-canvas-note');
  if(count===0&&!hint){
   const note=document.createElement('div');note.className='v62-empty-canvas-note';note.textContent='Seu Story começa aqui';stage.appendChild(note);
  }else if(count>0&&hint)hint.remove();
   if(!hasSelection&&count===0&&!requestedMode)panel.classList.remove('v60-open');
 }
  window.v60SetPanel=function(open,mode){window.__v63RequestedPanelMode=open?(mode||'tools'):'';sync();};
 window.v63SyncEditor=sync;
 const originalRender=window.renderEditor;
 if(typeof originalRender==='function'){
  window.renderEditor=function(){const result=originalRender.apply(this,arguments);sync();return result};
 }
 const originalAddShape=window.addShape;
 if(typeof originalAddShape==='function'){
  window.addShape=function(){const result=originalAddShape.apply(this,arguments);sync();return result};
 }
 document.getElementById('v63PanelClose').addEventListener('click',()=>{
  if(typeof selectedId!=='undefined')selectedId=null;
  if(typeof renderEditor==='function')renderEditor();
  sync();
 });
 function openShapes(){
  if(!menu)return;
  menu.hidden=!menu.hidden;
  const open=!menu.hidden;
  document.getElementById('addShapeMenuToggle')?.setAttribute('aria-expanded',String(open));
  if(open)menu.querySelector('.shape-btn')?.focus({preventScroll:true});
 }
 window.toggleShapeMenu=openShapes;
 window.closeShapeMenu=function(){
  if(menu)menu.hidden=true;
  document.getElementById('addShapeMenuToggle')?.setAttribute('aria-expanded','false');
 };
 document.addEventListener('click',e=>{
  if(menu&&!menu.hidden&&!e.target.closest('#shapeOptionsMenu,#addShapeMenuToggle'))window.closeShapeMenu();
 });
 const originalDelete=window.deleteLayer;
 if(typeof originalDelete==='function')window.deleteLayer=function(id){const r=originalDelete(id);sync();return r};
 if(typeof renderEditor==='function')renderEditor();else sync();
})();



(function(){
 const section=document.getElementById('layersPanelSection');
 const list=document.getElementById('layers');
 if(!section||!list)return;
 const label=l=>l.type==='text'?(l.text||'Texto').trim().slice(0,32)||'Texto':l.type==='shape'?(l.name||'Forma'):(l.name||'Foto');
 window.renderLayers=function(){
  const items=typeof layers!=='undefined'&&Array.isArray(layers)?layers:[];
  const selectedIdNow=typeof selectedId!=='undefined'?selectedId:null;
  const tools=section.querySelector('.layer-tools');
  const hasSelection=items.some(l=>l.id===selectedIdNow);
  if(tools){tools.hidden=!hasSelection;tools.setAttribute('aria-hidden',String(!hasSelection))}
  if(!items.length){list.innerHTML='<div class="status">Nenhuma camada ainda. Adicione texto, foto ou forma para começar.</div>';return}
  list.innerHTML=items.slice().reverse().map((l,displayIndex)=>{
   const index=items.findIndex(x=>x.id===l.id);
   const isFront=index===items.length-1;
   const isBack=index===0;
   const thumb=l.type==='image'&&l.src?'<img src="'+l.src+'" alt="">':l.type==='shape'?'◆':'T';
   const type=l.type==='text'?'Texto':l.type==='shape'?'Forma':'Foto';
   const title=label(l);
   return '<div class="layer-row '+(l.id===selectedIdNow?'active':'')+'" data-layer-id="'+l.id+'">'+
    '<button type="button" class="layer-thumb" data-layer-select="'+l.id+'" aria-label="Selecionar '+type+': '+title+'">'+thumb+'</button>'+
    '<button type="button" class="layer-name" data-layer-select="'+l.id+'" title="Selecionar camada">'+type+' · '+title+'</button>'+
    '<div class="v64-layer-actions">'+
     '<button type="button" class="v64-layer-move" data-layer-move="'+l.id+'" data-direction="1" aria-label="Trazer '+title+' para frente" title="Trazer para frente" '+(isFront?'disabled':'')+'>↑</button>'+
     '<button type="button" class="v64-layer-move" data-layer-move="'+l.id+'" data-direction="-1" aria-label="Enviar '+title+' para trás" title="Enviar para trás" '+(isBack?'disabled':'')+'>↓</button>'+
    '</div>'+
    '<div class="v64-layer-position">'+(isFront?'Na frente':isBack?'No fundo':'Camada '+(items.length-index)+' de '+items.length)+'</div>'+
   '</div>';
  }).join('');
 };
 list.addEventListener('click',e=>{
  const move=e.target.closest('[data-layer-move]');
  if(move){
   e.preventDefault();e.stopPropagation();
   if(move.disabled)return;
   const id=move.getAttribute('data-layer-move');
   const dir=Number(move.getAttribute('data-direction'));
   if(typeof window.moveLayer==='function')window.moveLayer(id,dir);
   return;
  }
  const select=e.target.closest('[data-layer-select]');
  if(select){
   e.preventDefault();e.stopPropagation();
   if(typeof window.selectLayer==='function')window.selectLayer(select.getAttribute('data-layer-select'));
  }
 });
 const originalRender=window.renderEditor;
 if(typeof originalRender==='function'){
  window.renderEditor=function(){
   const result=originalRender.apply(this,arguments);
   window.renderLayers();
   if(typeof window.v63SyncEditor==='function')window.v63SyncEditor();
   return result;
  };
 }
 window.renderLayers();
 if(typeof window.v63SyncEditor==='function')window.v63SyncEditor();
})();



(function(){
 const stage=document.getElementById('stage');
 const wrap=stage?.parentElement;
 if(!stage||!wrap)return;
 const CANVAS_W=500,CANVAS_H=500*16/9;
 let resizeFrame=0;
 function resizePreview(){
  cancelAnimationFrame(resizeFrame);
  resizeFrame=requestAnimationFrame(()=>{
   const width=stage.clientWidth,height=stage.clientHeight;
   if(!width||!height)return;
   const sx=width/CANVAS_W,sy=height/CANVAS_H;
   stage.querySelectorAll('.layer').forEach(el=>{
    const l=typeof layers!=='undefined'?layers.find(x=>x.id===el.dataset.id):null;
    if(!l)return;
    el.style.left=(l.x*sx)+'px';
    el.style.top=(l.y*sy)+'px';
    el.style.transform='translate(-50%,-50%) rotate('+l.rotation+'deg) scale('+l.scale+')';
    if(l.type==='text'&&!l.curve){
     el.style.fontSize=(l.fontSize*sx)+'px';
     el.style.width=((l.textWidth||300)*sx)+'px';
     el.style.maxWidth='none';
    }else if(l.type==='text'&&l.curve){
     el.style.width=((l.curveMode==='circle'?(Math.max(70,Number(l.curveRadius)||130)*2+24):Math.max(220,Math.abs(l.curve)*5+220))*sx)+'px';
     el.style.height=((l.curveMode==='circle'?(Math.max(70,Number(l.curveRadius)||130)*2+24):Math.max(120,Math.abs(l.curve)*2+120))*sx)+'px';
    }else if(l.type==='shape'||l.type==='image'){
     el.style.width=((l.w||150)*sx)+'px';
     el.style.height=((l.h||150)*sx)+'px';
     if(l.type==='image'){
      const img=el.querySelector('.layer-media');
      if(img){img.style.width=((l.w||150)*sx)+'px';img.style.height=((l.h||150)*sx)+'px'}
     }
    }
   });
  });
 }
 if(typeof ResizeObserver!=='undefined'){
  const observer=new ResizeObserver(resizePreview);
  observer.observe(stage);
 }
 window.addEventListener('resize',resizePreview,{passive:true});
 const originalRender=window.renderEditor;
 if(typeof originalRender==='function'){
  window.renderEditor=function(){
   const r=originalRender.apply(this,arguments);
   resizePreview();
   return r;
  };
 }
 window.v65ResizePreview=resizePreview;
 resizePreview();
})();



(function(){
 const stage=document.getElementById('stage');
 if(!stage)return;
 const CANVAS_W=500,CANVAS_H=500*16/9;
 const byId=id=>document.getElementById(id);
 function scalePreview(){
  const r=stage.getBoundingClientRect();
  if(r.width<20||r.height<20)return;
  const sx=r.width/CANVAS_W,sy=r.height/CANVAS_H;
  const textScale=sx;
  const shapeScale=Math.min(sx,sy);
  stage.querySelectorAll('.layer').forEach(el=>{
   const l=typeof layers!=='undefined'?layers.find(x=>x.id===el.dataset.id):null;
   if(!l)return;
   el.style.left=(l.x*sx)+'px';
   el.style.top=(l.y*sy)+'px';
   if(l.type==='text'){
    el.style.fontSize=(l.fontSize*textScale)+'px';
    el.style.width=((l.textWidth||300)*textScale)+'px';
    el.style.maxWidth='none';
    if(l.curve){
     const d=l.curveMode==='circle'?(Math.max(70,Number(l.curveRadius)||130)*2+24):Math.max(220,Math.abs(l.curve)*5+220);
     const h=l.curveMode==='circle'?d:Math.max(120,Math.abs(l.curve)*2+120);
     el.style.width=(d*textScale)+'px';el.style.height=(h*textScale)+'px';
     const svg=el.querySelector('svg');if(svg){svg.style.width='100%';svg.style.height='100%'}
    }
   }else{
    const u=shapeScale;
    el.style.width=((l.w||150)*u)+'px';el.style.height=((l.h||150)*u)+'px';
    const img=el.querySelector('.layer-media');
    if(img){img.style.width=((l.w||150)*u)+'px';img.style.height=((l.h||150)*u)+'px'}
   }
  });
 }
 const oldRender=window.renderEditor;
 if(typeof oldRender==='function'&&!oldRender.__v66){
  const wrapped=function(){const v=oldRender.apply(this,arguments);requestAnimationFrame(scalePreview);return v};
  wrapped.__v66=true;window.renderEditor=wrapped;
 }
 const oldVisual=window.updateLayerVisual;
 if(typeof oldVisual==='function'&&!oldVisual.__v66){
  const wrapped=function(){const v=oldVisual.apply(this,arguments);requestAnimationFrame(scalePreview);return v};
  wrapped.__v66=true;window.updateLayerVisual=wrapped;
 }
 if(typeof ResizeObserver!=='undefined'){const ro=new ResizeObserver(scalePreview);ro.observe(stage)}
 window.addEventListener('resize',scalePreview,{passive:true});
 window.v66ScalePreview=scalePreview;
 requestAnimationFrame(scalePreview);

 // Keep the PNG copy action beside export and in sync with canvas availability.
 const syncExport=()=>{
  const enabled=typeof layers!=='undefined'&&layers.length>0;
  const copy=byId('copyStoryBtn'),exp=byId('exportStoryBtn');
  if(copy)copy.disabled=!enabled;
  if(exp)exp.disabled=!enabled;
 };
 const originalRender2=window.renderEditor;
 if(typeof originalRender2==='function'&&!originalRender2.__v66copy){
  const wrapped=function(){const v=originalRender2.apply(this,arguments);syncExport();return v};
  wrapped.__v66copy=true;window.renderEditor=wrapped;
 }
 syncExport();

 // Restore background removal within the contextual photo tools.
 const remove=byId('removeBgBtn'),photo=byId('imageControls .v66-photo-actions');
 if(remove&&photo){remove.textContent='Remover background';remove.classList.add('tool','primary');remove.disabled=false;photo.appendChild(remove)}
 const done=byId('finishTextEditing'),input=byId('textValue');
 if(done&&input){
  done.addEventListener('click',()=>{done.classList.add('v66-finished');setTimeout(()=>done.classList.add('v66-finished'),0)});
  input.addEventListener('focus',()=>done.classList.remove('v66-finished'));
 }
})();



(function(){
 const field=document.getElementById('textEntryField');
 const input=document.getElementById('textValue');
 const dock=document.querySelector('#create .editor-actions');
 if(!field||!input||!dock)return;

 // Keep the completion action only during active text editing, and keep the canvas visible.
 let done=document.getElementById('finishTextEditing');
 if(!done){
  done=document.createElement('button');
  done.type='button';done.id='finishTextEditing';done.className='text-edit-done';
  done.textContent='Concluir edição';
  field.appendChild(done);
 }
 const finish=()=>{
  input.blur();
  document.body.classList.remove('keyboard-open');
  done.hidden=true;
  if(window.v60SetPanel)window.v60SetPanel(true,'text');
  if(window.v63SyncEditor)window.v63SyncEditor();
  window.setTimeout(()=>window.v65ResizePreview?.(),80);
 };
 done.onclick=finish;
 const begin=()=>{
  done.hidden=false;
  document.body.classList.add('v67-text-editing');
  window.v60SetPanel?.(true,'text');
  window.setTimeout(()=>window.v65ResizePreview?.(),80);
 };
 input.addEventListener('focus',begin);
 input.addEventListener('blur',()=>window.setTimeout(()=>{
  document.body.classList.remove('keyboard-open');
 },180));

 // Keep the single copy action defined in the HTML; do not inject a duplicate.
 const sync=()=>{
  const has=typeof layers!=='undefined'&&layers.length>0;
  const exp=document.getElementById('exportStoryBtn');
  const copy=document.getElementById('copyStoryBtn');
  if(exp)exp.disabled=!has;
  if(copy)copy.disabled=!has;
  const text=typeof selected==='function'?selected():null;
  if(text&&text.type==='text'&&document.activeElement===input)done.hidden=false;
  if(!text||text.type!=='text')done.hidden=true;
 };
 const oldRender=window.renderEditor;
 if(typeof oldRender==='function')window.renderEditor=function(){
  const r=oldRender.apply(this,arguments);sync();return r;
 };
 sync();

 // Bring back background removal in the photo's contextual toolset.
 const image=document.getElementById('imageControls');
 const quick=document.getElementById('removeBgBtn')?.closest('.tool-grid');
 if(image&&quick&&!document.getElementById('v67PhotoBgTools')){
  const row=document.createElement('div');row.id='v67PhotoBgTools';row.className='tool-grid';
  const remove=document.createElement('button');
  remove.type='button';remove.className='tool';remove.textContent='Remover fundo';
  remove.onclick=()=>window.removeBackground?.();
  row.appendChild(remove);
  image.insertBefore(row,image.firstChild.nextSibling);
 }
})();
