export default function PaymentProcessing({ show }) {
  if (!show) return null;
  return (
    <div className="processing" role="alertdialog" aria-live="assertive" aria-label="Processing payment">
      <div className="processing-card">
        <div className="processing-ring" aria-hidden="true" />
        <strong>Processing your demo payment</strong>
        <span>Please do not close this page. No real money is being charged.</span>
      </div>
    </div>
  );
}
