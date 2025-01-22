import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';

interface DatePickerProps {
  value: Date | null;
  onChange: (value: Date | null) => void;
  label: string;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, label }) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <MuiDatePicker
          label={label}
        value={value}
        onChange={(newValue) => {
          onChange(newValue);
        }}
          renderInput={(params) => <TextField {...params} />}
      />
    </LocalizationProvider>
  );
};

export default DatePicker;