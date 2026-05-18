import mammoth from "mammoth";
console.log("has extractRawText:", typeof mammoth.extractRawText);
import("mammoth").then(m => {
  console.log("dynamic has extractRawText:", typeof m.extractRawText);
  console.log("dynamic has default extractRawText:", typeof m.default?.extractRawText);
}).catch(e => console.error(e));
