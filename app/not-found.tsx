import Link from "next/link";
export default function NotFound(){return <div className="empty-route"><span className="empty-route__code">404</span><h1>Control surface not found</h1><p>This route is not part of the current ProvPlay administration map.</p><Link className="button button--primary" href="/">Return to overview</Link></div>}
