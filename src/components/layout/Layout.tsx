import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';


interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      <Sidebar />

      {/* Main area */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300`}>
        <Header />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;



