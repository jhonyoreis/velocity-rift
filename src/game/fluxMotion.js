// Flux's movement tuning is shared by every campaign stage.
export const FLUX_MOTION = Object.freeze({
 groundAcceleration:1280, slideAcceleration:390, airAcceleration:660,
 groundFriction:1050, slideFriction:180, normalSpeed:480,
 boostSpeed:590, boostAcceleration:850, boostDrain:34, slideCap:870,
 jumpSpeed:660, gravity:1850, jumpCut:1450, terminalSpeed:1250,
 dashSpeed:1140, dashSeconds:.255, dashExitSpeed:560
});

// Shared hit reaction for the campaign: a short backwards hop. Inverted
// gravity reverses only the vertical kick, not the horizontal recoil.
export const FLUX_HIT_RECOIL=Object.freeze({horizontal:250,vertical:450,invulnerability:1.1});
