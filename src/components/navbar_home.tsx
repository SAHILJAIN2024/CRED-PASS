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
          <button
            className="hover:text-[#00E0FF] cursor-pointer text-2xl"
            onClick={() => scrollToSection("about")}
          >
            About
          </button>
        </li>
        <li>
          <button
            className="hover:text-[#39FF14] cursor-pointer text-2xl"
            onClick={() => scrollToSection("features")}
          >
            Features
          </button>
        </li>
        <li>
          {/* Signup button aligns as menu item */}
          <Signup />
        </li>
      </ul>
    </nav>
  );
}
