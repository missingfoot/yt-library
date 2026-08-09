export function LoadingSpinner() {
  return (
    <div className="h-screen flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48px"
        height="48px"
        viewBox="0 0 48 48"
        className="animate-spin"
        style={{ animationDuration: "0.8s" }}
      >
        <path d="M24 3V9" stroke="var(--text-dim)" strokeWidth="3" strokeLinecap="round" fill="none" strokeLinejoin="round" />
        <path opacity="0.6" d="M24 39V45" stroke="var(--text-dim)" strokeWidth="3" strokeLinecap="round" fill="none" strokeLinejoin="round" />
        <path opacity="0.8" d="M45.005 23.995L39.005 23.995" stroke="var(--text-dim)" strokeWidth="3" strokeLinecap="round" fill="none" strokeLinejoin="round" />
        <path opacity="0.4" d="M9.005 23.995L3.005 23.995" stroke="var(--text-dim)" strokeWidth="3" strokeLinecap="round" fill="none" strokeLinejoin="round" />
        <path opacity="0.9" d="M38.8507 9.14722L34.6081 13.3899" stroke="var(--text-dim)" strokeWidth="3" strokeLinecap="round" fill="none" strokeLinejoin="round" />
        <path opacity="0.5" d="M13.3948 34.6031L9.1522 38.8457" stroke="var(--text-dim)" strokeWidth="3" strokeLinecap="round" fill="none" strokeLinejoin="round" />
        <path opacity="0.7" d="M38.8578 38.8457L34.6151 34.6031" stroke="var(--text-dim)" strokeWidth="3" strokeLinecap="round" fill="none" strokeLinejoin="round" />
        <path opacity="0.3" d="M13.4019 13.3899L9.15928 9.14722" stroke="var(--text-dim)" strokeWidth="3" strokeLinecap="round" fill="none" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
