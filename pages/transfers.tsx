import React, { useState, useEffect } from 'react';
import Layout from '../components/layout';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { format, isValid } from 'date-fns';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DatePicker from '../components/DatePicker';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';

interface Account {
    _id: string;
    name: string;
    balance: number;
    accountType: 'checking' | 'savings' | 'investment';
}

interface Transfer {
    _id: string;
    sourceAccountId: Account;
    recipientAccounts: {
        accountId: Account;
        amount: number;
    }[];
    transferDate: Date;
    status: string;
}


const Transfers: React.FC = () => {
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
      const [sourceAccounts, setSourceAccounts] = useState<Account[]>([]);
    const [sourceAccount, setSourceAccount] = useState<Account | null>(null);
      const [transferDate, setTransferDate] = useState<Date | null>(new Date());
     const [openDialog, setOpenDialog] = useState(false);
    const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth() - 1 , new Date().getDay()));
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [selectedAccount, setSelectedAccount] = useState<string>("");
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
    const [recipientAmounts, setRecipientAmounts] = useState<{ [accountId: string]: number }>({});
    const [selectedRecipient, setSelectedRecipient] = useState<Account[]>([]);


  useEffect(() => {
    fetchAccounts();
    fetchSourceAccounts();
    fetchTransfers();
  }, [startDate, endDate, selectedAccount]);

    const handleOpenDialog = () => {
        setSourceAccount(null);
        setRecipientAmounts({});
        setOpenDialog(true);
        setSelectedRecipient([]);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

  const fetchSourceAccounts = async () => {
        try {
          const response = await fetch(`/api/accounts/list?accountType=checking`);
            if(response.ok) {
                  const data = await response.json()
                  setSourceAccounts(data)
            }else{
                  console.error("Failed to fetch source accounts")
            }
        } catch(error){
              console.error("Error fetching source accounts:", error)
        }
    }

  const fetchAccounts = async () => {
      try {
            const response = await fetch(`/api/accounts/list`);
           if (response.ok) {
             const data = await response.json();
             setAccounts(data);
            } else {
           console.error('Failed to fetch accounts');
          }
      } catch (error) {
           console.error('Error fetching accounts:', error);
    }
  };


    const fetchTransfers = async () => {
        try {
            const startFormatted = format(startDate, "yyyy-MM-dd");
            const endFormatted = format(endDate, "yyyy-MM-dd");
            const response = await fetch(`/api/transfers/get?startDate=${startFormatted}&endDate=${endFormatted}&accountId=${selectedAccount}`);

            if (response.ok) {
                const data = await response.json();
                setTransfers(data);
            } else {
                console.error('Failed to fetch transfers');
            }
        } catch (error) {
            console.error('Error fetching transfers:', error);
        }
    };

    const handleCreateTransfer = async () => {
        if (!sourceAccount) {
            setSnackbarMessage('Source account is required');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }

        const recipientAccounts = Object.keys(recipientAmounts)
            .filter(accountId => recipientAmounts[accountId] > 0)
            .map(accountId => {
                return { accountId, amount: recipientAmounts[accountId] };
            });

        if (recipientAccounts.length === 0) {
            setSnackbarMessage('Recipient accounts are required');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }
        if (!transferDate) {
            setSnackbarMessage('Transfer date is required');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }

        if (!isValid(transferDate)) {
            setSnackbarMessage('Invalid transfer date');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }

        try {
            const response = await fetch('/api/transfers/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceAccountId: sourceAccount?._id,
                    recipientAccounts: recipientAccounts.map(rec => ({ accountId: rec.accountId, amount: rec.amount })),
                    transferDate: format(transferDate, 'yyyy-MM-dd'),
                }),
            });

            if (response.ok) {
                setSnackbarMessage('Transfer created successfully');
                setSnackbarSeverity('success');
                setOpenDialog(false);
                fetchTransfers();
            } else {
                const errorData = await response.json();
                setSnackbarMessage(errorData.error || 'Failed to create transfer');
                setSnackbarSeverity('error');
            }

            setSnackbarOpen(true);

        } catch (error) {
            console.error('Error creating transfer:', error);
            setSnackbarMessage('Error creating transfer');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };


    const handleAmountChange = (accountId: string, amount: number) => {
        setRecipientAmounts(prev => ({ ...prev, [accountId]: amount }));
    };

  return (
    <Layout>
      <h1>Transfer Management</h1>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(date) => {
                if (date) {
                    setStartDate(date)
                }
              }}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(date) => {
                  if(date){
                      setEndDate(date);
                  }
              }}
            />
          </div>
            <div>
              <label htmlFor="account">Select Account:</label>
                <select
                  id="account"
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                >
                  <option value="">All Accounts</option>
                     {sourceAccounts.map((item) => (
                    <option key={item._id} value={item._id}>
                        {item.name}
                    </option>
                    ))}
                </select>
            </div>
        </div>
      <Button variant="contained" color="primary" onClick={handleOpenDialog} style={{ marginBottom: 20 }}>
        Create Transfer
      </Button>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="transfers table">
          <TableHead>
            <TableRow>
              <TableCell>Source Account</TableCell>
                <TableCell>Recipients</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transfers.map((transfer) => (
              <TableRow
                key={transfer._id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell>{transfer.sourceAccountId?.name}</TableCell>
                  <TableCell>
                      {transfer.recipientAccounts.map((recipient, index) => (
                          <div key={index}>
                              {recipient.accountId?.name}: {recipient.amount}
                          </div>
                      ))}
                    </TableCell>
                    <TableCell>{format(new Date(transfer.transferDate), 'yyyy-MM-dd')}</TableCell>
                <TableCell>{transfer.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
        <Dialog open={openDialog} onClose={handleCloseDialog}>
            <DialogTitle>Create Transfer</DialogTitle>
            <DialogContent>
                <FormControl fullWidth margin="dense">
                    <label htmlFor="sourceAccount">Source Account</label>
                    <select
                        id="sourceAccount"
                        value={sourceAccount?._id || ""}
                        onChange={(e) => setSourceAccount(sourceAccounts.find(acc => acc._id === e.target.value) || null)}
                    >
                        <option value="">Select Source Account</option>
                        {sourceAccounts.map((account) => (
                            <option key={account._id} value={account._id}>
                                {account.name} - Balance: {account.balance}
                            </option>
                        ))}
                    </select>
                </FormControl>
                <DatePicker
                    label="Transfer Date"
                    value={transferDate}
                    onChange={(date) => {
                        if (date) {
                            setTransferDate(date);
                        }
                    }}
               />
                <div style={{ marginTop: 15}}>
                    <h3>Add Recipient Account</h3>
                    <h4>Savings</h4>
                    {accounts.filter(account => account.accountType === 'savings').map((account) => (
                        <div key={account._id} style={{display: "flex", alignItems: "center", gap: 10}}>
                            <FormControlLabel
                                control={<input type="checkbox" value={account._id} onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedRecipient(prev => [...prev, account]);
                                    } else {
                                        setSelectedRecipient(prev => prev.filter(r => r._id === account._id));
                                    }
                                }} />}
                                label={`${account.name} - Balance: ${account.balance}`}
                            />
                            <TextField
                                label="Amount"
                                type="number"
                                value={recipientAmounts[account._id] || ""}
                                onChange={(e) => handleAmountChange(account._id, Number(e.target.value))}
                                margin="dense"
                            />
                        </div>
                    ))}
                    <h4>Investment</h4>
                    {accounts.filter(account => account.accountType === 'investment').map((account) => (
                        <div key={account._id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <FormControlLabel
                                control={<input type="checkbox" value={account._id} onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedRecipient(prev => [...prev, account]);
                                    } else {
                                        setSelectedRecipient(prev => prev.filter(r => r._id === account._id));
                                    }
                                }} />}
                                label={`${account.name} - Balance: ${account.balance}`}
                            />
                            <TextField
                                label="Amount"
                                type="number"
                                value={recipientAmounts[account._id] || ""}
                                onChange={(e) => handleAmountChange(account._id, Number(e.target.value))}
                                margin="dense"
                            />
                        </div>
                    ))}
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseDialog} color="primary">
                    Cancel
                </Button>
                <Button onClick={handleCreateTransfer} color="primary">
                    Create Transfer
                </Button>
            </DialogActions>
        </Dialog>
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
            <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                {snackbarMessage}
            </Alert>
        </Snackbar>
    </Layout>
  );
};

export default Transfers;
