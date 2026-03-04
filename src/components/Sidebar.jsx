import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  MessageSquare, Search, BookOpen, BookMarked,
  StickyNote, Settings, Plus, Trash2, ChevronLeft,
  ChevronRight, Moon, Sun, Crown
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
  { to: '/chat',        icon: MessageSquare, label: 'Study Chat' },
  { to: '/word-study',  icon: BookOpen,      label: 'Word Study' },
  { to: '/search',      icon: Search,        label: 'Verse Search' },
  { to: '/reading',     icon: BookMarked,    label: 'Reading Plans' },
  { to: '/notes',       icon: StickyNote,    label: 'My Notes' },
];

export function Sidebar({ conversations, activeId, onNew, onSelect, onDelete, profile }) {
  const [collapsed, setCollapsed]     = useState(false);
  const [hoveredConv, setHoveredConv] = useState(null);
  const { dark, toggle }              = useTheme();
  const location                      = useLocation();

  const plan = profile?.plan || 'free';

  return (
    <aside className={`flex flex-col h-screen bg-leather dark:bg-ink-900 border-r border-white/10 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} flex-shrink-0`}>
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <span className="text-xs font-bold text-mahogany-900">Λ</span>
            </div>
            <span className="font-display font-bold text-parchment-100 text-lg tracking-wide">Logos</span>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 mx-auto rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
            <span className="text-xs font-bold text-mahogany-900">Λ</span>
          </div>
        )}
        <button onClick={() => setCollapsed(c => !c)} className="text-parchment-300/60 hover:text-parchment-100 transition-colors p-1 rounded ml-auto">
          {collapsed ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}
        </button>
      </div>

      <div className="px-3 pt-4 pb-2">
        <button onClick={onNew} className={`w-full flex items-center gap-2 bg-gold-500/20 hover:bg-gold-500/30 text-gold-300 rounded-lg transition-colors duration-150 font-sans text-sm font-medium ${collapsed ? 'justify-center py-2.5' : 'px-3 py-2.5'}`}>
          <Plus size={16} />
          {!collapsed && 'New Study'}
        </button>
      </div>

      <nav className="px-3 py-2 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to} className={`flex items-center gap-3 rounded-lg transition-colors duration-150 font-sans text-sm ${collapsed ? 'justify-center py-2.5 px-2' : 'px-3 py-2'} ${location.pathname === to ? 'bg-white/10 text-parchment-100' : 'text-parchment-300/70 hover:bg-white/5 hover:text-parchment-100'}`}>
            <Icon size={16} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      {!collapsed && (plan === 'pro' || plan === 'scholar') && (
        <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
          <div className="gold-rule mb-2" />
          <p className="text-xs font-sans text-parchment-300/40 px-2 mb-2 uppercase tracking-wider">Recent Studies</p>
          <div className="space-y-0.5">
            {conversations.map(conv => (
              <button key={conv.id} onClick={() => onSelect(conv.id)} onMouseEnter={() => setHoveredConv(conv.id)} onMouseLeave={() => setHoveredConv(null)} className={`group w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors duration-150 font-sans text-xs ${activeId === conv.id ? 'bg-white/10 text-parchment-100' : 'text-parchment-300/60 hover:bg-white/5 hover:text-parchment-200'}`}>
                <MessageSquare size={12} className="flex-shrink-0 opacity-60" />
                <span className="flex-1 truncate">{conv.title}</span>
                {hoveredConv === conv.id && (
                  <button onClick={e => { e.stopPropagation(); onDelete(conv.id); }} className="opacity-0 group-hover:opacity-100 text-red-400/70 hover:text-red-400 transition-all">
                    <Trash2 size={11} />
                  </button>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {!collapsed && plan === 'free' && (
        <div className="mx-3 my-2 p-3 rounded-lg bg-gold-500/10 border border-gold-500/20">
          <p className="text-xs font-sans text-gold-400/80 leading-relaxed">Upgrade to save & revisit your study history.</p>
          <Link to="/settings" className="text-xs font-sans text-gold-400 hover:text-gold-300 font-medium mt-1 block">Upgrade →</Link>
        </div>
      )}

      <div className={`px-3 py-3 border-t border-white/10 flex items-center ${collapsed ? 'flex-col gap-3' : 'gap-2'}`}>
        <button onClick={toggle} className="text-parchment-300/60 hover:text-parchment-100 transition-colors p-1.5 rounded">
          {dark ? <Sun size={15}/> : <Moon size={15}/>}
        </button>

        <Link to="/settings" className="text-parchment-300/60 hover:text-parchment-100 transition-colors p-1.5 rounded">
          <Settings size={15}/>
        </Link>

        {!collapsed && plan === 'free' && (
          <Link to="/settings" className="ml-auto flex items-center gap-1 text-xs font-sans text-gold-400 hover:text-gold-300 transition-colors">
            <Crown size={12}/> Pro
          </Link>
        )}
      </div>
    </aside>
  );
}
