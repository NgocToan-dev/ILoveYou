import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Fab,
  Grid,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Note,
  Add,
  Search,
  FilterList,
  Edit,
  Delete,
  Share,
  Lock,
  Clear
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  subscribeToUserPrivateNotes,
  subscribeToCoupleSharedNotes,
  deleteNote,
  NOTE_CATEGORIES,
  NOTE_TYPES,
  getCategoryDisplayInfo
} from '../../../shared/services/firebase/notes';
import CreateNoteModal from '../components/notes/CreateNoteModal';
import EditNoteModal from '../components/notes/EditNoteModal';
import NoteCard from '../components/notes/NoteCard';

const NotesPage = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [notes, setNotes] = useState([]);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [coupleId, setCoupleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [error, setError] = useState('');

  // Fetch user data and setup subscriptions
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCoupleId(userData.coupleId || null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setError('Không thể tải thông tin người dùng');
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, [user]);

  // Subscribe to private notes
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToUserPrivateNotes(
      user.uid,
      selectedCategory || null,
      (privateNotes) => {
        setNotes(privateNotes || []);
      }
    );

    return unsubscribe;
  }, [user?.uid, selectedCategory]);

  // Subscribe to shared notes
  useEffect(() => {
    if (!coupleId) {
      setSharedNotes([]);
      return;
    }

    const unsubscribe = subscribeToCoupleSharedNotes(
      coupleId,
      selectedCategory || null,
      (coupleNotes) => {
        setSharedNotes(coupleNotes || []);
      }
    );

    return unsubscribe;
  }, [coupleId, selectedCategory]);

  // Filter and search notes
  const getFilteredNotes = () => {
    let allNotes = [];
    
    if (selectedType === 'all' || selectedType === 'private') {
      allNotes = [...allNotes, ...notes];
    }
    
    if (selectedType === 'all' || selectedType === 'shared') {
      allNotes = [...allNotes, ...sharedNotes];
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      allNotes = allNotes.filter(note =>
        note.title?.toLowerCase().includes(searchLower) ||
        note.content?.toLowerCase().includes(searchLower)
      );
    }

    return allNotes.sort((a, b) => {
      const dateA = a.updatedAt?.toDate?.() || new Date(a.updatedAt);
      const dateB = b.updatedAt?.toDate?.() || new Date(b.updatedAt);
      return dateB - dateA;
    });
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteNote(noteId);
    } catch (error) {
      console.error('Error deleting note:', error);
      setError('Không thể xóa ghi chú');
    }
  };

  const handleEditNote = (note) => {
    setSelectedNote(note);
    setEditModalOpen(true);
  };

  const filteredNotes = getFilteredNotes();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, sm: 2 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Note color="primary" />
          Ghi chú tình yêu
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Lưu giữ những khoảnh khắc đẹp và suy nghĩ của bạn
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            {/* Search */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm ghi chú..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>

            {/* Category Filter */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Danh mục</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Danh mục"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {Object.values(NOTE_CATEGORIES).map((category) => {
                    const info = getCategoryDisplayInfo(category);
                    return (
                      <MenuItem key={category} value={category}>
                        {info.emoji} {info.name}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            {/* Type Filter */}
            <Grid item xs={12} md={5}>
              <ToggleButtonGroup
                value={selectedType}
                exclusive
                onChange={(e, newType) => newType && setSelectedType(newType)}
                size="small"
                fullWidth={isMobile}
              >
                <ToggleButton value="all">
                  Tất cả ({notes.length + sharedNotes.length})
                </ToggleButton>
                <ToggleButton value="private">
                  <Lock sx={{ mr: 1, fontSize: 16 }} />
                  Riêng tư ({notes.length})
                </ToggleButton>
                {coupleId && (
                  <ToggleButton value="shared">
                    <Share sx={{ mr: 1, fontSize: 16 }} />
                    Chia sẻ ({sharedNotes.length})
                  </ToggleButton>
                )}
              </ToggleButtonGroup>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Notes Grid */}
      {filteredNotes.length > 0 ? (
        <Grid container spacing={2}>
          {filteredNotes.map((note) => (
            <Grid item xs={12} sm={6} md={4} key={note.id}>
              <NoteCard
                note={note}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Note sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {searchTerm || selectedCategory 
                ? 'Không tìm thấy ghi chú nào'
                : 'Chưa có ghi chú nào'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm || selectedCategory 
                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                : 'Hãy tạo ghi chú đầu tiên của bạn!'}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add note"
        sx={{
          position: 'fixed',
          bottom: { xs: 80, sm: 20 },
          right: 20,
        }}
        onClick={() => setCreateModalOpen(true)}
      >
        <Add />
      </Fab>

      {/* Create Note Modal */}
      <CreateNoteModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        userId={user?.uid}
        coupleId={coupleId}
      />

      {/* Edit Note Modal */}
      <EditNoteModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedNote(null);
        }}
        note={selectedNote}
      />
    </Box>
  );
};

export default NotesPage;