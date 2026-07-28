import { Outlet, Link } from 'react-router-dom';

export const HelpCenterLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Help Center specific header area if needed, or rely on PublicLayout */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/help" className="text-xl font-bold text-gray-900">
            Trung tâm trợ giúp
          </Link>
          <div className="w-full max-w-sm hidden sm:block">
            <input 
              type="search" 
              placeholder="Tìm kiếm bài viết..." 
              className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
