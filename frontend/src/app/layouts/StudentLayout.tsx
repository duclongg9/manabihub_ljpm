import { Outlet } from 'react-router-dom';

export function StudentLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-blue-600 text-white shadow px-4 py-3">
        <h1 className="text-xl font-bold">ManabiHub - Student Area</h1>
      </header>
      <main className="flex-grow p-4">
        <Outlet />
      </main>
    </div>
  );
}
