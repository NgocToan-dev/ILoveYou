import React from 'react';
import { TextField } from '@mui/material';

const CustomTextField = ({ 
  shrinkLabel = true, 
  sx = {}, 
  InputLabelProps = {},
  ...props 
}) => {
  const defaultSx = {
    '& .MuiInputLabel-root': {
      backgroundColor: 'white',
      paddingLeft: '8px',
      paddingRight: '8px',
    },
    ...sx,
  };

  const defaultInputLabelProps = {
    shrink: shrinkLabel,
    ...InputLabelProps,
  };

  return (
    <TextField
      variant="outlined"
      margin="normal"
      fullWidth
      sx={defaultSx}
      InputLabelProps={defaultInputLabelProps}
      {...props}
    />
  );
};

export default CustomTextField; 