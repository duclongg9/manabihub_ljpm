import { useState } from 'react';
import type { PublicCourseDetail } from '../types/courseDetailTypes';
import { PlayCircle, Target, BookOpen, Infinity as InfinityIcon } from 'lucide-react';
import { Dialog, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { WishlistToggleButton } from '../../wishlist/components/WishlistToggleButton';
import { createCheckout } from '../../checkout/services/checkoutService';
import { getAuthSession } from '../../../shared/auth/authSession';
import { ROUTES } from '../../../shared/constants/routes';

interface CourseStickyCardProps {
  course: PublicCourseDetail;
}

export const CourseStickyCard = ({ course }: CourseStickyCardProps) => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleContinueLearning = () => navigate(ROUTES.STUDENT.COURSE_LEARN(course.id));

  const handleBuy = async () => {
    if (!getAuthSession('public')) {
      navigate(ROUTES.PUBLIC.LOGIN);
      return;
    }
    setBuying(true);
    setBuyError(null);
    try {
      const checkout = await createCheckout(course.id);
      if (!checkout.paymentUrl) {
        // Free course — the student was enrolled immediately, go straight to learning.
        navigate(ROUTES.STUDENT.COURSE_LEARN(course.id));
        return;
      }
      navigate(`/checkout/${checkout.orderId}`, { state: { paymentUrl: checkout.paymentUrl } });
    } catch (err) {
      const code = (err as { response?: { data?: { messageCode?: string } } })?.response?.data?.messageCode;
      setBuyError(
        code === 'ORDER_ALREADY_ENROLLED'
          ? 'Bạn đã sở hữu khóa học này.'
          : 'Không thể tạo đơn hàng. Vui lòng thử lại.',
      );
      setBuying(false);
    }
  };

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
      <div className="bg-white text-slate-800 shadow-2xl rounded-2xl overflow-hidden border border-slate-200/60 backdrop-blur-xl transform transition-all duration-300 hover:shadow-slate-500/10">
        {/* Thumbnail Image */}
        <div
          className="relative aspect-video bg-slate-100 flex items-center justify-center p-1 cursor-pointer group"
          onClick={() => setIsVideoModalOpen(true)}
        >
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover rounded-xl transition-opacity group-hover:opacity-80" />
          ) : (
            <div className="flex flex-col items-center justify-center text-rose-200/40 w-full h-full bg-gradient-to-br from-rose-950 via-rose-900 to-slate-900 rounded-xl relative overflow-hidden">
              <span className="text-8xl font-black absolute opacity-20 transform -rotate-12 translate-x-4 translate-y-4">作文</span>
              <span className="text-sm font-semibold uppercase tracking-wider opacity-90 z-10 text-rose-100">ManabiHub</span>
            </div>
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-slate-900/60 p-3 rounded-full backdrop-blur-sm">
              <PlayCircle className="w-12 h-12 text-white shadow-lg" />
            </div>
            <span className="text-white font-bold mt-3 drop-shadow-md bg-slate-900/60 px-3 py-1 rounded-full text-sm backdrop-blur-sm">Xem trước khóa học</span>
          </div>
          {/* Wishlist Button Overlay */}
          <div onClick={(e) => e.stopPropagation()} className="absolute top-3 right-3 p-1 bg-white/80 backdrop-blur-sm rounded-full shadow z-20 flex items-center justify-center">
            <WishlistToggleButton courseId={course.id} variant="icon" />
          </div>
        </div>

      <div className="p-7">
        <div className="mb-6 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">
            {course.price === 0 ? (
              <span className="text-emerald-500">Miễn phí</span>
            ) : (
              `${course.price.toLocaleString('vi-VN')} ₫`
            )}
          </span>
        </div>

        {course.isEnrolled ? (
          <button
            onClick={handleContinueLearning}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 mb-4"
          >
            Tiếp tục học
          </button>
        ) : (
          <>
            <button
              onClick={handleBuy}
              disabled={buying}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white w-full py-3 rounded-xl font-semibold mb-3 transition-colors"
            >
              {buying ? 'Đang xử lý…' : course.price === 0 ? 'Ghi danh ngay' : 'Mua ngay'}
            </button>
            {buyError && <p className="text-center text-xs text-red-600 font-medium mb-3">{buyError}</p>}
          </>
        )}

        <div className="text-sm border-t border-slate-100 pt-6 mt-2">
          <h4 className="font-bold mb-4 text-slate-900 text-base">Khóa học này bao gồm:</h4>
          <ul className="space-y-3 text-slate-600">
            {totalVideoHours > 0 && (
              <li className="flex items-center group">
                <PlayCircle className="w-4 h-4 mr-3 text-slate-500 group-hover:text-red-600 transition-colors" />
                <span className="group-hover:text-slate-900 transition-colors">{totalVideoHours} giờ video theo yêu cầu</span>
              </li>
            )}
            {totalReadingBlocks > 0 && (
              <li className="flex items-center group">
                <BookOpen className="w-4 h-4 mr-3 text-slate-500 group-hover:text-red-600 transition-colors" />
                <span className="group-hover:text-slate-900 transition-colors">{totalReadingBlocks} bài đọc và tài liệu</span>
              </li>
            )}
            {hasQuiz && (
              <li className="flex items-center group">
                <Target className="w-4 h-4 mr-3 text-slate-500 group-hover:text-red-600 transition-colors" />
                <span className="group-hover:text-slate-900 transition-colors">Bài tập thực hành & Trắc nghiệm</span>
              </li>
            )}
            <li className="flex items-center group">
              <InfinityIcon className="w-4 h-4 mr-3 text-slate-500 group-hover:text-red-600 transition-colors" />
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
