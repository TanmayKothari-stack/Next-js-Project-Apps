// db.js
import Dexie from "dexie";

export const db = new Dexie("MyDatabase");

db.version(1).stores({
  posts: "id,title,body" // unique key: id
});
