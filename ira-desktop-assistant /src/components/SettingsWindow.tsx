import { useState, useEffect } from 'react';
import { IraConfig, Contact } from '../types';
import { User, Cpu, Palette, Command, Link, Plus, Trash2, Check, X, ShieldAlert, Save } from 'lucide-react';

interface SettingsWindowProps {
  config: IraConfig;
  setConfig: (c: IraConfig) => void;
  onClose: () => void;
  onLogout: () => void;
}

export default function SettingsWindow({ config, setConfig, onClose, onLogout }: SettingsWindowProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'ai' | 'appearance' | 'shortcuts' | 'integrations'>('personal');
  const [draftConfig, setDraftConfig] = useState<IraConfig>(config);
  
  // Sync draft if external config changes
  useEffect(() => {
    setDraftConfig(config);
  }, [config]);
  
  // Contacts state
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');

  const hasChanges = JSON.stringify(draftConfig) !== JSON.stringify(config);

  const updateDraft = (updates: Partial<IraConfig>) => {
    setDraftConfig(prev => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    setConfig(draftConfig);
    // DesktopEnv's setConfig prop already saves to IPC/localStorage,
    // but we can ensure it here just to be completely safe:
    if (window.electronAPI) {
      window.electronAPI.saveSettings(draftConfig);
    } else {
      localStorage.setItem('ira_config', JSON.stringify(draftConfig));
    }
  };

  const handleAddContact = () => {
    if (!newContactName.trim() || !newContactEmail.trim()) return;
    const newContact: Contact = {
      id: Date.now().toString(),
      name: newContactName,
      email: newContactEmail
    };
    const currentContacts = draftConfig.contacts || [];
    updateDraft({ contacts: [...currentContacts, newContact] });
    setNewContactName('');
    setNewContactEmail('');
  };

  const handleDeleteContact = (id: string) => {
    const currentContacts = draftConfig.contacts || [];
    updateDraft({ contacts: currentContacts.filter(c => c.id !== id) });
  };

  const tabs = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'ai', label: 'AI Provider', icon: Cpu },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'shortcuts', label: 'Shortcuts & Triggers', icon: Command },
    { id: 'integrations', label: 'Integrations', icon: Link },
  ] as const;

  return (
    <div className="flex h-full bg-zinc-950 font-sans text-sm text-zinc-300">
      {/* Sidebar */}
      <div className="w-56 bg-zinc-900/50 border-r border-white/5 flex flex-col p-4">
        <h3 className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-4 px-2">Settings</h3>
        <div className="flex flex-col gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  isActive ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="mt-auto pt-4 border-t border-white/5">
          <button onClick={onLogout} className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition">
            Log Out / Reset
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col relative h-full">
        <div className="flex-1 overflow-y-auto p-6 pb-24">
        
        {/* PERSONAL */}
        {activeTab === 'personal' && (
          <div className="flex flex-col gap-8 max-w-xl">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Personal Details</h2>
              <p className="text-xs text-zinc-500 mb-4">How IRA addresses you and your contacts.</p>
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-300">Your Name</label>
                <input
                  type="text"
                  value={draftConfig.user_name}
                  onChange={e => updateDraft({ user_name: e.target.value })}
                  className="bg-black/40 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none w-full max-w-xs"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white mb-3">Contacts</h3>
              <div className="bg-black/20 border border-zinc-800 rounded-lg overflow-hidden mb-3">
                <table className="w-full text-xs text-left">
                  <thead className="bg-black/40 text-zinc-500">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Name</th>
                      <th className="px-4 py-2 font-semibold">Email</th>
                      <th className="px-4 py-2 font-semibold w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(draftConfig.contacts || []).map(c => (
                      <tr key={c.id} className="border-t border-zinc-800/50">
                        <td className="px-4 py-2 text-zinc-300">{c.name}</td>
                        <td className="px-4 py-2 text-zinc-400">{c.email}</td>
                        <td className="px-4 py-2 text-right">
                          <button onClick={() => handleDeleteContact(c.id)} className="text-zinc-600 hover:text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(draftConfig.contacts || []).length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-4 text-center text-zinc-600 italic">No contacts added yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={newContactName}
                  onChange={e => setNewContactName(e.target.value)}
                  className="bg-black/40 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white flex-1 outline-none"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newContactEmail}
                  onChange={e => setNewContactEmail(e.target.value)}
                  className="bg-black/40 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white flex-1 outline-none"
                />
                <button onClick={handleAddContact} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded flex items-center gap-1 text-xs font-semibold">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI PROVIDER */}
        {activeTab === 'ai' && (
          <div className="flex flex-col gap-6 max-w-xl">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">AI Provider</h2>
              <p className="text-xs text-zinc-500 mb-4">Choose how IRA thinks and processes information.</p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                {(['gemini', 'groq', 'openai', 'claude'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => updateDraft({ ai_provider: p })}
                    className={`p-3 border rounded-lg text-left transition ${
                      draftConfig.ai_provider === p 
                        ? 'border-indigo-500 bg-indigo-500/10' 
                        : 'border-zinc-800 bg-black/20 hover:border-zinc-600'
                    }`}
                  >
                    <div className="text-sm font-bold text-white capitalize">{p}</div>
                    <div className="text-[10px] text-zinc-500 mt-1">
                      {p === 'gemini' ? 'Default (Flash 2.0)' : p === 'groq' ? 'Llama 3' : 'Requires API Key'}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2 mb-4">
                <label className="text-xs font-semibold text-zinc-300">API Key</label>
                <input
                  type="password"
                  value={draftConfig.api_key}
                  onChange={e => updateDraft({ api_key: e.target.value })}
                  placeholder="Paste your API key here..."
                  className="bg-black/40 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none w-full"
                />
              </div>

              <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded text-xs font-semibold transition">
                Test Connection
              </button>
            </div>
          </div>
        )}

        {/* APPEARANCE */}
        {activeTab === 'appearance' && (
          <div className="flex flex-col gap-6 max-w-xl">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Appearance</h2>
              <p className="text-xs text-zinc-500 mb-4">Customize the floating orb and workspace.</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-zinc-300">Workspace Theme</label>
                  <select
                    value={draftConfig.theme}
                    onChange={e => updateDraft({ theme: e.target.value as any })}
                    className="bg-black/40 border border-zinc-800 rounded px-3 py-2 text-xs text-white outline-none w-full"
                  >
                    <option value="dark">Dark Slate</option>
                    <option value="light">Alabaster</option>
                    <option value="glass">Frosted Glass</option>
                    <option value="neon">Tokyo Cyberpunk</option>
                    <option value="minimal">Absolute Monochrome</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-zinc-300">Orb Color</label>
                  <select
                    value={draftConfig.orb_color || 'purple'}
                    onChange={e => updateDraft({ orb_color: e.target.value as any })}
                    className="bg-black/40 border border-zinc-800 rounded px-3 py-2 text-xs text-white outline-none w-full"
                  >
                    <option value="white">White</option>
                    <option value="black">Black</option>
                    <option value="purple">Purple</option>
                    <option value="blue">Blue</option>
                    <option value="coral">Coral</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-300 flex justify-between">
                  <span>Orb Size</span>
                  <span className="text-indigo-400">{draftConfig.orb_size || 40}px</span>
                </label>
                <input
                  type="range"
                  min="32" max="56" step="1"
                  value={draftConfig.orb_size || 40}
                  onChange={e => updateDraft({ orb_size: parseInt(e.target.value) })}
                  className="accent-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-300 flex justify-between">
                  <span>Idle Opacity</span>
                  <span className="text-indigo-400">{Math.round((draftConfig.idle_opacity ?? 0.8) * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0.2" max="1.0" step="0.1"
                  value={draftConfig.idle_opacity ?? 0.8}
                  onChange={e => updateDraft({ idle_opacity: parseFloat(e.target.value) })}
                  className="accent-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-300">Position Preset</label>
                <select
                  value={draftConfig.orb_position || 'bottom-right'}
                  onChange={e => updateDraft({ orb_position: e.target.value as any })}
                  className="bg-black/40 border border-zinc-800 rounded px-3 py-2 text-xs text-white outline-none w-full"
                >
                  <option value="bottom-right">Bottom Right (Default)</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* SHORTCUTS */}
        {activeTab === 'shortcuts' && (
          <div className="flex flex-col gap-6 max-w-xl">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Shortcuts & Triggers</h2>
              <p className="text-xs text-zinc-500 mb-4">How you summon IRA.</p>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Global Shortcut</h4>
                  <p className="text-[10px] text-zinc-500">Press from anywhere to open the command bar.</p>
                </div>
                <button className="bg-zinc-800 text-white px-3 py-1.5 rounded font-mono text-xs shadow-inner">
                  {draftConfig.shortcut}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Voice Wake Word</h4>
                  <p className="text-[10px] text-zinc-500">Say "Hey Ira" to activate the microphone.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={draftConfig.voice_wake_word} onChange={e => updateDraft({ voice_wake_word: e.target.checked })} />
                  <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Launch At Startup</h4>
                  <p className="text-[10px] text-zinc-500">Start IRA automatically when you boot your computer.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={draftConfig.launch_at_startup} onChange={e => updateDraft({ launch_at_startup: e.target.checked })} />
                  <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* INTEGRATIONS */}
        {activeTab === 'integrations' && (
          <div className="flex flex-col gap-6 max-w-xl">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Integrations</h2>
              <p className="text-xs text-zinc-500 mb-4">Connect IRA to your other tools.</p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-4 bg-black/20 border border-zinc-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center text-red-500 font-bold">G</div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Gmail</h4>
                    <p className="text-[10px] text-zinc-500">{draftConfig.gmail_connected ? 'Connected as user@gmail.com' : 'Not connected'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => updateDraft({ gmail_connected: !draftConfig.gmail_connected })}
                  className={`px-3 py-1.5 rounded text-xs font-semibold ${draftConfig.gmail_connected ? 'bg-zinc-800 text-zinc-300 hover:text-red-400' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                >
                  {draftConfig.gmail_connected ? 'Disconnect' : 'Connect'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 border border-zinc-800/50 opacity-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">C</div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Google Calendar</h4>
                    <p className="text-[10px] text-zinc-500">Manage events and schedule</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                  <ShieldAlert className="w-3.5 h-3.5" /> Coming Soon
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 border border-zinc-800/50 opacity-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center text-purple-500 font-bold">S</div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Slack</h4>
                    <p className="text-[10px] text-zinc-500">Send messages to channels</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                  <ShieldAlert className="w-3.5 h-3.5" /> Coming Soon
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 border border-zinc-800/50 opacity-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-green-500/10 flex items-center justify-center text-green-500 font-bold">W</div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">WhatsApp</h4>
                    <p className="text-[10px] text-zinc-500">Automate messages</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                  <ShieldAlert className="w-3.5 h-3.5" /> Coming Soon
                </div>
              </div>
            </div>
          </div>
        )}

        </div>

        {/* Floating Footer Save Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-zinc-950/90 border-t border-white/5 backdrop-blur flex justify-end gap-3 items-center z-10">
          {hasChanges && <span className="text-xs text-indigo-400 mr-2 animate-pulse">Unsaved changes...</span>}
          <button 
            onClick={() => setDraftConfig(config)} 
            disabled={!hasChanges}
            className={`px-4 py-2 rounded text-xs font-semibold transition ${hasChanges ? 'text-zinc-400 hover:text-white' : 'text-zinc-700 cursor-not-allowed'}`}
          >
            Discard
          </button>
          <button 
            onClick={handleSave} 
            disabled={!hasChanges}
            className={`flex items-center gap-1.5 px-5 py-2 rounded text-xs font-semibold transition shadow-lg ${hasChanges ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
          >
            <Save className="w-3.5 h-3.5" />
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}
