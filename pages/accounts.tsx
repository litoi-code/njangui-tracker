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
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import ConfirmDialog from '../components/ConfirmDialog';

interface Account {
    _id: string;
    name: string;
    balance: number;
    accountType: 'checking' | 'savings' | 'investment';
}

const Accounts: React.FC = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountType, setNewAccountType] = useState<'checking' | 'savings' | 'investment'>('checking');
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [confirmDialogMessage, setConfirmDialogMessage] = useState('');
    const [confirmDialogAction, setConfirmDialogAction] = useState<string | null>(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
    const [filterAccountType, setFilterAccountType] = useState<string>('');
    const [filterAccountName, setFilterAccountName] = useState<string>('');


    useEffect(() => {
        fetchAccounts();
    }, [filterAccountType, filterAccountName]);

    const handleOpenDialog = (account: Account | null = null) => {
        setNewAccountName(account?.name || "");
        setNewAccountType(account?.accountType || 'checking');
        setSelectedAccount(account);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedAccount(null);
    };

    const handleOpenConfirmDialog = (action: string, account: Account) => {
        setConfirmDialogMessage(`Are you sure you want to ${action} account ${account.name}?`)
        setConfirmDialogAction(action);
        setSelectedAccount(account);
        setOpenConfirmDialog(true)
    }

    const handleCloseConfirmDialog = () => {
        setOpenConfirmDialog(false);
        setSelectedAccount(null);
        setConfirmDialogAction(null);
        setConfirmDialogMessage("");
    }

    const handleConfirmAction = async () => {
        if (selectedAccount && confirmDialogAction) {
            try {
                switch (confirmDialogAction) {
                    case 'delete':
                        await handleDeleteAccount(selectedAccount._id)
                        break;
                    case 'reset':
                        await handleResetAccount(selectedAccount._id)
                        break;
                    default:
                        setSnackbarMessage('Invalid action')
                        setSnackbarSeverity('error')
                        setSnackbarOpen(true);
                        break;
                }
            } catch (error) {
                setSnackbarMessage('There was an error')
                setSnackbarSeverity('error')
                setSnackbarOpen(true);
                console.error(error)
            }
        }
        handleCloseConfirmDialog();
    }

    const fetchAccounts = async () => {
        try {
            let url = '/api/accounts/list';
            const params = new URLSearchParams();
              if(filterAccountType){
                   params.append('accountType', filterAccountType)
             }
             if(filterAccountName){
                 params.append('name', filterAccountName)
             }

            const queryString = params.toString()
            if(queryString) {
                  url += `?${queryString}`;
             }
            const response = await fetch(url);
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

    const handleCreateAccount = async () => {
       try {
            const response = await fetch('/api/accounts/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newAccountName, accountType: newAccountType }),
            });

            if (response.ok) {
                setSnackbarMessage('Account created successfully');
                setSnackbarSeverity('success');
                setOpenDialog(false);
                setNewAccountName('');
                fetchAccounts();
            } else {
                setSnackbarMessage('Failed to create account');
                setSnackbarSeverity('error');
            }

            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error creating account:', error);
            setSnackbarMessage('Error creating account');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };


    const handleUpdateAccount = async () => {
        if (!selectedAccount) {
            return;
        }
        try {
            const response = await fetch('/api/accounts/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedAccount._id, name: newAccountName, accountType: newAccountType }),
            });

            if (response.ok) {
                setSnackbarMessage('Account updated successfully');
                setSnackbarSeverity('success');
                setOpenDialog(false);
                setSelectedAccount(null);
                fetchAccounts();
            } else {
                const errorData = await response.json();
                setSnackbarMessage(errorData.error || "Failed to update account");
                setSnackbarSeverity('error');
            }

            setSnackbarOpen(true);
        } catch (error) {
            console.error('Failed to update account', error);
            setSnackbarMessage('Error updating account');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };
    const handleDeleteAccount = async (id: string) => {
        try {
            const response = await fetch(`/api/accounts/delete?id=${id}`, {
                method: 'DELETE',
            })
            if (response.ok) {
                setSnackbarMessage('Account deleted successfully')
                setSnackbarSeverity('success')
                fetchAccounts();
            } else {
                const errorData = await response.json();
                setSnackbarMessage(errorData.error || "Failed to delete account");
                setSnackbarSeverity('error')
            }

            setSnackbarOpen(true)
        } catch (error) {
            console.error('Failed to delete account', error);
            setSnackbarMessage('Error deleting account');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    }

    const handleResetAccount = async (id: string) => {
        try {
            const response = await fetch('/api/accounts/reset', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            })
            if (response.ok) {
                setSnackbarMessage('Account reset successfully')
                setSnackbarSeverity('success')
                fetchAccounts();
            } else {
                const errorData = await response.json();
                setSnackbarMessage(errorData.error || "Failed to reset account");
                setSnackbarSeverity('error')
            }

            setSnackbarOpen(true)
        } catch (error) {
            console.error('Failed to reset account', error);
            setSnackbarMessage('Error resetting account balance');
            setSnackbarSeverity('error')
            setSnackbarOpen(true);
        }
    }

    const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }

        setSnackbarOpen(false);
    };


    return (
        <Layout>
            <h1 style={{ fontSize: '2rem' }}>Account Management</h1> {/* Increased font size */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
                    Add Account
                </Button>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <TextField
                       label="Filter by Name"
                         value={filterAccountName}
                       onChange={(e) => setFilterAccountName(e.target.value)}
                    />
                     <FormControl>
                        <InputLabel id="account-type-filter-label">Filter by Type</InputLabel>
                        <Select
                            labelId="account-type-filter-label"
                             id="account-type-filter"
                            value={filterAccountType}
                            label="Filter by Type"
                            onChange={(e) => setFilterAccountType(e.target.value as string)}
                        >
                           <MenuItem value="">All</MenuItem>
                            <MenuItem value="checking">Checking</MenuItem>
                            <MenuItem value="savings">Savings</MenuItem>
                           <MenuItem value="investment">Investment</MenuItem>
                      </Select>
                   </FormControl>
                </div>
            </div>
            <p>Total Accounts: {accounts.length}</p>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="accounts table">
                    <TableHead>
                        <TableRow>
                            <TableCell style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Name</TableCell> {/* Increased font size and bold */}
                            <TableCell style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Balance</TableCell> {/* Increased font size and bold */}
                            <TableCell style={{ fontSize: '1.2rem' }}>Account Type</TableCell> {/* Increased font size */}
                            <TableCell style={{ fontSize: '1.2rem' }}>Actions</TableCell> {/* Increased font size */}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {accounts.map((account) => (
                            <TableRow
                                key={account._id}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 }, backgroundColor: account.balance >= 0 ? 'lightgreen' : 'lightcoral' }}
                            >
                                <TableCell component="th" scope="row" style={{ fontWeight: 'bold' }}>
                                    {account.name} {/* Bold */}
                                </TableCell>
                                <TableCell style={{ fontWeight: 'bold' }}>
                                    {account.balance} {/* Bold */}
                                </TableCell>
                                <TableCell>{account.accountType}</TableCell>
                                <TableCell>
                                    <IconButton aria-label="edit" onClick={() => handleOpenDialog(account)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton aria-label="delete" onClick={() => handleOpenConfirmDialog('delete', account)}>
                                        <DeleteIcon />
                                    </IconButton>
                                    <IconButton aria-label="reset" onClick={() => handleOpenConfirmDialog('reset', account)}>
                                        <RefreshIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {/* <p>Total Accounts: {accounts.length}</p> */}
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>{selectedAccount ? 'Edit Account' : 'Add New Account'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="name"
                        label="Account Name"
                        type="text"
                        fullWidth
                        value={newAccountName}
                        onChange={(e) => setNewAccountName(e.target.value)}
                    />
                    <FormControl fullWidth margin="dense">
                        <InputLabel id="account-type-label">Account Type</InputLabel>
                        <Select
                            labelId="account-type-label"
                            id="account-type"
                            value={newAccountType}
                            label="Account Type"
                            onChange={(e) => setNewAccountType(e.target.value as 'checking' | 'savings' | 'investment')}
                        >
                            <MenuItem value="checking">Checking</MenuItem>
                            <MenuItem value="savings">Savings</MenuItem>
                            <MenuItem value="investment">Investment</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={selectedAccount ? handleUpdateAccount : handleCreateAccount} color="primary">
                        {selectedAccount ? 'Update Account' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>
            <ConfirmDialog
                open={openConfirmDialog}
                onClose={handleCloseConfirmDialog}
                onConfirm={handleConfirmAction}
                message={confirmDialogMessage}
            />
            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Layout>
    );
};

export default Accounts;