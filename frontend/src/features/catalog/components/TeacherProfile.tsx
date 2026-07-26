import type { PublicTeacherProfile } from '../types/courseDetailTypes';
import VerifiedIcon from '@mui/icons-material/Verified';

interface TeacherProfileProps {
  teacher: PublicTeacherProfile;
}

export const TeacherProfile = ({ teacher }: TeacherProfileProps) => {
  return (
    <div className="mb-12">
      <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Giảng viên của bạn</h2>
      <div className="bg-slate-50/80 rounded-2xl border border-slate-100 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 hover:shadow-md transition-shadow">
        <div className="flex-shrink-0 relative">
          <div className="relative w-16 h-16 rounded-full bg-red-50 text-red-600 font-bold border-2 border-red-100 flex items-center justify-center text-xl shadow-sm overflow-hidden">
            {teacher.avatarUrl ? (
              <img src={teacher.avatarUrl} alt={teacher.name} className="w-full h-full object-cover" />
            ) : (
              <span>{teacher.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>
        <div className="text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-3">
            <h3 className="text-xl font-bold text-slate-900">{teacher.name}</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">
              <VerifiedIcon sx={{ fontSize: 14 }} />
              Sensei 先生
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center text-sm font-semibold text-slate-700">
              ⭐ 4.8 <span className="text-slate-500 font-normal ml-1">(16 đánh giá)</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center text-sm font-semibold text-slate-700">
              👥 12,345 <span className="text-slate-500 font-normal ml-1">Học viên</span>
            </span>
          </div>
          <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line mb-4">
            {teacher.bio || 'Giảng viên chưa cập nhật thông tin giới thiệu.'}
          </div>
        </div>
      </div>
    </div>
  );
};
