import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close,
  Lock,
  Share,
  Note as NoteIcon
} from '@mui/icons-material';
import { 
  createNote, 
  NOTE_CATEGORIES, 
  NOTE_TYPES,
  getCategoryDisplayInfo 
} from '../../../../shared/services/firebase/notes';

const CreateNoteModal = ({ open, onClose, userId, coupleId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: NOTE_CATEGORIES.LOVE_LETTERS,
    type: NOTE_TYPES.PRIVATE
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Vui lòng điền đầy đủ tiêu đề và nội dung');
      return;
    }

    if (formData.type === NOTE_TYPES.SHARED && !coupleId) {
      setError('Bạn cần kết nối với người yêu để tạo ghi chú chia sẻ');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const noteData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        type: formData.type,
        userId: userId,
      };

      if (formData.type === NOTE_TYPES.SHARED) {
        noteData.coupleId = coupleId;
      }

      const result = await createNote(noteData);
      
      if (result.success) {
        handleClose();
      } else {
        setError(result.error || 'Không thể tạo ghi chú');
      }
    } catch (error) {
      console.error('Error creating note:', error);
      setError('Đã xảy ra lỗi khi tạo ghi chú');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      content: '',
      category: NOTE_CATEGORIES.LOVE_LETTERS,
      type: NOTE_TYPES.PRIVATE
    });
    setError('');
    onClose();
  };

  const isFormValid = formData.title.trim() && formData.content.trim();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          maxHeight: isMobile ? '100vh' : '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NoteIcon color="primary" />
          <Typography variant="h6" component="h2">
            Tạo ghi chú mới
          </Typography>
        </Box>
        <IconButton onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Note Type Selection */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Loại ghi chú
            </Typography>
            <ToggleButtonGroup
              value={formData.type}
              exclusive
              onChange={(e, newType) => newType && handleInputChange('type', newType)}
              fullWidth={isMobile}
              size="small"
            >
              <ToggleButton value={NOTE_TYPES.PRIVATE}>
                <Lock sx={{ mr: 1, fontSize: 16 }} />
                Riêng tư
              </ToggleButton>
              {coupleId && (
                <ToggleButton value={NOTE_TYPES.SHARED}>
                  <Share sx={{ mr: 1, fontSize: 16 }} />
                  Chia sẻ với người yêu
                </ToggleButton>
              )}
            </ToggleButtonGroup>
            {!coupleId && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Kết nối với người yêu để có thể tạo ghi chú chia sẻ
              </Typography>
            )}
          </Box>

          {/* Category Selection */}
          <FormControl fullWidth>
            <InputLabel>Danh mục</InputLabel>
            <Select
              value={formData.category}
              label="Danh mục"
              onChange={(e) => handleInputChange('category', e.target.value)}
            >
              {Object.values(NOTE_CATEGORIES).map((category) => {
                const info = getCategoryDisplayInfo(category);
                return (
                  <MenuItem key={category} value={category}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography component="span">{info.emoji}</Typography>
                      <Typography>{info.name}</Typography>
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* Title */}
          <TextField
            fullWidth
            label="Tiêu đề"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Nhập tiêu đề ghi chú..."
            variant="outlined"
            required
          />

          {/* Content */}
          <TextField
            fullWidth
            label="Nội dung"
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            placeholder="Viết nội dung ghi chú của bạn..."
            multiline
            rows={8}
            variant="outlined"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                alignItems: 'flex-start'
              }
            }}
          />

          {/* Character count */}
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right' }}>
            {formData.content.length} ký tự
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
        >
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isFormValid || loading}
          sx={{ minWidth: 100 }}
        >
          {loading ? 'Đang tạo...' : 'Tạo ghi chú'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateNoteModal;