// Compatibility exports for integrations created during the 3.8 preview.
export {createOriginalRift as createOriginalRiftPreview,countRiftKeys,riftGateOpen,RIFT_CORE_REQUIREMENT,
 RIFT_WORLD_WIDTH as RIFT_PREVIEW_WIDTH} from "./originalRift.js";
import {createOriginalRiftLayout} from "../levels/originalRift.js";
export function previewPlatforms(){return createOriginalRiftLayout().platforms;}
export function portalDestination(id){return createOriginalRiftLayout().portals.find(p=>p.id===id)?.target||null;}
