import { Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow px-4 py-3">
        <h1 className="text-xl font-bold text-blue-600">ManabiHub</h1>
      </header>
      <main className="flex-grow p-4">
        <Outlet />
      </main>
      <footer className="bg-gray-800 text-white p-4 text-center">
        &copy; {new Date().getFullYear()} ManabiHub
      </footer>
    </div>
  );
}
