import React from 'react';
import DatePicker from '../../components/DatePicker';

const TransfersPage = () => {
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(new Date());

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
  };

  return (
    <div>
      <h1>Transfers</h1>
      <DatePicker
        label="Select Date"
        value={selectedDate}
        onChange={handleDateChange}
      />
    </div>
  );
};

export default TransfersPage;