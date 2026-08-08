import { Navigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';

export const StudentWalletPage = () => {
  return <Navigate to={ROUTES.STUDENT.PAYMENTS} replace />;
};

export default StudentWalletPage;
