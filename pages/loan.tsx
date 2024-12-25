import { useState, useEffect } from 'react';
import styles from './loan.module.css';
import DatePicker from '../components/DatePicker'; // Import DatePicker component
import ConfirmDialog from '../components/ConfirmDialog'; // Import ConfirmDialog component
import Layout from '../components/Layout'; // Import Layout component

export default function LoanPage() {
    const [principal, setPrincipal] = useState(0);
    const [interestRate, setInterestRate] = useState(0);
    const [term, setTerm] = useState(0);
    const [schedule, setSchedule] = useState<any[]>([]);
    const [sourceAccount, setSourceAccount] = useState('');
    const [recipientAccount, setRecipientAccount] = useState('');
    const [investmentAccounts, setInvestmentAccounts] = useState<{ _id: string, name: string }[]>([]);
    const [checkingAccounts, setCheckingAccounts] = useState<{ _id: string, name: string }[]>([]);
    const [loanDate, setLoanDate] = useState<Date | null>(null); // Add state for loan date
    const [confirmOpen, setConfirmOpen] = useState(false); // Add state for confirm dialog

    useEffect(() => {
        // Fetch investment accounts
        const fetchInvestmentAccounts = async () => {
            const response = await fetch('/api/accounts/list?accountType=investment');
            const data = await response.json();
            setInvestmentAccounts(data);
        };

        // Fetch checking accounts
        const fetchCheckingAccounts = async () => {
            const response = await fetch('/api/accounts/list?accountType=checking');
            const data = await response.json();
            setCheckingAccounts(data);
        };

        fetchInvestmentAccounts();
        fetchCheckingAccounts();
    }, []);

    const createLoan = async () => {
        const response = await fetch('/api/transfers/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sourceAccountId: sourceAccount,
                recipientAccounts: [{ accountId: recipientAccount, amount: principal }],
                transferDate: loanDate,
                interestRate,
                term,
                type: 'loan' // Indicate that this transfer is a loan
            })
        });
        const data = await response.json();
        console.log(data.loan);
    };

    const getRepaymentSchedule = async () => {
        const response = await fetch('/api/account?action=getRepaymentSchedule');
        const data = await response.json();
        setSchedule(data.schedule);
    };

    const earlyRepayment = async (amount: number) => {
        const response = await fetch('/api/account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'earlyRepayment', amount, sourceAccount, recipientAccount })
        });
        const data = await response.json();
        console.log(data);
        recalculateSchedule(data.newBalance);
    };

    const recalculateSchedule = async (newBalance: number) => {
        const response = await fetch('/api/account?action=recalculateSchedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newBalance, interestRate, term })
        });
        const data = await response.json();
        setSchedule(data.schedule);
    };

    const handleConfirm = () => {
        setConfirmOpen(true);
    };

    const handleConfirmClose = () => {
        setConfirmOpen(false);
    };

    const handleConfirmAccept = () => {
        setConfirmOpen(false);
        createLoan();
    };

    return (
        <Layout>
            <div className={styles.container}>
                <h1>Loan Management</h1>
                <div className={styles.inputGroup}>
                    <label>Principal: </label>
                    <input type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} />
                </div>
                <div className={styles.inputGroup}>
                    <label>Interest Rate: </label>
                    <input type="number" value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))} />
                </div>
                <div className={styles.inputGroup}>
                    <label>Term (months): </label>
                    <input type="number" value={term} onChange={(e) => setTerm(Number(e.target.value))} />
                </div>
                <div className={styles.inputGroup}>
                    <label>Source Account: </label>
                    <select value={sourceAccount} onChange={(e) => setSourceAccount(e.target.value)}>
                        <option value="">Select Investment Account</option>
                        {investmentAccounts.map((account, index) => (
                            <option key={index} value={account._id}>{account.name}</option>
                        ))}
                    </select>
                </div>
                <div className={styles.inputGroup}>
                    <label>Recipient Account: </label>
                    <select value={recipientAccount} onChange={(e) => setRecipientAccount(e.target.value)}>
                        <option value="">Select Checking Account</option>
                        {checkingAccounts.map((account, index) => (
                            <option key={index} value={account._id}>{account.name}</option>
                        ))}
                    </select>
                </div>
                <div className={styles.inputGroup}>
                    <label>Loan Date: </label>
                    <DatePicker value={loanDate} onChange={setLoanDate} label="Select Loan Date" />
                </div>
                <div className={styles.inputGroup}>
                    <label>Early Repayment Amount: </label>
                    <input type="number" onChange={(e) => earlyRepayment(Number(e.target.value))} />
                </div>
                <button className={styles.button} onClick={handleConfirm}>Create Loan</button>
                <button className={styles.button} onClick={getRepaymentSchedule}>Get Repayment Schedule</button>
                {schedule && (
                    <div className={styles.schedule}>
                        <h2>Repayment Schedule</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Month</th>
                                    <th>Principal</th>
                                    <th>Interest</th>
                                    <th>Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedule.map((payment, index) => (
                                    <tr key={index}>
                                        <td>{payment.month}</td>
                                        <td>{payment.principal.toFixed(2)}</td>
                                        <td>{payment.interest.toFixed(2)}</td>
                                        <td>{payment.balance.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <ConfirmDialog
                    open={confirmOpen}
                    onClose={handleConfirmClose}
                    onConfirm={handleConfirmAccept}
                    message="Are you sure you want to create this loan?"
                />
            </div>
        </Layout>
    );
}
