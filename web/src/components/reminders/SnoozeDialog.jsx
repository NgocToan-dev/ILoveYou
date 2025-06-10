import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Box,
  Typography,
  Chip
} from '@mui/material';
import { Schedule, AccessTime } from '@mui/icons-material';
import { SNOOZE_DURATION } from '../../../../shared/constants/notifications';

const SnoozeDialog = ({ open, onClose, onSnooze, reminderTitle }) => {
  const [selectedDuration, setSelectedDuration] = useState(SNOOZE_DURATION.DEFAULT.toString());
  const [customMinutes, setCustomMinutes] = useState('');

  const predefinedOptions = [
    ...SNOOZE_DURATION.PRESETS.map(preset => ({
      value: preset.value.toString(),
      label: preset.label,
      description: preset.description
    })),
    { value: 'custom', label: 'Tùy chỉnh', description: 'Chọn thời gian khác' }
  ];

  const handleSnooze = () => {
    let duration;
    
    if (selectedDuration === 'custom') {
      duration = parseInt(customMinutes) || SNOOZE_DURATION.DEFAULT;
    } else {
      duration = parseInt(selectedDuration);
    }

    // Validate duration using centralized constants
    if (duration < SNOOZE_DURATION.MIN || duration > SNOOZE_DURATION.MAX) {
      alert(`Thời gian hoãn phải từ ${SNOOZE_DURATION.MIN} phút đến ${SNOOZE_DURATION.MAX} phút (24 giờ)`);
      return;
    }

    onSnooze(duration);
    onClose();
  };

  const getSnoozeTime = () => {
    let duration;
    if (selectedDuration === 'custom') {
      duration = parseInt(customMinutes) || SNOOZE_DURATION.DEFAULT;
    } else {
      duration = parseInt(selectedDuration);
    }

    const snoozeTime = new Date(Date.now() + duration * 60 * 1000);
    return snoozeTime.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour12: false
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Schedule color="primary" />
        Hoãn nhắc nhở
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Hoãn nhắc nhở "<strong>{reminderTitle}</strong>" đến khi nào?
        </Typography>

        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend" sx={{ mb: 2 }}>
            Chọn thời gian hoãn:
          </FormLabel>
          
          <RadioGroup
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(e.target.value)}
          >
            {predefinedOptions.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">{option.label}</Typography>
                    <Chip 
                      label={option.description} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                }
                sx={{ mb: 1 }}
              />
            ))}
          </RadioGroup>

          {selectedDuration === 'custom' && (
            <Box sx={{ mt: 2, ml: 4 }}>
              <TextField
                label="Số phút"
                type="number"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                inputProps={{ min: SNOOZE_DURATION.MIN, max: SNOOZE_DURATION.MAX }}
                size="small"
                helperText={`Từ ${SNOOZE_DURATION.MIN} phút đến ${SNOOZE_DURATION.MAX} phút (24 giờ)`}
              />
            </Box>
          )}
        </FormControl>

        <Box sx={{ 
          mt: 3, 
          p: 2, 
          bgcolor: 'primary.light', 
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <AccessTime sx={{ color: 'primary.main' }} />
          <Typography variant="body2" color="primary.main">
            <strong>Sẽ nhắc lại vào:</strong> {getSnoozeTime()}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Hủy
        </Button>
        <Button 
          onClick={handleSnooze} 
          variant="contained"
          startIcon={<Schedule />}
        >
          Hoãn nhắc nhở
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SnoozeDialog; 