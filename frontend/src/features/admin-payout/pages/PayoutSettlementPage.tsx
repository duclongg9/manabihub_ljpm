import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePayoutDetail } from "../hooks/usePayoutDetail";
import { useApprovePayout } from "../hooks/useApprovePayout";
import { useRejectPayout } from "../hooks/useRejectPayout";
import { useConfirmManualTransfer } from "../hooks/useConfirmManualTransfer";
import { ArrowLeft, AlertTriangle, CheckCircle, CreditCard, Building2 } from "lucide-react";

export const PayoutSettlementPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: detail, isLoading } = usePayoutDetail(id);
  const approveMutation = useApprovePayout();
  const rejectMutation = useRejectPayout();
  const manualMutation = useConfirmManualTransfer();

  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  
  const [manualData, setManualData] = useState({
    transactionReference: "",
    transferredAmount: "",
    note: ""
  });

  if (isLoading) return <div className="p-8 text-center">Loading details...</div>;
  if (!detail) return <div className="p-8 text-center text-red-500">Failed to load payout details</div>;

  const handleApprove = () => {
    if (window.confirm("Are you sure you want to approve this payout and initiate gateway transfer?")) {
      approveMutation.mutate(id!);
    }
  };

  const handleReject = () => {
    if (!rejectReason) {
      alert("Reason is required");
      return;
    }
    rejectMutation.mutate(
      { withdrawalRequestId: id!, payload: { reason: rejectReason } },
      { onSuccess: () => setShowRejectModal(false) }
    );
  };

  const handleManual = () => {
    if (!manualData.transactionReference || !manualData.transferredAmount) {
      alert("Reference and Amount are required");
      return;
    }
    manualMutation.mutate(
      {
        withdrawalRequestId: id!,
        payload: {
          transactionReference: manualData.transactionReference,
          transferredAmount: Number(manualData.transferredAmount),
          transferredAt: new Date().toISOString(),
          note: manualData.note
        }
      },
      { onSuccess: () => setShowManualModal(false) }
    );
  };

  const canAction = detail.status === "PENDING_REVIEW" || detail.status === "PENDING_RETRY";
  const isMismatch = detail.reconciliationStatus !== "MATCHED";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/admin/payouts")} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payout Settlement Details</h1>
          <p className="text-sm text-gray-500 mt-1">ID: {detail.withdrawalRequestId}</p>
        </div>
      </div>

      {isMismatch && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="text-red-500 w-6 h-6 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800">Reconciliation Mismatch Detected</h3>
            <ul className="list-disc list-inside mt-2 text-red-700 text-sm">
              {detail.reconciliationAlerts?.map((alert: string, i: number) => (
                <li key={i}>{alert}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold border-b pb-3 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" /> Bank Account Details
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Bank Name</span>
              <span className="font-medium">{detail.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Bank Branch</span>
              <span className="font-medium">{detail.bankBranch || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account Name</span>
              <span className="font-medium">{detail.accountHolderName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account Number</span>
              <span className="font-medium tracking-wider">{detail.accountNumberMasked}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold border-b pb-3 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" /> Settlement Summary
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Requested Amount</span>
              <span className="font-bold text-lg text-gray-900">{detail.requestedAmount.toLocaleString()} VND</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Reserved Balance</span>
              <span className="font-medium">{detail.reservedBalance.toLocaleString()} VND</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Available Balance</span>
              <span className="font-medium">{detail.availableBalance.toLocaleString()} VND</span>
            </div>
            <div className="flex justify-between pt-3 border-t">
              <span className="text-gray-500">Status</span>
              <span className="font-bold">{detail.status}</span>
            </div>
          </div>
        </div>
      </div>

      {canAction && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-wrap gap-4 items-center justify-end">
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={approveMutation.isPending || rejectMutation.isPending}
            className="px-4 py-2 border border-red-200 text-red-600 bg-white rounded-lg hover:bg-red-50 font-medium transition"
          >
            Reject Request
          </button>
          <button
            onClick={() => setShowManualModal(true)}
            disabled={approveMutation.isPending || manualMutation.isPending}
            className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 font-medium transition"
          >
            Manual Transfer Confirm
          </button>
          <button
            onClick={handleApprove}
            disabled={isMismatch || approveMutation.isPending}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" /> 
            {approveMutation.isPending ? "Processing..." : "Approve & Transfer"}
          </button>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold mb-4">Reject Payout Request</h3>
            <textarea
              className="w-full border rounded-lg p-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px]"
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleReject} disabled={rejectMutation.isPending} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold mb-4">Confirm Manual Transfer</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Reference</label>
                <input
                  type="text"
                  className="w-full border rounded-lg p-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  value={manualData.transactionReference}
                  onChange={(e) => setManualData({...manualData, transactionReference: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transferred Amount (VND)</label>
                <input
                  type="number"
                  className="w-full border rounded-lg p-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  value={manualData.transferredAmount}
                  onChange={(e) => setManualData({...manualData, transferredAmount: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                <textarea
                  className="w-full border rounded-lg p-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  value={manualData.note}
                  onChange={(e) => setManualData({...manualData, note: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowManualModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleManual} disabled={manualMutation.isPending} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">Confirm Transfer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
