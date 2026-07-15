import type { PublicCourseDetail } from '../types/courseDetailTypes';
import StarIcon from '@mui/icons-material/Star';
import LanguageIcon from '@mui/icons-material/Language';
import NewReleasesIcon from '@mui/icons-material/NewReleases';

import DOMPurify from 'dompurify';

interface CourseHeroProps {
  course: PublicCourseDetail;
}

export const CourseHero = ({ course }: CourseHeroProps) => {
  return (
    <div className="relative bg-slate-900 text-white pt-12 pb-16 sm:pt-16 sm:pb-20 overflow-hidden rounded-3xl mt-4">
      {/* Background Gradient Meshes */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 opacity-80" />
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-purple-600/20 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col items-start">
          {/* Breadcrumbs / Badges */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {course.category && (
              <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-semibold tracking-wide uppercase">
                {course.category}
              </span>
            )}
            {course.jlptLevel && (
              <span className="px-3 py-1 bg-fuchsia-500/20 border border-fuchsia-400/30 rounded-full text-fuchsia-300 text-xs font-semibold tracking-wide uppercase">
                {course.jlptLevel}
              </span>
            )}
          </div>
          
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 leading-tight drop-shadow-md">
            {course.title}
          </h1>
          
          {/* Description */}
          <div 
            className="text-base sm:text-lg text-slate-300 mb-6 max-w-3xl leading-relaxed prose prose-invert"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(course.description || course.introduction || '') }}
          />
          
          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-6 text-sm mb-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-3">
            {/* Rating Block */}
            {course.totalReviews > 0 ? (
              <div className="flex items-center">
                <span className="flex items-center text-yellow-400 font-bold text-base mr-2">
                  {course.averageRating.toFixed(1)}
                  <StarIcon fontSize="small" className="ml-1 -mt-0.5" />
                </span>
                <span className="text-slate-300">
                  ({course.totalReviews.toLocaleString()} đánh giá)
                </span>
              </div>
            ) : (
              <span className="text-yellow-400 font-medium">Chưa có đánh giá</span>
            )}
            
            <div className="w-1 h-1 rounded-full bg-slate-600 hidden sm:block" />
            <span className="text-slate-300 font-medium">12,345 học viên</span>
          </div>
          
          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-400">
            <span className="flex items-center">
              Tạo bởi&nbsp;<span className="text-white font-medium hover:text-indigo-300 transition-colors cursor-pointer border-b border-indigo-400/50">{course.teacher.name}</span>
            </span>
            <span className="flex items-center">
              <NewReleasesIcon fontSize="small" className="mr-1.5 opacity-70" />
              Cập nhật {course.publishedAt ? new Date(course.publishedAt).toLocaleDateString('vi-VN') : 'Gần đây'}
            </span>
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
