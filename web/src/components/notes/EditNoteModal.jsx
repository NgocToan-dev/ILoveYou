import React, { useState, useEffect } from 'react';
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
  Edit as EditIcon
} from '@mui/icons-material';
import { 
  updateNote, 
  NOTE_CATEGORIES, 
  NOTE_TYPES,
  getCategoryDisplayInfo 
} from '../../../../shared/services/firebase/notes';

const EditNoteModal = ({ open, onClose, note }) => {
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

  // Update form data when note changes
  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title || '',
        content: note.content || '',
        category: note.category || NOTE_CATEGORIES.LOVE_LETTERS,
        type: note.type || NOTE_TYPES.PRIVATE
      });
    }
  }, [note]);

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

    if (!note?.id) {
      setError('Không tìm thấy thông tin ghi chú');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const updateData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        // Note: type cannot be changed after creation for data consistency
      };

      await updateNote(note.id, updateData);
      handleClose();
    } catch (error) {
      console.error('Error updating note:', error);
      setError('Đã xảy ra lỗi khi cập nhật ghi chú');
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
  const hasChanges = note && (
    formData.title !== note.title ||
    formData.content !== note.content ||
    formData.category !== note.category
  );

  if (!note) return null;

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
          <EditIcon color="primary" />
          <Typography variant="h6" component="h2">
            Chỉnh sửa ghi chú
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
          {/* Note Type Display (Read-only) */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Loại ghi chú
            </Typography>
            <Box sx={{ 
              p: 1.5, 
              border: `1px solid ${theme.palette.divider}`, 
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: theme.palette.grey[50]
            }}>
              {formData.type === NOTE_TYPES.PRIVATE ? (
                <>
                  <Lock sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Riêng tư (không thể thay đổi)
                  </Typography>
                </>
              ) : (
                <>
                  <Share sx={{ fontSize: 16, color: 'info.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    Chia sẻ với người yêu (không thể thay đổi)
                  </Typography>
                </>
              )}
            </Box>
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

          {/* Last updated info */}
          {note.updatedAt && (
            <Typography variant="caption" color="text.secondary">
              Cập nhật lần cuối: {new Date(note.updatedAt.toDate ? note.updatedAt.toDate() : note.updatedAt).toLocaleString('vi-VN')}
            </Typography>
          )}
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
          disabled={!isFormValid || !hasChanges || loading}
          sx={{ minWidth: 100 }}
        >
          {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditNoteModal;