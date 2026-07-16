import type { PublicTeacherProfile } from '../types/courseDetailTypes';
import StarIcon from '@mui/icons-material/Star';
import PeopleIcon from '@mui/icons-material/People';

interface TeacherProfileProps {
  teacher: PublicTeacherProfile;
}

export const TeacherProfile = ({ teacher }: TeacherProfileProps) => {
  return (
    <div className="mb-12">
      <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Giảng viên của bạn</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 hover:shadow-md transition-shadow">
        <div className="flex-shrink-0 relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full blur-sm opacity-50" />
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100 flex items-center justify-center">
            {teacher.avatarUrl ? (
              <img src={teacher.avatarUrl} alt={teacher.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-slate-400 font-medium text-3xl">{teacher.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>
        <div className="text-center sm:text-left flex-1">
          <h3 className="text-xl font-bold text-slate-900 mb-1">{teacher.name}</h3>
          <p className="text-indigo-600 font-medium text-sm mb-4 tracking-wide uppercase">Giảng viên / Chuyên gia</p>
          <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line mb-4">
            {teacher.bio || 'Giảng viên chưa cập nhật thông tin giới thiệu.'}
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-slate-700">
            <span className="flex items-center">
              <StarIcon fontSize="small" className="text-yellow-400 mr-1.5" />
              <span className="font-bold mr-1">4.8</span> Điểm đánh giá
            </span>
            <span className="flex items-center">
              <PeopleIcon fontSize="small" className="text-slate-400 mr-1.5" />
              <span className="font-bold mr-1">12,345</span> Học viên
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
