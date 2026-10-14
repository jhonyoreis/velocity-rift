// One pointer may accumulate buttons while it stays on screen.
// Another pointer can share a button without releasing the first one's input.
export function createTouchDragState({onPress,onRelease}){
 const pointers=new Map(),owners=new Map();
 function activate(pointerId,key){
  const held=pointers.get(pointerId);
  if(!held||held.has(key))return;
  held.add(key);
  let users=owners.get(key);
  if(!users){users=new Set();owners.set(key,users);}
  if(users.size===0)onPress(key);
  users.add(pointerId);
 }
 function end(pointerId){
  const held=pointers.get(pointerId);
  if(!held)return;
  pointers.delete(pointerId);
  for(const key of held){
   const users=owners.get(key);
   users?.delete(pointerId);
   if(users?.size===0){owners.delete(key);onRelease(key);}
  }
 }
 return {
  start(pointerId,key){if(pointers.has(pointerId))end(pointerId);pointers.set(pointerId,new Set());activate(pointerId,key);},
  enter:activate,
  end,
  has:pointerId=>pointers.has(pointerId),
  reset(){for(const pointerId of [...pointers.keys()])end(pointerId);}
 };
}

// Pointer capture keeps move/up events flowing to the original button, while
// elementFromPoint identifies new buttons beneath the dragged finger.
export function bindTouchDragControls(container,{onPress,onRelease,unlockAudio=()=>{}}){
 const state=createTouchDragState({onPress,onRelease});
 for(const button of container.querySelectorAll('[data-key]')){
  button.addEventListener('pointerdown',event=>{
   event.preventDefault();
   unlockAudio();
   state.start(event.pointerId,button.dataset.key);
   try{button.setPointerCapture(event.pointerId)}catch(_){}
  });
  button.addEventListener('pointermove',event=>{
   if(!state.has(event.pointerId))return;
   event.preventDefault();
   const hovered=document.elementFromPoint(event.clientX,event.clientY)?.closest?.('[data-key]');
   if(hovered&&container.contains(hovered))state.enter(event.pointerId,hovered.dataset.key);
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture'])
   button.addEventListener(type,event=>{event.preventDefault();state.end(event.pointerId);});
 }
 window.addEventListener('blur',()=>state.reset());
 document.addEventListener('visibilitychange',()=>{if(document.hidden)state.reset();});
 return state;
}
