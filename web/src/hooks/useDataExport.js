import { useState, useCallback } from 'react';
import { saveAs } from 'file-saver';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export const useDataExport = () => {
  const [exporting, setExporting] = useState(false);
  const { user } = useAuthContext();
  const { t } = useTranslation();

  const formatDate = (date) => {
    return new Date(date).toISOString().split('T')[0];
  };

  const exportToJSON = useCallback(async (data, filename = 'iloveyou-backup') => {
    setExporting(true);
    
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        userEmail: user?.email,
        version: '1.0',
        data
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      saveAs(blob, `${filename}-${formatDate(new Date())}.json`);
    } catch (error) {
      console.error('Error exporting JSON:', error);
      throw error;
    } finally {
      setExporting(false);
    }
  }, [user]);

  const exportToCSV = useCallback(async (data, columns, filename = 'iloveyou-data') => {
    setExporting(true);
    
    try {
      // Create CSV header
      const headers = columns.map(col => col.label || col.key).join(',');
      
      // Create CSV rows
      const rows = data.map(item => {
        return columns.map(col => {
          let value = item[col.key];
          
          // Handle different data types
          if (value === null || value === undefined) {
            value = '';
          } else if (typeof value === 'object') {
            if (Array.isArray(value)) {
              value = value.join('; ');
            } else if (value instanceof Date) {
              value = value.toLocaleDateString();
            } else {
              value = JSON.stringify(value);
            }
          } else if (typeof value === 'string' && value.includes(',')) {
            value = `"${value}"`;
          }
          
          return value;
        }).join(',');
      });

      const csvContent = [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${filename}-${formatDate(new Date())}.csv`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw error;
    } finally {
      setExporting(false);
    }
  }, []);

  const exportNotes = useCallback(async (notes, format = 'json') => {
    const processedNotes = notes.map(note => ({
      id: note.id,
      title: note.title,
      content: note.content,
      category: note.category,
      tags: note.tags,
      photos: note.photos?.map(p => p.url) || [],
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      isPrivate: note.isPrivate
    }));

    if (format === 'csv') {
      const columns = [
        { key: 'title', label: t('notes.title') },
        { key: 'content', label: t('notes.content') },
        { key: 'category', label: t('notes.category') },
        { key: 'tags', label: t('notes.tags') },
        { key: 'createdAt', label: t('notes.createdAt') },
        { key: 'updatedAt', label: t('notes.updatedAt') }
      ];
      
      await exportToCSV(processedNotes, columns, 'notes');
    } else {
      await exportToJSON({ notes: processedNotes }, 'notes-backup');
    }
  }, [exportToJSON, exportToCSV, t]);

  const exportReminders = useCallback(async (reminders, format = 'json') => {
    const processedReminders = reminders.map(reminder => ({
      id: reminder.id,
      title: reminder.title,
      description: reminder.description,
      type: reminder.type,
      date: reminder.date,
      time: reminder.time,
      recurring: reminder.recurring,
      isCompleted: reminder.isCompleted,
      createdAt: reminder.createdAt,
      updatedAt: reminder.updatedAt
    }));

    if (format === 'csv') {
      const columns = [
        { key: 'title', label: t('reminders.title') },
        { key: 'description', label: t('reminders.description') },
        { key: 'type', label: t('reminders.type') },
        { key: 'date', label: t('reminders.date') },
        { key: 'time', label: t('reminders.time') },
        { key: 'recurring', label: t('reminders.recurring') },
        { key: 'isCompleted', label: t('reminders.completed') },
        { key: 'createdAt', label: t('reminders.createdAt') }
      ];
      
      await exportToCSV(processedReminders, columns, 'reminders');
    } else {
      await exportToJSON({ reminders: processedReminders }, 'reminders-backup');
    }
  }, [exportToJSON, exportToCSV, t]);

  const exportAllData = useCallback(async (notes, reminders, coupleData, format = 'json') => {
    const allData = {
      notes: notes.map(note => ({
        id: note.id,
        title: note.title,
        content: note.content,
        category: note.category,
        tags: note.tags,
        photos: note.photos?.map(p => p.url) || [],
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        isPrivate: note.isPrivate
      })),
      reminders: reminders.map(reminder => ({
        id: reminder.id,
        title: reminder.title,
        description: reminder.description,
        type: reminder.type,
        date: reminder.date,
        time: reminder.time,
        recurring: reminder.recurring,
        isCompleted: reminder.isCompleted,
        createdAt: reminder.createdAt,
        updatedAt: reminder.updatedAt
      })),
      couple: {
        startDate: coupleData?.startDate,
        partner1Name: coupleData?.partner1?.name,
        partner2Name: coupleData?.partner2?.name,
        milestones: coupleData?.milestones || []
      }
    };

    await exportToJSON(allData, 'iloveyou-complete-backup');
  }, [exportToJSON]);

  const importData = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(data);
        } catch (error) {
          reject(new Error(t('export.invalidFileFormat')));
        }
      };
      
      reader.onerror = () => reject(new Error(t('export.fileReadError')));
      reader.readAsText(file);
    });
  }, [t]);

  return {
    exporting,
    exportToJSON,
    exportToCSV,
    exportNotes,
    exportReminders,
    exportAllData,
    importData
  };
};