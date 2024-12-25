import React, { ReactNode } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            <Link href="/" style={{ textDecoration: 'none', color: 'white' }}>
              Fund Transfer Tracking
            </Link>
          </Typography>
          <Button color="inherit" component={Link} href="/accounts">
              Accounts
          </Button>
          <Button color="inherit" component={Link} href="/transfers">
             Transfers
          </Button>
        </Toolbar>
      </AppBar>
      <Container style={{ marginTop: 20, paddingBottom: 20 }}>
        {children}
      </Container>
    </>
  );
};

export default Layout;