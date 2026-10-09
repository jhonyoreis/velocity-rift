export function gradeForTime(time,stage) {
  // Extended city gauntlet adds traversal time.
  if (stage===3) return time<110?"S":time<155?"A":time<205?"B":"C";
  if (stage===2) return time<105?"S":time<145?"A":time<195?"B":"C";
  return time<75?"S":time<100?"A":time<145?"B":"C";
}
