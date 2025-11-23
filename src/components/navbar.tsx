"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "../components/WalletContext";
import Signup from "./signup";


export default function Navbar(){
    const router = useRouter();
const { address, connectWallet, disconnectWallet } = useWallet();
    
    
    return (
        <>
        <div className="flex justify-between items-center px-10 py-6">
        <ul className="flex gap-12 items-center">
          <li>
        <button className="hover:text-[#702eff] cursor-pointer text-2xl" onClick={()=> router.push("/dashboard")}>
           Dashboard
        </button>
        </li>
        <li>
        
        </li>
        <li>
          <Signup/>
        </li>
        <li>
        <button
  className="hover:text-[#702eff] cursor-pointer text-2xl"
  onClick={() => {
    disconnectWallet();  // clear wallet connection state
    router.push("/");    // navigate to home or login
  }}
>
  Logout
</button>

        </li>
        </ul>
        </div>
        </>
    )
};

export {Navbar};