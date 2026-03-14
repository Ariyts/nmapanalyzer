import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Hosts from './pages/Hosts';
import Services from './pages/Services';
import ADInfra from './pages/ADInfra';
import Diff from './pages/Diff';
import Recommendations from './pages/Recommendations';
import Export from './pages/Export';
import UploadPage from './pages/Upload';
import RuleBuilderPage from './pages/RuleBuilderPage';

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/hosts" element={<Hosts />} />
          <Route path="/services" element={<Services />} />
          <Route path="/ad" element={<ADInfra />} />
          <Route path="/diff" element={<Diff />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/export" element={<Export />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/rule-builder" element={<RuleBuilderPage />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
