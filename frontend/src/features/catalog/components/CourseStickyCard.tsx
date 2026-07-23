import { useState } from 'react';
import type { PublicCourseDetail } from '../types/courseDetailTypes';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { Dialog, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { WishlistToggleButton } from '../../wishlist/components/WishlistToggleButton';

interface CourseStickyCardProps {
  course: PublicCourseDetail;
}

export const CourseStickyCard = ({ course }: CourseStickyCardProps) => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Calculate course stats dynamically (partially offloaded to backend)
  let totalReadingBlocks = 0;
  let hasQuiz = false;

  course.modules.forEach((module) => {
    module.blocks.forEach((block) => {
      if (block.type === 'TEXT' || block.type === 'WRITING' || block.type === 'FLASHCARD') {
        totalReadingBlocks++;
      } else if (block.type === 'QUIZ') {
        hasQuiz = true;
      }
    });
  });

  const totalVideoHours = Math.round(((course.totalDurationMinutes || 0) / 60) * 10) / 10;

  return (
    <>
      <div className="bg-white text-slate-800 shadow-2xl rounded-2xl overflow-hidden border border-slate-200/60 backdrop-blur-xl transform transition-all duration-300 hover:shadow-indigo-500/10">
        {/* Thumbnail Image */}
        <div
          className="relative aspect-video bg-slate-100 flex items-center justify-center p-1 cursor-pointer group"
          onClick={() => setIsVideoModalOpen(true)}
        >
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover rounded-xl transition-opacity group-hover:opacity-80" />
          ) : (
            <div className="text-slate-400 text-sm">Chưa có ảnh bìa</div>
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-slate-900/60 p-3 rounded-full backdrop-blur-sm">
              <PlayCircleIcon className="text-white shadow-lg" sx={{ fontSize: 48 }} />
            </div>
            <span className="text-white font-bold mt-3 drop-shadow-md bg-slate-900/60 px-3 py-1 rounded-full text-sm backdrop-blur-sm">Xem trước khóa học</span>
          </div>
        </div>

      <div className="p-7">
        <div className="mb-6 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold tracking-tight text-slate-900">
            {course.price === 0 ? (
              <span className="text-emerald-500">Miễn phí</span>
            ) : (
              `${course.price.toLocaleString('vi-VN')} ${course.currency}`
            )}
          </span>
        </div>

        {course.isEnrolled ? (
          <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 mb-4">
            Tiếp tục học
          </button>
        ) : (
          <>
            {course.price > 0 && (
              <button className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-3.5 px-4 rounded-xl transition-all mb-3 border border-indigo-200">
                Thêm vào giỏ hàng
              </button>
            )}
            <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 mb-4">
              {course.price === 0 ? 'Ghi danh ngay' : 'Mua ngay'}
            </button>
            <p className="text-center text-xs text-slate-500 font-medium mb-6">
              Đảm bảo hoàn tiền trong 30 ngày
            </p>
          </>
        )}

        <WishlistToggleButton courseId={course.id} variant="button" />

        <div className="text-sm border-t border-slate-100 pt-6 mt-2">
          <h4 className="font-bold mb-4 text-slate-900 text-base">Khóa học này bao gồm:</h4>
          <ul className="space-y-3 text-slate-600">
            {totalVideoHours > 0 && (
              <li className="flex items-center group">
                <OndemandVideoIcon fontSize="small" className="mr-3 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                <span className="group-hover:text-slate-900 transition-colors">{totalVideoHours} giờ video theo yêu cầu</span>
              </li>
            )}
            {totalReadingBlocks > 0 && (
              <li className="flex items-center group">
                <InsertDriveFileIcon fontSize="small" className="mr-3 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                <span className="group-hover:text-slate-900 transition-colors">{totalReadingBlocks} bài đọc và tài liệu</span>
              </li>
            )}
            {hasQuiz && (
              <li className="flex items-center group">
                <EmojiEventsIcon fontSize="small" className="mr-3 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                <span className="group-hover:text-slate-900 transition-colors">Bài tập thực hành & Trắc nghiệm</span>
              </li>
            )}
            <li className="flex items-center group">
              <AllInclusiveIcon fontSize="small" className="mr-3 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
              <span className="group-hover:text-slate-900 transition-colors">Quyền truy cập trọn đời</span>
            </li>
          </ul>
        </div>
      </div>
      </div>

      <Dialog
        open={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        maxWidth="md"
        fullWidth
        classes={{ paper: "bg-black rounded-xl overflow-hidden" }}
      >
        <div className="flex justify-between items-center p-4 bg-slate-900 text-white">
          <h3 className="font-bold">Xem trước khóa học</h3>
          <IconButton onClick={() => setIsVideoModalOpen(false)} size="small" className="text-slate-400 hover:text-white">
            <CloseIcon />
          </IconButton>
        </div>
        <DialogContent className="p-0 bg-black aspect-video flex items-center justify-center">
          {isVideoModalOpen && (
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
              title="Course Preview"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
