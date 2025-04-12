import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm px-4 py-2 flex items-center justify-between">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-gray-700">CAD Drawing Tool</h1>
        <div className="ml-8 flex space-x-4">
          <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100">File</button>
          <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100">Edit</button>
          <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100">View</button>
          <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100">Tools</button>
          <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100">Help</button>
        </div>
      </div>
      <div>
        <button className="px-3 py-1 text-sm bg-[#0066CC] text-white rounded hover:bg-blue-700">Sign In</button>
      </div>
    </header>
  );
};

export default Header;
