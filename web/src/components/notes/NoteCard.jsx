import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
  Tooltip
} from '@mui/material';
import {
  Edit,
  Delete,
  Share,
  Lock,
  MoreVert,
  Visibility
} from '@mui/icons-material';
import { getCategoryDisplayInfo, NOTE_TYPES } from '../../../../shared/constants/notes';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const NoteCard = ({ note, onEdit, onDelete }) => {
  const theme = useTheme();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const categoryInfo = getCategoryDisplayInfo(note.category);
  const isShared = note.type === NOTE_TYPES.SHARED;
  
  const formatDate = (date) => {
    if (!date) return '';
    const noteDate = date.toDate ? date.toDate() : new Date(date);
    return formatDistanceToNow(noteDate, { addSuffix: true, locale: vi });
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(note.id);
    setDeleteDialogOpen(false);
  };

  const truncateContent = (content, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <>
      <Card 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4],
          },
          border: `1px solid ${categoryInfo.color}20`,
          borderTop: `4px solid ${categoryInfo.color}`,
        }}
      >
        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  mb: 0.5
                }}
              >
                {note.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip
                  label={categoryInfo.name}
                  size="small"
                  sx={{
                    backgroundColor: `${categoryInfo.color}15`,
                    color: categoryInfo.color,
                    fontWeight: 600,
                    fontSize: '0.7rem'
                  }}
                />
                <Tooltip title={isShared ? 'Ghi chú chia sẻ' : 'Ghi chú riêng tư'}>
                  {isShared ? (
                    <Share sx={{ fontSize: 14, color: 'info.main' }} />
                  ) : (
                    <Lock sx={{ fontSize: 14, color: 'text.secondary' }} />
                  )}
                </Tooltip>
              </Box>
            </Box>
          </Box>

          {/* Content */}
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              mb: 2,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap'
            }}
          >
            {expanded ? note.content : truncateContent(note.content)}
          </Typography>

          {note.content.length > 150 && (
            <Button 
              size="small" 
              onClick={() => setExpanded(!expanded)}
              sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}
            >
              {expanded ? 'Thu gọn' : 'Xem thêm'}
            </Button>
          )}

          {/* Metadata */}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {formatDate(note.updatedAt)}
          </Typography>
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
          <Box>
            {/* Placeholder for additional metadata */}
          </Box>
          <Box>
            <Tooltip title="Chỉnh sửa">
              <IconButton 
                size="small" 
                onClick={() => onEdit(note)}
                sx={{ color: 'primary.main' }}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Xóa">
              <IconButton 
                size="small" 
                onClick={handleDeleteClick}
                sx={{ color: 'error.main' }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </CardActions>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Xác nhận xóa ghi chú</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa ghi chú "<strong>{note.title}</strong>" không? 
            Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Hủy
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NoteCard;