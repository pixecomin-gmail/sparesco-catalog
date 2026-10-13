"use client";
import FullEdit from "./FullEdit";
import FullAdd from "./FullAdd";
import "./full-editor.css";
export default function Editor({handle}:{handle?:string}) {
  return handle ? <FullEdit handle={handle}/> : <FullAdd/>;
}
