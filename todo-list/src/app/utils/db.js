import { useState } from "react";
import Dexie from "dexie";

export const db = new Dexie("TodoDatabase");

// Define your tables & indexes
db.version(1).stores({
  todo_list: "++id, name, date, time, day" // auto-increment id
});

export async function addItem(data) {
  const now = new Date();
  const dateTimeDetails = {
    date: now.toLocaleDateString("en-IN"),
    time: now.toLocaleTimeString("en-IN"),
    day: now.toLocaleDateString("en-IN", { weekday: "long" }),
  }
  return await db.todo_list.add({ ...data, ...dateTimeDetails });
}

export async function getItems() {
  return await db.todo_list.toArray();
}

export async function deleteItem(id) {
  return await db.todo_list.delete(id);
}

export async function updateItem(data) {
  // console.log(data.id, data.name);
  return await db.todo_list.update(data.id, { name: data.name });
}