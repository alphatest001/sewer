import { useState, useEffect } from 'react';
import { Hammer, Menu, X, FileText, History, Settings, LogOut, User } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import NewEntryForm from './components/NewEntryForm';
import WorkHistory from './components/WorkHistory';
import AdminPanel from './components/AdminPanel';
import Toast from './components/Toast';

type Tab = 'new-entry' | 'history' | 'admin';

function AppContent() {
  const { user, signOut, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab | null>(null);

  // Set default tab based on user role when user is loaded
  useEffect(() => {
    if (!user) {
      setActiveTab(null);
      return;
    }

    // Admin goes to admin panel by default
    if (user.role === 'admin') {
      setActiveTab('admin');
      return;
    }

    // Supervisors and employees go to new entry by default
    if (user.role === 'supervisor' || user.role === 'employee') {
      setActiveTab('new-entry');
      return;
    }

    // Everyone else (customers) goes to history
    setActiveTab('history');
  }, [user]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <Login />;
  }

  const handleSaveEntry = () => {
    setToastMessage('Work entry saved successfully!');
    setActiveTab('history');
  };

  const handleNavigate = (tab: Tab) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    setMenuOpen(false);
  };

  // Determine which menu items to show based on user role
  const menuItems = [];

  // Admin, Employee, and Supervisor can create new entries
  if (user.role === 'admin' || user.role === 'employee' || user.role === 'supervisor') {
    menuItems.push({ id: 'new-entry' as Tab, label: 'New Entry', icon: FileText });
  }

  // Everyone can see work history (filtered by role)
  menuItems.push({ id: 'history' as Tab, label: 'Work History', icon: History });

  // Admin and Supervisor can see admin panel
  if (user.role === 'admin') {
    menuItems.push({ id: 'admin' as Tab, label: 'Admin Panel', icon: Settings });
  } else if (user.role === 'supervisor') {
    menuItems.push({ id: 'admin' as Tab, label: 'Manage Locations', icon: Settings });
  }

  // Role badge color
  const roleBadgeColor = {
    admin: 'bg-red-100 text-red-700',
    employee: 'bg-blue-100 text-blue-700',
    customer: 'bg-green-100 text-green-700',
    supervisor: 'bg-purple-100 text-purple-700',
  }[user.role];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {menuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
              <Hammer className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">VARMAN Equipment Services</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Work Management System</p>
            </div>
          </div>

          <div className="w-10"></div>
        </div>
      </header>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 top-16"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="fixed top-0 left-0 w-72 bg-white shadow-xl z-50 border-r border-gray-200 h-screen flex flex-col overflow-hidden">
            {/* Close Button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{user.full_name}</p>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="mt-2">
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full capitalize ${roleBadgeColor}`}>
                  {user.role}
                </span>
              </div>
            </div>

            {/* Navigation */}
            <div className="p-4 space-y-1 flex-1 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-orange-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Logout Button */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </nav>
        </>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'new-entry' && (user.role === 'admin' || user.role === 'employee' || user.role === 'supervisor') && (
          <NewEntryForm onSave={handleSaveEntry} />
        )}
        {activeTab === 'history' && <WorkHistory />}
        {activeTab === 'admin' && (user.role === 'admin' || user.role === 'supervisor') && <AdminPanel />}
      </main>

      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
