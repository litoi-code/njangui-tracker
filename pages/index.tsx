import React, { useState, useEffect } from 'react';
import Layout from '../components/layout';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import DatePicker from '../components/DatePicker';
import { format } from 'date-fns';

const ReactApexChart = dynamic(
  () => import('react-apexcharts'),
  { ssr: false }
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
        const series: ApexAxisChartSeries = [];
        const categories = monthlyTotals?.map(monthly => monthly?.month || "");

        const uniqueAccounts = new Set<string>();
        monthlyTotals?.forEach(monthly => {
            monthly?.transfers?.forEach(transf => uniqueAccounts.add(transf.accountName));
        });

        uniqueAccounts.forEach(accountName => {
            const dataForAccount = monthlyTotals?.map(monthly => {
                const transfers = monthly.transfers.find(tran => tran.accountName === accountName);
                return transfers?.totalAmount || 0;
            });
            series.push({
                name: accountName,
                data: dataForAccount
            });
        });

        const options: ApexOptions = {
            chart: {
                type: 'line',
                height: 350
            },
            xaxis: {
                categories: categories
            },
            yaxis: {
                title: {
                    text: 'Total Amount'
                }
            },
            title: {
                text: 'Monthly Transfer Totals',
                align: 'left'
            },
            stroke: {
                curve: 'smooth'
            }
        };

        return {
            series,
            options
        };
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
        <ReactApexChart series={chartData().series} options={chartData().options} type="line" height={350} />
      ) : (
        <p>No transfer data available for the selected period.</p>
      )}
    </Layout>
  );
};

export default Dashboard;
