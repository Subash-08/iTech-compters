// src/components/admin/orders/AdminNotes.tsx

import React, { useState } from 'react';
import { AdminNote, AdminNoteFormData } from '../types/order';

interface AdminNotesProps {
  notes: AdminNote[];
  onAddNote: (formData: AdminNoteFormData) => void;
}

const AdminNotes: React.FC<AdminNotesProps> = ({ notes, onAddNote }) => {
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddNote({ note: newNote });
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ✅ FIXED: Safe access to addedBy properties
  const getAddedByText = (note: AdminNote) => {
    if (!note.addedBy) return 'Admin';
    
    // Check if addedBy is populated with user object
    if (typeof note.addedBy === 'object' && note.addedBy.firstName) {
      return `${note.addedBy.firstName} ${note.addedBy.lastName || ''}`.trim();
    }
    
    // If it's just an ID or empty, return generic text
    return 'Admin';
  };

  // ✅ FIXED: Safe date formatting
  const getNoteDate = (note: AdminNote) => {
    if (!note.createdAt) return 'Unknown date';
    
    try {
      // Handle both string and Date objects
      const date = typeof note.createdAt === 'string' 
        ? note.createdAt 
        : note.createdAt.toString();
      return formatDate(date);
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Admin Notes</h3>
      </div>
      
      <div className="p-6">
        {/* Add Note Form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
              Add Note
            </label>
            <textarea
              id="note"
              rows={3}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add a note about this order..."
            />
          </div>
          <div className="mt-3">
            <button
              type="submit"
              disabled={!newNote.trim() || isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding Note...' : 'Add Note'}
            </button>
          </div>
        </form>

        {/* Notes List */}
        <div className="space-y-4">
          {notes.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No admin notes yet.</p>
          ) : (
            notes.map((note) => (
              <div key={note._id} className="border-l-4 border-blue-400 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note}</p>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {getNoteDate(note)} {/* ✅ FIXED: Using safe date function */}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Added by {getAddedByText(note)} {/* ✅ FIXED: Using safe user function */}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotes;