"use client";

import React, { useState, useEffect, useRef } from 'react'
import { FaEdit, FaMoon, FaSun, FaTrash } from 'react-icons/fa';
import { addItem, getItems, deleteItem, updateItem } from '@/src/app/utils/';
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { useTheme } from "next-themes";

function page() {

  // const todos = ["Learn Next.js", "Build a project", "Deploy app"];
  const { theme, setTheme } = useTheme();
  const [todos, setTodos] = useState([]);
  const [todo, setTodo] = useState("");
  const [updateTodo, setUpdateTodo] = useState({ id: null, name: null });
  const setTodo_text = useRef(null);

  const getTodo = async () => {
    const data = await getItems();
    setTodos(data);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      getTodo();
    }, 1000);

    // cleanup when component unmounts
    return () => clearInterval(interval);
  }, [])

  const addTodo = async () => {
    if (todo.trim() != "") {
      addItem({ name: todo });
      toast.success(`Todo added sucessfully ${todo.trim()} `);
      setTodo_text.current.value = "";
      setTodo("");
      setUpdateTodo({ id: null, name: null });
    }
    else {
      toast("Please enter a todo!", {
        icon: "⚠️",
        style: {
          border: "1px solid #facc15",
          padding: "12px",
          background: "#fef9c3",
          color: "#78350f",
        },
      });
    }
  }

  const deleteTodo = async (id) => {
    const result = await Swal.fire({
      title: "Delete Todo?",
      text: "Are you sure you want to delete this todo?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      await deleteItem(id);
      toast.success("Todo deleted successfully");
    }
  }

  const editTodo = async () => {
    if (updateTodo.name !== null && updateTodo.name.trim() != "") {
      updateTodo.name.trim() != "" && await updateItem({ id: updateTodo.id, name: updateTodo.name });
      toast.success(`Todo updated sucessfully ${updateTodo.name.trim()} `);
      setUpdateTodo({ id: null, name: null });
      setTodo_text.current.value = "";
    }
    else {
      toast("Please enter a new todo for change!", {
        icon: "⚠️",
        style: {
          border: "1px solid #facc15",
          padding: "12px",
          background: "#fef9c3",
          color: "#78350f",
        },
      });
    }
  }

  return (
    <>
      <div className='border-0 flex flex-col items-center text-center p-2'>
        <div className='border-0 border-red-500 w-full fixed top-0 z-10 bg-white dark:bg-black'>
          <p className='text-xl font-bold pt-2 '>Todo List App</p>
          <p className='absolute top-3 right-3' onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            {
              theme === "light" ?
                <FaMoon size={18} />
                :
                <FaSun size={18} />
            }
          </p>
          <div className='border-0 w-full flex justify-around p-1 pr-2'>
            <input
              type="text"
              className="w-full m-2 border border-blue-300 rounded-md p-2
             outline-none focus:outline-none
             focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your todo" ref={setTodo_text} onChange={(e) => { updateTodo.id === null ? setTodo(e.target.value) : setUpdateTodo(prev => ({ ...prev, name: e.target.value })) }}
            />

            <button className='bg-blue-300 text-white p-2 cursor-pointer shadow-md w-[100px] h-10 rounded-md mt-2' onClick={() => { updateTodo.id === null ? addTodo() : editTodo() }}>{updateTodo.id === null ? "Add" : "Update"}</button>
          </div>
        </div>

        <span className='mt-[27%] sm:mt-[13%] md:mt-[10%] xl:mt-[7%] '></span>

        {
          todos.length > 0 ?
            todos.map((todo, idx) => (
              <div key={idx} className='border-0 w-full m-2 p-3 flex items-center justify-between rounded-md shadow-md'>
                <div className='border-0 w-full p-2 gap-5 flex items-center justify-between'>
                  <div className='border-0 text-sm text-gray-400 flex flex-col items-center gap-2 '>
                    <p>{todo.date}</p>
                    <p>{todo.time}</p>
                    <p>{todo.day}</p>
                  </div>
                  <p className='text-center'>{todo.name}</p>
                  <span></span>
                </div>
                <p className='border-0 flex p-2 gap-2'>
                  <FaEdit size={18} className='cursor-pointer text-green-500' onClick={() => {
                    setUpdateTodo(prev => ({ ...prev, id: todo.id })); setTodo_text.current.value = todo.name;
                  }
                  } />
                  <FaTrash size={18} className='cursor-pointer text-red-500' onClick={() => deleteTodo(todo.id)} />
                </p>
              </div>
            ))
            :
            (
              <div className="flex fixed items-center justify-center h-screen">
                <p className="text-xl">No todos found</p>
              </div>
            )
        }

      </div >
    </>
  )
}

export default page