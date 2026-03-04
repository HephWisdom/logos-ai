import { useState } from 'react';
import { supabase } from '../services/supabase';

export function useConversation(userId) {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId]           = useState(null);
  const [messages, setMessages]           = useState([]);

  async function loadConversations() {
    if (!userId) return;
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(50);
    setConversations(data || []);
  }

  async function newConversation() {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: userId, title: 'New Study' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (data) {
      setConversations(prev => [data, ...prev]);
      setActiveId(data.id);
      setMessages([]);
    }
    return data;
  }

  async function loadMessages(conversationId) {
    setActiveId(conversationId);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    setMessages(data || []);
  }

  async function saveMessage(conversationId, role, content, metadata = {}) {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, role, content, metadata })
      .select()
      .single();
    if (error) throw new Error(error.message);

    setMessages(prev => [...prev, data]);
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
    if (updateError) throw new Error(updateError.message);

    return data;
  }

  async function updateConversationTitle(conversationId, title) {
    await supabase.from('conversations').update({ title }).eq('id', conversationId);
    setConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, title } : c)
    );
  }

  async function deleteConversation(conversationId) {
    await supabase.from('conversations').delete().eq('id', conversationId);
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (activeId === conversationId) {
      setActiveId(null);
      setMessages([]);
    }
  }

  return {
    conversations, activeId, messages, setMessages,
    loadConversations, newConversation, loadMessages,
    saveMessage, updateConversationTitle, deleteConversation,
  };
}
