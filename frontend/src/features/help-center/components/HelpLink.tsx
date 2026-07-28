import { Info } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HelpLinkProps {
  to: string;
  label?: string;
  className?: string;
}

export const HelpLink = ({ to, label, className = '' }: HelpLinkProps) => {
  return (
    <Link 
      to={to} 
      className={`inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors ${className}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Info className="w-4 h-4" />
      {label && <span>{label}</span>}
    </Link>
  );
};
