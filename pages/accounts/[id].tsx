import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout';
import { 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  CircularProgress, 
  Alert, 
  Box,
  Chip,
  Button
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface Account {
  id: string;
  name: string;
  balance: number;
  accountType?: 'checking' | 'savings' | 'investment';
  // Add other account properties here
}

interface Transfer {
  id: string;
  amount: number;
  sourceAccountId: { name: string };
  recipientAccounts: [{ accountId: { name: string } }];
  transferDate: string;
}

const AccountDetailsPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incomingTransfers, setIncomingTransfers] = useState<Transfer[]>([]);
  const [outgoingTransfers, setOutgoingTransfers] = useState<Transfer[]>([]);

  useEffect(() => {
    if (id) {
      const fetchAccountDetails = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/accounts/get?id=${id}`);
          if (!response.ok) {
            const message = `Error: ${response.status}`;
            throw new Error(message);
          }
          const data: Account = await response.json();
          setAccount(data);
          await fetchIncomingTransfers(data.id);
          await fetchOutgoingTransfers(data.id);
        } catch (error: any) {
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };

      const fetchIncomingTransfers = async (accountId: string) => {
        try {
          const response = await fetch(`/api/transfers/list?accountId=${accountId}&transferType=in`);
          if (!response.ok) {
            const message = `Error: ${response.status}`;
            throw new Error(message);
          }
          const data: Transfer[] = await response.json();
          setIncomingTransfers(data);
        } catch (error: any) {
          console.error("Error fetching incoming transfers:", error);
        }
      };

      const fetchOutgoingTransfers = async (accountId: string) => {
        try {
          const response = await fetch(`/api/transfers/list?accountId=${accountId}&transferType=out`);
          if (!response.ok) {
            const message = `Error: ${response.status}`;
            throw new Error(message);
          }
          const data: Transfer[] = await response.json();
          setOutgoingTransfers(data);
        } catch (error: any) {
          console.error("Error fetching outgoing transfers:", error);
        }
      };

      fetchAccountDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          height="100vh"
        >
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Container maxWidth="sm">
          <Alert severity="error">{error}</Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="md">
        <Paper 
          elevation={3} 
          sx={{ 
            padding: 4, 
            marginTop: 4, 
            backgroundColor: account && account.balance >= 0 ? '#e6f3e6' : '#f3e6e6' 
          }}
        >
          <Typography variant="h4" gutterBottom>
            Account Details
          </Typography>
          {account ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6">
                  Account Name: 
                  <Chip 
                    label={account.name} 
                    color="primary" 
                    sx={{ marginLeft: 2 }} 
                  />
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6">
                  Account Balance: 
                  <Chip 
                    label={`${account.balance.toFixed(0)} Fcfa`} 
                    color={account.balance >= 0 ? "success" : "error"} 
                    sx={{ marginLeft: 2 }} 
                  />
                </Typography>
              </Grid>
                {account.accountType && (
                <Grid item xs={12}>
                  <Typography variant="h6">
                  Account Type: 
                  <Chip 
                    label={account.accountType} 
                    color="secondary" 
                    sx={{ marginLeft: 2, textTransform: 'capitalize' }} 
                  />
                  </Typography>
                </Grid>
                )}
              </Grid>
              ) : (
              <Typography variant="body1">Loading account details...</Typography>
              )}
            
            <Box mt={4}>
              <Typography variant="h6" gutterBottom>Incoming Transfers</Typography>
              {incomingTransfers.length > 0 ? (
                <ul>
                  {incomingTransfers.map((transfer) => (
                    <li key={transfer.id}>
                      From: {transfer.sourceAccountId.name} - Amount: {transfer.amount}
                    </li>
                  ))}
                </ul>
              ) : (
                <Typography variant="body2">No incoming transfers found.</Typography>
              )}
            </Box>

            <Box mt={4}>
              <Typography variant="h6" gutterBottom>Outgoing Transfers</Typography>
              {outgoingTransfers.length > 0 ? (
                <ul>
                  {outgoingTransfers.map((transfer) => (
                    <li key={transfer.id}>
                      To: {transfer.recipientAccounts.map((ra) => ra.accountId?.name).join(', ')} - Amount: {transfer.amount}
                    </li>
                  ))}
                </ul>
              ) : (
                <Typography variant="body2">No outgoing transfers found.</Typography>
              )}
            </Box>
            <Box mt={4}>
              <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/accounts')}>
                Back to Accounts
              </Button>
            </Box>
          </Paper>
        </Container>
      </Layout>
    );
  };

  export default AccountDetailsPage;
