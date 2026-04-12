import React from "react";

const Navbar = () => {
  return (
    <nav className="bg-background border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold">
            Unsplash Metadata Generator
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
