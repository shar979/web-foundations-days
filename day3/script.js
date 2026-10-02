
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

function searchNotes(word){
    const searchTerm = word.toLowerCase();
  return notes.filter((note) => note.text.toLowerCase().includes(searchTerm));
}

function longestNote(){
    if(notes.length ===0){
        return null;
    }
   let longest = notes[0];
  for (let i = 1; i < notes.length; i++) {
    if (notes[i].text.length > longest.text.length) {
      longest = notes[i];
    } 
}
return longest;
}
function countByCategory() {
  const counts = {};
  for (const note of notes) {
    const cat = note.category;
    if (counts[cat]) {
      counts[cat]++;
    } else {
      counts[cat] = 1;
    }
  }
  return counts;
}
function getSummary() {
  const total = notes.length;
  const counts = countByCategory();

  const noun = total === 1 ? "note" : "notes";
  const categoryDetails = Object.entries(counts)
    .map(([cat, count]) => `${count} ${cat}`)
    .join(", ");

  return `${total} ${noun}: ${categoryDetails}.`;
}
function isDuplicate(text) {
  const formattedText = text.trim().toLowerCase();
  return notes.some((note) => note.text.trim().toLowerCase() === formattedText);
}
function addNote(text, category) {
  const trimmedText = text ? text.trim() : "";
  const validCategories = ["personal", "work", "study"];
  if (trimmedText.length < 1 || trimmedText.length > 200) {
    console.log("Failed to add note: Text must be between 1 and 200 characters.");
    return false;
  }
  if (!validCategories.includes(category)) {
    console.log(`Failed to add note: Invalid category "${category}". Must be personal, work, or study.`);
    return false;
  }
  if (isDuplicate(trimmedText)) {
    console.log("Failed to add note: Note already exists.");
    return false;
  }
  const newNote = {
    id: notes.length > 0 ? Math.max(...notes.map((n) => n.id)) + 1 : 1,
    text: trimmedText,
    category: category,
  };

  notes.push(newNote);
  return true;
}
console.log("--- 1. searchNotes ---");
console.log(searchNotes("javascript")); 
// Expected: [{ id: 4, text: "Revise JavaScript arrays", category: "study" }]
console.log(searchNotes("python")); 
// Expected: []

console.log("\n--- 2. longestNote ---");
console.log(longestNote()); 
// Expected: { id: 3, text: "Email the project report to Grace", category: "work" }
const tempNotes = notes;
notes = [];
console.log(longestNote()); 
// Expected: null
notes = tempNotes; // restore notes

console.log("\n--- 3. countByCategory ---");
console.log(countByCategory()); 
// Expected: { personal: 2, study: 2, work: 1 }

console.log("\n--- 4. getSummary ---");
console.log(getSummary()); 
// Expected: "5 notes: personal 2, study 2, work 1." (or formatted category counts)
const singleNoteTemp = notes;
notes = [{ id: 1, text: "Buy milk", category: "personal" }];
console.log(getSummary()); 
// Expected: "1 note: 1 personal."
notes = singleNoteTemp; // restore notes

console.log("\n--- 5. isDuplicate ---");
console.log(isDuplicate("  buy milk and bread  ")); 
// Expected: true
console.log(isDuplicate("Buy milk and eggs")); 
// Expected: false

console.log("\n--- 6. addNote ---");
console.log(addNote("Schedule team sync", "work")); 
// Expected: true (Logs no error)
console.log(notes[notes.length - 1]); 
// Expected: { id: 6, text: "Schedule team sync", category: "work" }

console.log(addNote("Schedule team sync", "work")); 
// Expected: false (Logs: "Failed to add note: Note already exists.")
console.log(addNote("", "personal")); 
// Expected: false (Logs: "Failed to add note: Text must be between 1 and 200 characters.")
console.log(addNote("Valid note text", "hobbies"));