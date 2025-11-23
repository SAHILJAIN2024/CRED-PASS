"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Signup from "./signup";

export default function Navbar() {
  const router = useRouter();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="flex justify-between items-center px-10 py-6">
      {/* Logo / Brand */}
      <h1 className="text-xl font-bold tracking-widest">CRED-PASS</h1>

      {/* Menu */}
      <ul className="flex gap-12 items-center">
        <li>
          
        </li>
        <li>
          <button className="hover:text-[#702eff] cursor-pointer text-2xl" onClick={()=> router.push("/profile")}>
           On-Chain Voting
        </button>
        </li>
       
      </ul>
    </nav>
  );
}
