import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from '@/pages/Login';
import AppLayout from '@/components/layout/AppLayout';

import ConsumerIndex from '@/pages/Consumer';
import ConsumerComplaintList from '@/pages/Consumer/ComplaintList';
import ConsumerComplaintForm from '@/pages/Consumer/ComplaintForm';
import ConsumerComplaintDetail from '@/pages/Consumer/ComplaintDetail';
import ConsumerAwardList from '@/pages/Consumer/AwardList';

import MerchantIndex from '@/pages/Merchant';
import MerchantComplaintList from '@/pages/Merchant/ComplaintList';
import MerchantComplaintDetail from '@/pages/Merchant/ComplaintDetail';
import MerchantCreditCenter from '@/pages/Merchant/CreditCenter';
import MerchantCompensationList from '@/pages/Merchant/CompensationList';

import ServiceIndex from '@/pages/Service';
import ServicePool from '@/pages/Service/Pool';
import ServiceComplaintList from '@/pages/Service/ComplaintList';
import ServiceComplaintDetail from '@/pages/Service/ComplaintDetail';

import ArbitratorIndex from '@/pages/Arbitrator';
import ArbitratorCaseList from '@/pages/Arbitrator/CaseList';
import ArbitratorCaseDetail from '@/pages/Arbitrator/CaseDetail';
import ArbitratorReviewList from '@/pages/Arbitrator/ReviewList';

import OperatorIndex from '@/pages/Operator';
import OperatorRulesConfig from '@/pages/Operator/RulesConfig';
import OperatorReports from '@/pages/Operator/Reports';

import Messages from '@/pages/Messages';

import Home from '@/pages/Home';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />

        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/consumer" replace />} />
          <Route path="/messages" element={<Messages />} />

          <Route path="/consumer">
            <Route index element={<ConsumerIndex />} />
            <Route path="complaints" element={<ConsumerComplaintList />} />
            <Route path="complaints/new" element={<ConsumerComplaintForm />} />
            <Route path="complaints/:id" element={<ConsumerComplaintDetail />} />
            <Route path="awards" element={<ConsumerAwardList />} />
          </Route>

          <Route path="/merchant">
            <Route index element={<MerchantIndex />} />
            <Route path="complaints" element={<MerchantComplaintList />} />
            <Route path="complaints/:id" element={<MerchantComplaintDetail />} />
            <Route path="credit" element={<MerchantCreditCenter />} />
            <Route path="compensations" element={<MerchantCompensationList />} />
          </Route>

          <Route path="/service">
            <Route index element={<ServiceIndex />} />
            <Route path="pool" element={<ServicePool />} />
            <Route path="complaints" element={<ServiceComplaintList />} />
            <Route path="complaints/:id" element={<ServiceComplaintDetail />} />
          </Route>

          <Route path="/arbitrator">
            <Route index element={<ArbitratorIndex />} />
            <Route path="cases" element={<ArbitratorCaseList />} />
            <Route path="cases/:id" element={<ArbitratorCaseDetail />} />
            <Route path="review" element={<ArbitratorReviewList />} />
          </Route>

          <Route path="/operator">
            <Route index element={<OperatorIndex />} />
            <Route path="rules" element={<OperatorRulesConfig />} />
            <Route path="reports" element={<OperatorReports />} />
          </Route>

          <Route path="*" element={<Navigate to="/consumer" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
