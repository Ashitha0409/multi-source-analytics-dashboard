import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Save, Check } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { useGoogleSheets } from '../hooks/useGoogleSheets';
import { clsx } from '../utils';

const SettingsPage: React.FC = () => {
  const { dataSources, sheetConfigs, setSheetConfigs, ignoreDuplicates, setIgnoreDuplicates } = useDashboardStore();
  const { refetch, sheetsLoading } = useGoogleSheets();
  const [configs, setConfigs] = useState(sheetConfigs);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSheetConfigs(configs);
    setSaved(true);
    refetch();
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8 pb-8 max-w-4xl mx-auto mt-4">
      
      {/* Dynamic Data Source Configuration */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-black font-semibold text-lg mb-2">Google Sheets Configuration</h2>
        <p className="text-slate-500 text-sm mb-6">Connect public Google Sheets without API keys. Ensure the sheets are set to "Anyone with the link can view".</p>
        
        <div className="space-y-4">
          {configs.map((config, i) => (
            <div key={i} className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200/50">
              <div className="flex-1">
                <label className="block text-slate-600 text-xs font-medium mb-1.5 ml-1">Sheet Label</label>
                <input 
                  type="text" 
                  value={config.name}
                  onChange={(e) => setConfigs(c => c.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-black text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="flex-[2]">
                <label className="block text-slate-600 text-xs font-medium mb-1.5 ml-1">Spreadsheet ID</label>
                <input 
                  type="text" 
                  value={config.id}
                  onChange={(e) => setConfigs(c => c.map((x, idx) => idx === i ? { ...x, id: e.target.value } : x))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-black text-sm focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                />
              </div>
              <div className="flex-1">
                <label className="block text-slate-600 text-xs font-medium mb-1.5 ml-1">Tab Name</label>
                <input 
                  type="text" 
                  value={config.range}
                  onChange={(e) => setConfigs(c => c.map((x, idx) => idx === i ? { ...x, range: e.target.value } : x))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-black text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={sheetsLoading === 'loading'}
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-200 text-black hover:bg-purple-200 text-black text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            {saved ? <Check size={16} /> : <Save size={16} />}
            {saved ? 'Saved & Refreshing' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Duplicate Handling */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-black font-semibold text-lg mb-1">Ignore Duplicates</h2>
          <p className="text-slate-500 text-sm">Automatically hide duplicate records across all sources (Sheets, CSVs). If disabled, duplicates are highlighted in yellow.</p>
        </div>
        <button
          onClick={() => setIgnoreDuplicates(!ignoreDuplicates)}
          className={clsx(
            'relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none',
            ignoreDuplicates ? 'bg-purple-200 text-black' : 'bg-slate-700'
          )}
        >
          <div className={clsx(
            'absolute top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-sm',
            ignoreDuplicates ? 'left-7' : 'left-1'
          )} />
        </button>
      </div>

      {/* Connection Status */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-black font-semibold text-lg mb-4">Current Connections</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {dataSources.map(src => (
            <div key={src.id} className="bg-white p-4 rounded-2xl border border-slate-200/50">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-700 font-medium text-sm truncate">{src.name}</p>
                <div className={clsx(
                  'w-2 h-2 rounded-full',
                  src.status === 'success' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' :
                  src.status === 'error' ? 'bg-red-400' : 'bg-slate-600'
                )} />
              </div>
              <p className="text-black text-2xl font-bold mb-1">{src.rowCount.toLocaleString()} <span className="text-slate-500 text-sm font-normal">rows</span></p>
              <div className="flex items-center gap-2 mt-2">
                {src.status === 'error' ? (
                  <p className="text-black text-xs flex items-center gap-1"><AlertCircle size={12}/> {src.error?.message || 'Connection failed'}</p>
                ) : src.status === 'success' ? (
                  <p className="text-black text-xs flex items-center gap-1"><CheckCircle2 size={12}/> Connected successfully</p>
                ) : (
                  <p className="text-slate-500 text-xs">Waiting to connect...</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;



