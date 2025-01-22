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
import Widget from '../components/Widget'; // Import the Widget component

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
    type: string; // Add type field to distinguish between transfer and loan
    description?: string;
}

const Transfers: React.FC = () => {
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const transferCount = transfers.length;
    const [recipientTotals, setRecipientTotals] = useState<{ [accountId: string]: number }>({});
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [sourceAccounts, setSourceAccounts] = useState<Account[]>([]);
    const [sourceAccount, setSourceAccount] = useState<Account | null>(null);
    const [transferDate, setTransferDate] = useState<Date | null>(new Date());
    const [openDialog, setOpenDialog] = useState(false);
    const [startDate, setStartDate] = useState<Date>(() => {
        const date = new Date();
        // Set to first day of current month
        return new Date(date.getFullYear(), date.getMonth(), 1);
    });
    const [endDate, setEndDate] = useState<Date>(() => {
        const date = new Date();
        // Set to current date
        return date;
    });
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
        const preselectedRecipients = accounts.filter((account, index) => 
            (account.accountType === 'savings' && index < 3) || 
            (account.accountType === 'investment' && index === 0)
        );
        setSelectedRecipient(preselectedRecipients);
        const defaultAmounts: { [accountId: string]: number } = {};
        if (preselectedRecipients[1] && preselectedRecipients[1].accountType === 'savings') {
            defaultAmounts[preselectedRecipients[1]._id] = 3500;
        }
        setRecipientAmounts(defaultAmounts);
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
            // Validate dates
            if (startDate > endDate) {
                console.error('Start date cannot be after end date');
                return;
            }

            if (startDate > new Date() || endDate > new Date()) {
                console.error('Cannot fetch transfers from future dates');
                return;
            }

            const startFormatted = format(startDate, "yyyy-MM-dd");
            const endFormatted = format(endDate, "yyyy-MM-dd");
            const accountQuery = selectedAccount ? `&accountId=${selectedAccount}` : '';
            const url = `/api/transfers/get?startDate=${startFormatted}&endDate=${endFormatted}${accountQuery}`;
            
            console.log('Fetching transfers with URL:', url);
            const response = await fetch(url);
            const responseText = await response.text();
            
            console.log('API Response:', responseText);
            
            if (response.ok) {
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (e) {
                    console.error('Failed to parse JSON:', e);
                    return;
                }

                console.log('Parsed transfers data:', data);

                if (!Array.isArray(data)) {
                    console.error('Expected array of transfers but got:', typeof data);
                    return;
                }

                const formattedData = data.map((transfer: Transfer) => ({
                    ...transfer,
                    transferDate: new Date(transfer.transferDate),
                    sourceAccountId: transfer.sourceAccountId || { 
                        _id: '', 
                        name: 'Unknown', 
                        balance: 0, 
                        accountType: 'checking' 
                    },
                    recipientAccounts: Array.isArray(transfer.recipientAccounts) 
                        ? transfer.recipientAccounts.map(recipient => ({
                            accountId: recipient.accountId || { 
                                _id: '', 
                                name: 'Unknown', 
                                balance: 0, 
                                accountType: 'checking' 
                            },
                            amount: recipient.amount
                        }))
                        : []
                }));

                console.log('Formatted transfers data:', formattedData);
                setTransfers(formattedData);

                // Calculate totals
                const totals: { [accountId: string]: number } = {};
                formattedData.forEach(transfer => {
                    transfer.recipientAccounts.forEach(recipient => {
                        const accountId = recipient.accountId._id;
                        totals[accountId] = (totals[accountId] || 0) + recipient.amount;
                    });
                });
                setRecipientTotals(totals);
            } else {
                console.error('Failed to fetch transfers:', response.status, responseText);
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
                    description: (document.getElementById('transfer-description') as HTMLInputElement).value,
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

    const handleDeleteTransfer = async (transferId: string) => {
        try {
            const response = await fetch(`/api/transfers/delete?transferId=${transferId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setTransfers(transfers.filter(transfer => transfer._id !== transferId));
                fetchAccounts(); // Refresh account balances
                setSnackbarMessage('Transfer deleted successfully');
                setSnackbarSeverity('success');
            } else {
                const errorData = await response.json();
                setSnackbarMessage(errorData.message || 'Failed to delete transfer');
                setSnackbarSeverity('error');
            }
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error deleting transfer:', error);
            setSnackbarMessage('Error deleting transfer');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleAmountChange = (accountId: string, amount: number) => {
        setRecipientAmounts(prev => ({ ...prev, [accountId]: amount }));
    };

    const tableStyles = {
        tableContainer: {
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            overflow: 'hidden',
            marginTop: '20px',
        },
        tableHeader: {
            backgroundColor: '#f5f5f5',
            '& th': {
                fontWeight: 'bold',
                color: '#333',
                fontSize: '0.95rem',
            },
        },
        tableRow: {
            '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
        },
    };

    const controlStyles = {
        controlPanel: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            padding: '20px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            marginBottom: '20px',
        },
        datePickers: {
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            '@media (max-width: 600px)': {
                flexDirection: 'column',
                width: '100%',
            },
        },
        accountSelect: {
            minWidth: '200px',
            '& select': {
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                backgroundColor: '#fff',
                '&:focus': {
                    outline: 'none',
                    borderColor: '#1976d2',
                },
            },
        },
    };

  return (
    <Layout>
      <div style={{ padding: '24px' }}>
        <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '24px',
            color: '#1976d2'
        }}>
            Gestion des transferts - Total: ({transferCount})
        </h1>

        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
        }}>
            {Object.entries(recipientTotals).map(([accountId, total]) => {
                const account = accounts.find(acc => acc._id === accountId);
                return account ? (
                    <div key={accountId} style={{
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        padding: '16px'
                    }}>
                        <Widget title={account.name} value={total} />
                    </div>
                ) : null;
            })}
        </div>

        <div style={controlStyles.controlPanel}>
            <Button 
                variant="contained" 
                color="primary" 
                onClick={handleOpenDialog}
                sx={{
                    fontWeight: 'bold',
                    textTransform: 'none',
                    padding: '10px 24px',
                }}
            >
                Nouveau Transfert
            </Button>

            <div style={controlStyles.datePickers}>
                <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(date) => date && setStartDate(date)}
                    sx={{ backgroundColor: '#fff' }}
                />
                <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(date) => date && setEndDate(date)}
                    sx={{ backgroundColor: '#fff' }}
                />
            </div>

            <div style={controlStyles.accountSelect}>
                <label htmlFor="account" style={{ 
                    marginBottom: '8px', 
                    display: 'block', 
                    fontWeight: 'bold',
                    color: '#666' 
                }}>
                    Select Account:
                </label>
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

        <TableContainer component={Paper} sx={tableStyles.tableContainer}>
            <Table sx={{ minWidth: 650 }} aria-label="transfers table">
                <TableHead>
                    <TableRow sx={tableStyles.tableHeader}>
                        <TableCell>Source Account</TableCell>
                        <TableCell>Recipients</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Lieu</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Type</TableCell> {/* Add Type column */}
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {transfers.length > 0 ? (
                        transfers.map((transfer) => (
                            <TableRow
                                key={transfer._id}
                                sx={tableStyles.tableRow}
                            >
                                <TableCell>{transfer.sourceAccountId?.name || 'Unknown'}</TableCell>
                                <TableCell>
                                    {transfer.recipientAccounts.map((recipient, index) => (
                                        <div key={index}>
                                            {recipient.accountId?.name || 'Unknown'}: {recipient.amount}
                                        </div>
                                    ))}
                                </TableCell>
                                <TableCell>
                                    {transfer.transferDate ? format(new Date(transfer.transferDate), 'yyyy-MM-dd') : 'N/A'}
                                </TableCell>
                                <TableCell>{transfer.description || 'N/A'}</TableCell>
                                <TableCell>{transfer.status || 'N/A'}</TableCell>
                                <TableCell>{transfer.type || 'N/A'}</TableCell>
                                <TableCell>
                                    <IconButton aria-label="delete" size="large" onClick={() => handleDeleteTransfer(transfer._id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell 
                                colSpan={7} 
                                align="center"
                                sx={{ 
                                    padding: '32px',
                                    color: '#666',
                                    fontSize: '1.1rem'
                                }}
                            >
                                No transfers found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>

        <Dialog 
            open={openDialog} 
            onClose={handleCloseDialog}
            PaperProps={{
                sx: {
                    borderRadius: '8px',
                    maxWidth: '600px',
                    width: '100%',
                }
            }}
        >
            <DialogTitle>Nouveau Transfert - Total: {Object.values(recipientAmounts).reduce((sum, amount) => sum + amount, 0)}</DialogTitle>
            <DialogContent>
                <FormControl fullWidth margin="dense" style={{ marginBottom: 20 }}>
                    <label htmlFor="sourceAccount" style={{ marginBottom: 5, display: 'block', fontWeight: 'bold' }}>Source Account</label>
                    <select
                        id="sourceAccount"
                        value={sourceAccount?._id || ""}
                        onChange={(e) => setSourceAccount(sourceAccounts.find(acc => acc._id === e.target.value) || null)}
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
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
                <TextField
                    label="Lieu"
                    multiline
                    rows={2}
                    margin="dense"
                    fullWidth
                    id="transfer-description"
                />
                <div style={{ marginTop: 15 }}>
                    <h4>Savings</h4>
                    {accounts.filter(account => account.accountType === 'savings').map((account) => (
                        <div key={account._id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <FormControlLabel
                                control={<input type="checkbox" value={account._id} checked={selectedRecipient.some(r => r._id === account._id)} onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedRecipient(prev => [...prev, account]);
                                    } else {
                                        setSelectedRecipient(prev => prev.filter(r => r._id !== account._id));
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
                                control={<input type="checkbox" value={account._id} checked={selectedRecipient.some(r => r._id === account._id)} onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedRecipient(prev => [...prev, account]);
                                    } else {
                                        setSelectedRecipient(prev => prev.filter(r => r._id !== account._id));
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
                    Annuler
                </Button>
                <Button onClick={handleCreateTransfer} color="primary">
                    Soumettre
                </Button>
            </DialogActions>
        </Dialog>
        <Snackbar 
            open={snackbarOpen} 
            autoHideDuration={6000} 
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
            <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                {snackbarMessage}
            </Alert>
        </Snackbar>
    </div>
    </Layout>
  );
};

export default Transfers;
