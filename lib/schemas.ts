import mongoose, { Schema } from 'mongoose';

const accountSchema = new Schema({
  name: { type: String, required: true },
  balance: { type: Number, default: 0 },
  accountType: {
    type: String,
    enum: ['checking', 'savings', 'investment'],
    default: 'checking',
  },
});

const transferSchema = new Schema({
    sourceAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    recipientAccounts: [{
        accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
        amount: { type: Number, required: true },
    }],
    transferDate: { type: Date, required: true },
    status: { type: String, default: 'completed' }, // or pending
    description: { type: String }
});


const Account = mongoose.models.Account || mongoose.model('Account', accountSchema);
const Transfer = mongoose.models.Transfer || mongoose.model('Transfer', transferSchema);

export { Account, Transfer };
