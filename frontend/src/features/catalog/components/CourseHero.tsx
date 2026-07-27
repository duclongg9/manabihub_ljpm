import type { PublicCourseDetail } from '../types/courseDetailTypes';
import LanguageIcon from '@mui/icons-material/Language';
import NewReleasesIcon from '@mui/icons-material/NewReleases';

import { sanitizeRichText } from '../../../shared/security/sanitizeRichText';

interface CourseHeroProps {
  course: PublicCourseDetail;
}

export const CourseHero = ({ course }: CourseHeroProps) => {
  return (
    <div className="relative bg-slate-900 text-white pt-12 pb-12 sm:pt-16 sm:pb-16 overflow-hidden rounded-t-3xl rounded-b-[2.5rem] shadow-xl mt-4">
      {/* Background Gradient Meshes */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#4C0519] via-[#881337] to-[#BE123C] opacity-90" />
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-red-600/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-rose-600/20 blur-3xl" />
      
      {/* Kanji Watermark */}
      <div className="absolute -top-10 right-10 text-[15rem] font-black text-white/5 select-none pointer-events-none" style={{ writingMode: 'vertical-rl' }}>
        文章
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col items-start">
          {/* Breadcrumb */}
          <div className="flex items-center text-xs font-medium text-white/50 mb-3 tracking-wide">
            <span className="hover:text-white/80 cursor-pointer transition-colors">Khám phá khóa học</span>
            <span className="mx-2">/</span>
            <span className="hover:text-white/80 transition-colors">{course.jlptLevel || 'Khóa học'}</span>
            <span className="mx-2">/</span>
            <span className="text-white/80 truncate max-w-[200px] sm:max-w-xs">{course.title.replace('--', '|')}</span>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {course.category && (
              <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-red-100 text-xs font-semibold tracking-wide uppercase">
                {course.category}
              </span>
            )}
            {course.jlptLevel && (
              <span className="px-3 py-1 bg-red-500/20 border border-red-400/30 rounded-full text-white text-xs font-semibold tracking-wide uppercase">
                {course.jlptLevel} • 中級
              </span>
            )}
          </div>

          {/* Title & Subtitle */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-2 leading-tight drop-shadow-md">
            {course.title.replace('--', '|')}
          </h1>
          {/* Description */}
          <div
            className="text-base sm:text-lg text-slate-300 my-6 max-w-3xl leading-relaxed prose prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(course.description || course.introduction) }}
          />

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-400">
            <span className="flex items-center">
              Tạo bởi&nbsp;<span className="text-white font-medium">{course.teacher.name}</span>
            </span>
            {course.publishedAt && (
              <span className="flex items-center">
                <NewReleasesIcon fontSize="small" className="mr-1.5 opacity-70" />
                Xuất bản {new Date(course.publishedAt).toLocaleDateString('vi-VN')}
              </span>
            )}
            <span className="flex items-center">
              <LanguageIcon fontSize="small" className="mr-1.5 opacity-70" />
              Tiếng Việt
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
