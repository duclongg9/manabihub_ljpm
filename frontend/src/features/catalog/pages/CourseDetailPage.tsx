import { useParams } from 'react-router-dom';
import { useCourseDetail } from '../hooks/useCourseDetail';
import { CourseHero } from '../components/CourseHero';
import { CourseStickyCard } from '../components/CourseStickyCard';
import { CurriculumAccordion } from '../components/CurriculumAccordion';
import { TeacherProfile } from '../components/TeacherProfile';
import { CourseStickyHeader } from '../components/CourseStickyHeader';
import StarIcon from '@mui/icons-material/Star';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';

export const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: course, isLoading, isError } = useCourseDetail(id || '');

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="bg-slate-900 pt-20 pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="w-24 h-6 bg-slate-800 rounded-full mb-6 animate-pulse" />
            <div className="w-3/4 h-12 bg-slate-800 rounded-lg mb-6 animate-pulse" />
            <div className="w-1/2 h-6 bg-slate-800 rounded-lg mb-8 animate-pulse" />
            <div className="w-full h-14 max-w-2xl bg-slate-800 rounded-2xl animate-pulse" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              <div className="w-full h-48 bg-slate-100 rounded-2xl animate-pulse" />
              <div className="w-full h-64 bg-slate-100 rounded-2xl animate-pulse" />
              <div className="w-full h-32 bg-slate-100 rounded-2xl animate-pulse" />
            </div>
            <div className="lg:col-span-1">
              <div className="w-full h-96 bg-slate-100 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800">
        <Helmet>
          <title>Không tìm thấy khóa học | ManabiHub</title>
        </Helmet>
        <h2 className="text-2xl font-bold mb-2">Không tìm thấy khóa học</h2>
        <p className="text-slate-500">Khóa học không tồn tại hoặc chưa được xuất bản.</p>
      </div>
    );
  }

  // Parse outcomes if it's a newline-separated string
  const outcomesList = course.outcomes
    ? course.outcomes.split('\n').filter((item) => item.trim() !== '')
    : [];

  const prerequisitesList = course.prerequisites
    ? course.prerequisites.split('\n').filter((item) => item.trim() !== '')
    : [];

  const displayOutcomes = outcomesList.length > 0 
    ? outcomesList 
    : [
        'Nắm vững cấu trúc đoạn văn chuẩn JLPT N3',
        'Bổ sung 200+ từ vựng & mẫu ngữ pháp ăn điểm bài viết',
        'Nhận phản hồi sửa lỗi chi tiết từ AI & Sensei',
        'Phương pháp sắp xếp ý tưởng và triển khai bài viết logic'
      ];

  // Plain text fallback for meta description
  const metaDescription = course.introduction
    ? course.introduction.replace(/<[^>]+>/g, '').substring(0, 160)
    : course.description
      ? course.description.replace(/<[^>]+>/g, '').substring(0, 160)
      : 'Khóa học tiếng Nhật chất lượng cao trên ManabiHub';

  return (
    <div className="bg-white min-h-screen relative">
      <Helmet>
        <title>{course.title} | ManabiHub</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={course.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        {course.thumbnailUrl && <meta property="og:image" content={course.thumbnailUrl} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={course.title} />
        <meta name="twitter:description" content={metaDescription} />
        {course.thumbnailUrl && <meta name="twitter:image" content={course.thumbnailUrl} />}
      </Helmet>

      <CourseStickyHeader course={course} />
      <CourseHero course={course} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">

          {/* Left Column: Main Content */}
          <div className="lg:col-span-2">

            {/* What you will learn */}
            <div className="bg-rose-50/50 border border-rose-100 p-6 rounded-2xl mb-12">
              <h2 className="text-lg font-bold text-slate-900 mb-4">🎯 Bạn sẽ học được gì trong khóa học này?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {displayOutcomes.map((outcome, index) => (
                  <div key={index} className="flex items-start text-sm text-slate-700 leading-relaxed font-medium">
                    <span className="text-emerald-600 font-bold mr-2">✓</span>
                    <span>{outcome.trim()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Curriculum */}
            <div className="mb-12">
              <CurriculumAccordion
                modules={course.modules}
                courseId={course.id}
                showAiChatAction={course.isEnrolled && course.aiSupported}
              />
            </div>

            {/* Prerequisites */}
            {prerequisitesList.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Yêu cầu đầu vào</h2>
                <ul className="list-disc list-inside space-y-2 text-slate-700 text-sm">
                  {prerequisitesList.map((req, index) => (
                    <li key={index}>{req.trim()}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Target Students */}
            {course.targetStudents && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Đối tượng phù hợp</h2>
                <div
                  className="prose prose-slate text-sm max-w-none text-slate-700 whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(course.targetStudents) }}
                />
              </div>
            )}

            {/* Teacher Profile */}
            <TeacherProfile teacher={course.teacher} />

            {/* Reviews Section */}
            <div className="mt-12">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Đánh giá từ học viên</h2>
              
              <div className="flex flex-col sm:flex-row gap-8 mb-8">
                {/* Stats */}
                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100 min-w-[200px]">
                  <span className="text-5xl font-black text-slate-900 mb-2">4.8</span>
                  <div className="flex text-yellow-400 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <StarIcon key={s} fontSize="small" />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-slate-500">16 đánh giá</span>
                </div>
                
                {/* Bars */}
                <div className="flex-1 flex flex-col justify-center gap-2">
                  {[
                    { stars: 5, pct: 85 },
                    { stars: 4, pct: 10 },
                    { stars: 3, pct: 5 },
                    { stars: 2, pct: 0 },
                    { stars: 1, pct: 0 },
                  ].map((bar) => (
                    <div key={bar.stars} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-500 w-8">{bar.stars} sao</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${bar.pct}%` }} />
                      </div>
                      <span className="text-sm font-medium text-slate-500 w-8">{bar.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {course.isEnrolled && (
                <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <h3 className="font-bold text-slate-900 mb-2">Bạn đánh giá khóa học này thế nào?</h3>
                  <p className="text-sm text-slate-500 mb-4">Chia sẻ trải nghiệm của bạn để giúp các học viên khác nhé.</p>
                  <button className="px-6 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors">
                    ✍️ Viết đánh giá & Chấm sao của bạn
                  </button>
                </div>
              )}

              {/* Review List */}
              <div className="space-y-6">
                {[
                  { name: 'Nguyễn Văn A', date: '2 ngày trước', content: 'Khóa học rất chi tiết và dễ hiểu. Cảm ơn Sensei!' },
                  { name: 'Trần Thị B', date: '1 tuần trước', content: 'Bài tập phong phú, AI chữa bài rất có tâm.' },
                ].map((review, i) => (
                  <div key={i} className="pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{review.name}</div>
                        <div className="text-xs text-slate-500">{review.date}</div>
                      </div>
                      <div className="ml-auto flex text-yellow-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <StarIcon key={s} sx={{ fontSize: 14 }} />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{review.content}</p>
                  </div>
                ))}
              </div>

              {course.isEnrolled && (
                <div className="mt-8 flex justify-end">
                  <button className="text-xs text-slate-400 hover:text-red-600 flex items-center gap-1 cursor-pointer transition-colors">
                    🚩 Báo cáo nội dung khóa học
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <CourseStickyCard course={course} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
