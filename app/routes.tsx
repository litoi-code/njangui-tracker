import { createBrowserRouter } from 'react-router-dom';
import InternalLendingPage from '../pages/internal-lending';
import RootLayout from './layout';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <RootLayout />,
        children: [
            {
                path: '/internal-lending',
                element: <InternalLendingPage />,
            },
        ],
    },
]);

export default router;
