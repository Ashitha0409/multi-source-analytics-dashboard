import React from 'react';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import DataPage from './pages/DataPage';
import UploadPage from './pages/UploadPage';
import SettingsPage from './pages/SettingsPage';
import { useDashboardStore } from './store/dashboardStore';

/**
 * App root — single-page with store-driven navigation.
 * No React Router needed; the sidebar controls which page renders.
 */
const App: React.FC = () => {
  const activePage = useDashboardStore(s => s.activePage);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'data':      return <DataPage />;
      case 'upload':    return <UploadPage />;
      case 'settings':  return <SettingsPage />;
      default:          return <DashboardPage />;
    }
  };

  return (
    <Layout>
      {renderPage()}
    </Layout>
  );
};

export default App;



