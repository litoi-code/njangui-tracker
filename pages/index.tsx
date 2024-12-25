import React, { useState, useEffect } from 'react';
import Layout from '../components/layout';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
    Tooltip,
    Legend,
} from 'chart.js';
import DatePicker from '../components/DatePicker';
import {format} from 'date-fns';

ChartJS.register(
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
);


interface MonthlyTotalData {
  month: string;
    transfers: {
        month: string,
        accountId: string,
        accountName: string,
        totalAmount: number
    }[]
}

const Dashboard: React.FC = () => {
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotalData[]>([]);
    const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth() - 6 , new Date().getDay()));
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [selectedAccount, setSelectedAccount] = useState<string>("");

  useEffect(() => {
    fetchMonthlyTotals();
  }, [startDate, endDate, selectedAccount]);

  const fetchMonthlyTotals = async () => {
      try {
        const startFormatted = format(startDate, "yyyy-MM-dd");
        const endFormatted = format(endDate, "yyyy-MM-dd")
      const response = await fetch(
        `/api/transfers/monthly-totals?startDate=${startFormatted}&endDate=${endFormatted}&accountId=${selectedAccount}`
      );
      if (response.ok) {
        const data = await response.json();
        setMonthlyTotals(data);
      } else {
        console.error('Failed to fetch monthly totals');
      }
    } catch (error) {
      console.error('Error fetching monthly totals:', error);
    }
  };
    const chartData = () => {
        const uniqueAccounts = new Set<string>();
        monthlyTotals?.forEach(monthly => {
          monthly?.transfers?.forEach(transf => uniqueAccounts.add(transf.accountName))
        });

        const datasets = Array.from(uniqueAccounts).map((accountName) => {
          const dataForAccount = monthlyTotals?.map(monthly => {
              const transfers = monthly.transfers.find(tran => tran.accountName === accountName);
             return transfers?.totalAmount || 0;
          })

          return {
            label: accountName,
            data: dataForAccount,
            borderColor: '#' + Math.floor(Math.random()*16777215).toString(16), //Random Color
            fill: false,
          };
        });

       return {
            labels: monthlyTotals?.map(monthly => monthly?.month || ""),
           datasets: datasets,
        }
    }
  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Monthly Transfer Totals',
        font: {
          size: 14, // Increased font size
        },
      },
      legend: {
        display: true,
        labels: {
          font: {
            size: 13, // Increased font size
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 12, // Increased font size
          },
        },
      },
      x: {
        ticks: {
          font: {
            size: 12, // Increased font size
          },
        },
      },
    },
  };

  return (
    <Layout>
        <h1 style={{ fontSize: '2rem' }}>Dashboard</h1> {/* Increased font size */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20}}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={(date) => {
                if (date) {
                  setStartDate(date);
                }
              }}
          />
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={(date) => {
              if (date) {
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
               {
                monthlyTotals?.flatMap(monthly => monthly?.transfers.map(transf => ({ id: transf.accountId, name: transf.accountName }))).filter((value, index, self) => self.findIndex((v) => v.id === value.id) === index).map((item) => (
                    <option key={item.id} value={item.id}>
                        {item.name}
                    </option>
                  ))
               }
            </select>
          </div>
      </div>
      {monthlyTotals?.length > 0 ? (
        <Line data={chartData()} options={chartOptions} />
      ) : (
        <p>No transfer data available for the selected period.</p>
      )}
    </Layout>
  );
};

export default Dashboard;