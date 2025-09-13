const TEXT_LENGTH = 30;
const TITLE_LENGTH = 40;

// Generate valid and helpful file name for dowload
export function createFilename(title, text, audioId = null, createdDateISOString = null) {
  // Prepare data
  title = title?.trim();
  text = text?.trim();
  // Start with Audio ID if applicable
  const base = audioId ? audioId + '_' : '';
  let description;
  // Use title if available
  if (title && title.length > 0) {
    description = title.slice(0, TITLE_LENGTH);
  }
  // Otherwise use text (just the start)
  else {
    description = text.slice(0, TEXT_LENGTH);
  }
  // Build the name
  const timestamp = createTimestamp(createdDateISOString ?? new Date().toISOString());
  const fileName = `${base}${description}_${timestamp}`;
  // Remove special characters
  return slugifyFilename(fileName);
}

function slugifyFilename(input) {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFKD') // Normalize accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9_]+/g, '-') // Replace non-alphanumerics with hyphen
    .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
}

function createTimestamp(isoDateString) {
  let timestamp = isoDateString.slice(0, -5);
  const tsParts = timestamp.split('T');
  timestamp = tsParts[0].replace(/\D/g, '') + '-' + tsParts[1].replace(/\D/g, '');
  return timestamp;
}

// Testing
//const result = createFilename("super titulní textík", "letáček? velký, páneček.", 5)
//const result = createFilename(null, "letáček? velký, páneček.", null)
//const result = createFilename(null, "V tomto\ninspirativním rozhovoru se ponoříme do témat, která formují naše myšlení, vztahy i každodenní rozhodování.\nAutentická řeč, hluboké myšlenky a osobní zkušenosti vytvářejí prostor pro zamyšlení i dialog.", 5)
//const result = createFilename("Přednáška o vnitřních světech, kde slova odhalují skryté vrstvy myšlení a lidského prožívání.", "letáček? velký, páneček.", 500)
//console.log(result);
