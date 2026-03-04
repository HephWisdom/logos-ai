import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { VerseCard } from '../components/VerseCard';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../hooks/useAuth';
import { Trash2, StickyNote } from 'lucide-react';

export default function Notes() {
  const { user, profile } = useAuth();
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('notes').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setNotes(data || []));
  }, [user]);

  async function deleteNote(id) {
    await supabase.from('notes').delete().eq('id', id);
    setNotes(n => n.filter(note => note.id !== id));
  }

  return (
    <div className="flex h-screen bg-parchment-50 dark:bg-ink-900">
      <Sidebar profile={profile} conversations={[]} activeId={null} onNew={() => {}} onSelect={() => {}} onDelete={() => {}} />
      <main className="flex-1 overflow-y-auto px-6 py-8 max-w-3xl mx-auto w-full">
        <h1 className="font-display text-3xl font-bold text-ink-800 dark:text-parchment-100 mb-2">My Notes</h1>
        <p className="font-serif italic text-ink-800/60 dark:text-parchment-300/60 mb-8 text-sm">Verses and annotations you've saved during study</p>

        {notes.length === 0 && (
          <div className="text-center py-16">
            <StickyNote size={40} className="text-parchment-300 dark:text-ink-700 mx-auto mb-4" />
            <p className="font-serif italic text-ink-800/40 dark:text-parchment-300/40">No saved notes yet. Save verses during your study sessions.</p>
          </div>
        )}

        <div className="space-y-4">
          {notes.map(note => (
            <div key={note.id} className="relative group">
              <VerseCard
                book={note.book}
                chapter={note.chapter}
                verse={note.verse}
                text={note.note_text || ''}
                translation={note.translation}
              />
              {note.note_text && (
                <div className="ml-4 mt-1 px-4 py-2 bg-gold-50 dark:bg-gold-900/10 border-l-2 border-gold-300 dark:border-gold-600/30 text-sm font-serif text-ink-800/80 dark:text-parchment-200/80 italic rounded-r">
                  {note.note_text}
                </div>
              )}
              <button onClick={() => deleteNote(note.id)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-red-400/60 hover:text-red-400 p-1">
                <Trash2 size={14}/>
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
