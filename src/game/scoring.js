export function gradeForTime(time,stage) {
  if (stage===3) return time<90?"S":time<130?"A":time<175?"B":"C";
  if (stage===2) return time<105?"S":time<145?"A":time<195?"B":"C";
  return time<75?"S":time<100?"A":time<145?"B":"C";
}
