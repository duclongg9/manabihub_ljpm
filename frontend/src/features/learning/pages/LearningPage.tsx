import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useLearningQuiz, 
  useFinalTestEligibility, 
  useFinalTestSubmit,
  useFinalTestContent,
  useStartFinalTest,
  useQuizContent
} from '../hooks/useLearning';
import { useCourseDetail } from '../../catalog/hooks/useCourseDetail';

export const LearningPage = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // --- COURSE DATA ---
  const { data: course } = useCourseDetail(courseId || '');

  // --- SIDEBAR & NAVIGATION STATE ---
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  const [isFinalTestSelected, setIsFinalTestSelected] = useState<boolean>(false);

  useEffect(() => {
    if (course && !selectedBlockId && !isFinalTestSelected) {
      const allBlocks = course.modules.flatMap(m => m.blocks);
      if (allBlocks.length > 0) {
        setSelectedBlockId(allBlocks[0].id);
      }
    }
  }, [course, selectedBlockId, isFinalTestSelected]);

  const handleSelectBlock = (blockId: string) => {
    setSelectedBlockId(blockId);
    setIsFinalTestSelected(false);
  };

  const handleSelectFinalTest = () => {
    setIsFinalTestSelected(true);
    setSelectedBlockId('');
  };

  const selectedBlock = course?.modules.flatMap(m => m.blocks).find(b => b.id === selectedBlockId);

  // --- QUIZ STATE ---
  const { data: quizItems, isLoading: isLoadingQuiz } = useQuizContent(courseId || '', selectedBlockId);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const submitQuizMutation = useLearningQuiz();

  const handleQuizOptionChange = (questionId: string, optionId: string) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmitQuiz = () => {
    if (!courseId || !selectedBlockId || !quizItems) return;
    const answers = Object.entries(quizAnswers).map(([qId, oId]) => ({
      questionId: qId,
      selectedOptions: [oId]
    }));
    submitQuizMutation.mutate({ courseId, blockId: selectedBlockId, data: { answers } });
  };

  // --- FINAL TEST STATE ---
  const { data: eligibility, isLoading: checkingEligibility, refetch: refetchEligibility } = useFinalTestEligibility(courseId || '');
  const [isTakingTest, setIsTakingTest] = useState(false);
  const [attemptId, setAttemptId] = useState<string>('');
  const { data: finalTestContent, isLoading: isLoadingFinalTest } = useFinalTestContent(courseId || '', isTakingTest);
  const [finalTestAnswers, setFinalTestAnswers] = useState<Record<string, string>>({});
  
  const startFinalTestMutation = useStartFinalTest();
  const submitFinalTestMutation = useFinalTestSubmit();

  // Timer logic
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (isTakingTest && finalTestContent?.timeLimitMinutes) {
      setTimeLeft(finalTestContent.timeLimitMinutes * 60);
    }
  }, [isTakingTest, finalTestContent]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && isTakingTest && !submitFinalTestMutation.isPending) {
      handleSubmitFinalTest();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleFinalTestOptionChange = (questionId: string, choiceId: string) => {
    setFinalTestAnswers(prev => ({ ...prev, [questionId]: choiceId }));
  };

  const handleStartFinalTest = async () => {
    if (!eligibility?.eligible) return;
    try {
      const result = await startFinalTestMutation.mutateAsync(courseId || '');
      setAttemptId(result.attemptId);
      setIsTakingTest(true);
      setFinalTestAnswers({});
      submitFinalTestMutation.reset();
    } catch (e) {
      // Handled by hook
    }
  };

  const handleSubmitFinalTest = () => {
    if (!courseId || !finalTestContent || !attemptId) return;
    const answers = Object.entries(finalTestAnswers).map(([qId, cId]) => ({
      questionId: qId,
      selectedChoiceIds: [cId]
    }));
    submitFinalTestMutation.mutate({
      courseId,
      data: { finalTestId: finalTestContent.id, attemptId, answers }
    });
  };

  const finishTestAndExit = () => {
    setIsTakingTest(false);
    refetchEligibility();
  };

  // --- MODERN RENDERERS (Sleek, Monochromatic with Blue Accents) ---
  const renderSidebar = () => (
    <div className="w-[340px] bg-[#fbfcfd] border-r border-slate-200 h-screen overflow-y-auto flex-shrink-0 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="p-6 border-b border-slate-200 bg-[#fbfcfd]/80 backdrop-blur-md sticky top-0 z-10">
        <button onClick={() => navigate(`/courses/${courseId}`)} className="group flex items-center gap-2 text-[13px] font-semibold text-slate-500 hover:text-slate-900 mb-5 transition-colors">
          <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Quay lại khóa học
        </button>
        <h2 className="text-xl font-extrabold text-slate-900 leading-snug tracking-tight">{course?.title || 'Đang tải...'}</h2>
        <div className="mt-5 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tiến độ học</span>
          <span className="text-xs font-bold text-slate-900">{eligibility?.completedLessons || 0} / {eligibility?.totalLessons || 0}</span>
        </div>
        <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${(eligibility?.completedLessons || 0) / (eligibility?.totalLessons || 1) * 100}%` }}></div>
        </div>
      </div>

      <div className="p-5 space-y-8">
        {course?.modules.map((module, mIndex) => (
          <div key={module.id} className="space-y-3">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Chương {mIndex + 1}: {module.title}</h3>
            <div className="space-y-1">
              {module.blocks.map((block, bIndex) => {
                const isActive = selectedBlockId === block.id && !isFinalTestSelected;
                return (
                  <button
                    key={block.id}
                    onClick={() => handleSelectBlock(block.id)}
                    className={`w-full text-left p-3.5 rounded-xl flex items-start gap-3.5 transition-all duration-200 border ${
                      isActive 
                        ? 'bg-white border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.04)]' 
                        : 'bg-transparent border-transparent hover:bg-slate-100'
                    }`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${isActive ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {block.type === 'VIDEO' && <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>}
                      {block.type === 'READING' && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>}
                      {block.type === 'QUIZ' && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className={`text-[13px] leading-relaxed ${isActive ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>{bIndex + 1}. {block.title}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-6">
          <button
            onClick={handleSelectFinalTest}
            className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 border ${
              isFinalTestSelected 
                ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/10' 
                : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 hover:shadow-md'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isFinalTestSelected ? 'bg-white/10' : 'bg-slate-100 text-slate-600'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            </div>
            <div>
              <p className="text-[13px] font-black uppercase tracking-widest">Bài thi cuối khóa</p>
              <p className={`text-xs mt-1 ${isFinalTestSelected ? 'text-slate-400 font-medium' : 'text-slate-500'}`}>Nhận chứng chỉ tốt nghiệp</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderContentArea = () => {
    if (isFinalTestSelected) {
      return renderFinalTestIntro();
    }

    if (!selectedBlock) return <div className="flex-1 flex items-center justify-center text-slate-400 font-medium">Vui lòng chọn bài học ở menu bên trái</div>;

    return (
      <div className="flex-1 overflow-y-auto bg-white relative">
        <div className="absolute top-0 left-0 w-full h-64 bg-slate-50 border-b border-slate-100 z-0"></div>
        
        {selectedBlock.type === 'VIDEO' && (
          <div className="max-w-5xl mx-auto p-8 lg:p-12 relative z-10">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">{selectedBlock.title}</h1>
            <div className="aspect-video bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-900/10 border border-slate-200/50">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0" 
                title="Video player" 
                frameBorder="0" 
                allowFullScreen
              ></iframe>
            </div>
            <div className="mt-12 max-w-3xl">
              <h3 className="font-extrabold text-slate-900 mb-3 text-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                Ghi chú bài giảng
              </h3>
              <p className="text-slate-600 text-[15px] leading-relaxed">Nội dung video này giới thiệu về các khái niệm cơ bản. Hãy chú ý ghi chép lại những điểm quan trọng trong quá trình học. Việc ghi chép giúp tăng 50% khả năng ghi nhớ kiến thức.</p>
            </div>
          </div>
        )}

        {selectedBlock.type === 'READING' && (
          <div className="max-w-3xl mx-auto p-8 lg:p-16 relative z-10">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-10">{selectedBlock.title}</h1>
            <div className="prose prose-slate prose-lg max-w-none text-slate-700 bg-white p-10 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100">
              <p className="lead">Chào mừng bạn đến với bài học đọc hiểu. Đây là nội dung giả lập cho hệ thống.</p>
              <h3>Khái niệm cốt lõi</h3>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
              <div className="bg-slate-50 border-l-4 border-slate-900 p-6 rounded-r-xl my-8">
                <p className="m-0 font-medium italic text-slate-800">"Học hỏi không bao giờ là thừa. Chúc bạn một ngày học tập thật hiệu quả và tràn đầy năng lượng!"</p>
              </div>
            </div>
          </div>
        )}

        {selectedBlock.type === 'QUIZ' && (
          <div className="max-w-3xl mx-auto p-8 lg:p-12 relative z-10">
            <div className="mb-12">
              <span className="px-3 py-1 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest rounded-md mb-4 inline-block">BÀI TẬP</span>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{selectedBlock.title}</h1>
              <p className="text-slate-500 mt-2 font-medium">Hoàn thành bài tập để kiểm tra kiến thức của bạn.</p>
            </div>

            <div className="space-y-10">
              {isLoadingQuiz ? (
                <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div></div>
              ) : !quizItems || quizItems.length === 0 ? (
                <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-3xl border border-slate-200 border-dashed">Không có câu hỏi nào.</div>
              ) : (
                quizItems.map((item, index) => (
                  <div key={item.id} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                    <p className="text-lg font-bold text-slate-900 mb-6 flex gap-3 leading-snug">
                      <span className="text-slate-400 font-black">{index + 1}.</span> {item.content}
                    </p>
                    <div className="space-y-3">
                      {item.options.map((opt) => (
                        <label key={opt.id} className={`flex items-center space-x-4 p-4 rounded-xl cursor-pointer border-2 transition-all duration-200 ${quizAnswers[item.id] === opt.id ? 'border-slate-900 bg-slate-50' : 'border-slate-100 hover:border-slate-300'}`}>
                          <div className={`relative flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${quizAnswers[item.id] === opt.id ? 'border-slate-900' : 'border-slate-300'}`}>
                            {quizAnswers[item.id] === opt.id && <div className="w-2.5 h-2.5 bg-slate-900 rounded-full"></div>}
                            <input type="radio" name={`quiz-${item.id}`} value={opt.id} className="hidden" onChange={() => handleQuizOptionChange(item.id, opt.id)} />
                          </div>
                          <span className={`text-[15px] ${quizAnswers[item.id] === opt.id ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>{opt.content}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {quizItems && quizItems.length > 0 && (
              <div className="mt-12 flex items-center gap-6">
                <button
                  onClick={handleSubmitQuiz}
                  disabled={submitQuizMutation.isPending || Object.keys(quizAnswers).length < quizItems.length}
                  className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 disabled:opacity-50 disabled:hover:shadow-none transition-all"
                >
                  {submitQuizMutation.isPending ? 'Đang chấm...' : 'Nộp bài trắc nghiệm'}
                </button>

                {submitQuizMutation.data && (
                  <div className={`px-5 py-3 rounded-xl border flex items-center gap-3 font-bold ${submitQuizMutation.data.passed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={submitQuizMutation.data.passed ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"}></path></svg>
                    {submitQuizMutation.data.passed ? `Đạt (${submitQuizMutation.data.score}/100)` : `Chưa đạt (${submitQuizMutation.data.score}/100)`}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderFinalTestIntro = () => {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col p-8 sm:p-12 items-center justify-center relative">
        <div className="absolute top-0 w-full h-[50vh] bg-white border-b border-slate-200 z-0"></div>
        
        {submitFinalTestMutation.data ? (
          // POST SUBMISSION RESULT
          <div className="w-full max-w-xl text-center bg-white p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 z-10">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${submitFinalTestMutation.data.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d={submitFinalTestMutation.data.passed ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"}></path></svg>
            </div>
            <h2 className={`text-3xl font-extrabold mb-2 tracking-tight ${submitFinalTestMutation.data.passed ? 'text-emerald-700' : 'text-red-700'}`}>
              {submitFinalTestMutation.data.passed ? 'Vượt Quả Xuất Sắc!' : 'Rất Tiếc!'}
            </h2>
            <p className="text-slate-500 font-medium">Bạn đã hoàn thành bài thi với số điểm:</p>
            <div className="text-[5rem] leading-none font-black text-slate-900 my-8 tracking-tighter">
              {submitFinalTestMutation.data.score}<span className="text-3xl text-slate-300 font-bold ml-1">/100</span>
            </div>
            <button onClick={finishTestAndExit} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10">
              Quay lại khóa học
            </button>
          </div>
        ) : (
          // ELIGIBILITY SCREEN
          <div className="w-full max-w-2xl bg-white p-10 sm:p-16 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 z-10">
            <div className="flex flex-col items-center text-center border-b border-slate-100 pb-10 mb-10">
              <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-slate-900/20">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              </div>
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Bài Thi Cuối Khóa</h2>
              <p className="text-slate-500 text-lg">Hoàn thành các học phần và làm bài kiểm tra để chứng nhận năng lực.</p>
            </div>
            
            {checkingEligibility ? (
              <div className="py-12 flex justify-center"><div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div></div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tiến độ</p>
                    <p className="font-extrabold text-2xl text-slate-900">{eligibility?.completedLessons || 0} / {eligibility?.totalLessons || 0}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Lượt thi còn lại</p>
                    <p className="font-extrabold text-2xl text-slate-900">{eligibility?.attemptsLeft || 0}</p>
                  </div>
                </div>

                {!eligibility?.eligible && (
                  <div className="p-6 bg-red-50 border border-red-100 rounded-2xl flex gap-4">
                    <svg className="w-6 h-6 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <div>
                      <p className="font-bold text-red-900 mb-1">Chưa đủ điều kiện thi</p>
                      <p className="text-red-700 text-sm font-medium">
                        {eligibility?.reason === 'LESSONS_NOT_COMPLETED' 
                          ? 'Vui lòng hoàn thành 100% các bài học trong khóa.' 
                          : 'Bạn đã sử dụng hết số lượt thi cho phép.'}
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleStartFinalTest}
                  disabled={!eligibility?.eligible || startFinalTestMutation.isPending}
                  className="w-full py-4 bg-blue-600 text-white text-lg font-bold rounded-2xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 disabled:opacity-50 disabled:hover:shadow-none transition-all flex justify-center items-center gap-2"
                >
                  {startFinalTestMutation.isPending && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                  {startFinalTestMutation.isPending ? 'Đang khởi tạo...' : 'Bắt Đầu Làm Bài'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ================= FULLSCREEN TEST MODE =================
  if (isTakingTest && attemptId && !submitFinalTestMutation.data) {
    return (
      <div className="fixed inset-0 bg-[#f8fafc] z-50 flex flex-col font-sans">
        {/* Modern Test Header */}
        <header className="bg-white border-b border-slate-200 px-6 sm:px-10 py-4 flex justify-between items-center shrink-0 z-20 shadow-sm">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight truncate">{course?.title}</h1>
            <p className="text-xs font-medium text-slate-400 mt-0.5">Bài thi cuối khóa</p>
          </div>
          <div className={`flex items-center gap-2.5 px-4 py-2 rounded-lg font-mono font-bold text-lg tracking-wider transition-colors ${timeLeft !== null && timeLeft < 300 ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
          </div>
        </header>

        {isLoadingFinalTest ? (
          <div className="flex-1 flex flex-col items-center justify-center">
             <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
             <p className="text-slate-500 font-bold">Đang chuẩn bị đề thi...</p>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Questions List */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-12 relative">
              <div className="max-w-3xl mx-auto space-y-8 pb-32">
                {finalTestContent?.questions.map((q, qIndex) => (
                  <div key={q.id} id={`question-${q.id}`} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm scroll-mt-8">
                    <div className="flex gap-4 mb-6">
                      <span className="flex-shrink-0 text-slate-400 font-black text-lg pt-0.5">{qIndex + 1}.</span>
                      <p className="font-bold text-slate-900 text-lg leading-snug">{q.content}</p>
                    </div>
                    <div className="space-y-3 pl-0 sm:pl-9">
                      {q.choices.map((choice) => (
                        <label key={choice.id} className={`flex items-center space-x-4 p-4 rounded-xl cursor-pointer border-2 transition-all duration-200 ${finalTestAnswers[q.id] === choice.id ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-slate-300 bg-white'}`}>
                          <div className={`relative flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${finalTestAnswers[q.id] === choice.id ? 'border-blue-600' : 'border-slate-300'}`}>
                            {finalTestAnswers[q.id] === choice.id && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>}
                            <input type="radio" name={`final-test-${q.id}`} value={choice.id} className="hidden" onChange={() => handleFinalTestOptionChange(q.id, choice.id)} />
                          </div>
                          <span className={`text-[15px] ${finalTestAnswers[q.id] === choice.id ? 'font-bold text-blue-900' : 'font-medium text-slate-700'}`}>
                            {choice.content}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Grid Navigator Panel */}
            <div className="w-80 bg-white border-l border-slate-200 flex-shrink-0 flex flex-col z-10 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900">Bảng điều hướng</h3>
                <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Hoàn thành</span>
                  <span className="text-slate-900">{Object.keys(finalTestAnswers).length} / {finalTestContent?.questions.length}</span>
                </div>
                <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${Object.keys(finalTestAnswers).length / (finalTestContent?.questions.length || 1) * 100}%` }}></div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-5 gap-2.5">
                  {finalTestContent?.questions.map((q, qIndex) => {
                    const isAnswered = !!finalTestAnswers[q.id];
                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          document.getElementById(`question-${q.id}`)?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`aspect-square rounded-lg text-xs font-bold transition-all border ${
                          isAnswered 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {qIndex + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <button 
                  onClick={handleSubmitFinalTest}
                  disabled={submitFinalTestMutation.isPending}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
                >
                  {submitFinalTestMutation.isPending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                  {submitFinalTestMutation.isPending ? 'Đang xử lý...' : 'Nộp Bài Thi'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= DEFAULT LEARNING LAYOUT =================
  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      {renderSidebar()}
      {renderContentArea()}
    </div>
  );
};
