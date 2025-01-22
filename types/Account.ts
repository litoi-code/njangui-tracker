
import { AccountType } from '../models/Loan';

export interface Account {
    _id: string;
    accountType: AccountType;
    type: AccountType;
    balance: number;
    name: string;
}