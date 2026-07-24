import { useState } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Button, Tooltip, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import DescriptionIcon from '@mui/icons-material/Description';
import QuizIcon from '@mui/icons-material/Quiz';
import StyleIcon from '@mui/icons-material/Style';
import EditNoteIcon from '@mui/icons-material/EditNote';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';
import type { PublicModule, PublicLessonBlock } from '../types/courseDetailTypes';

interface CurriculumAccordionProps {
  modules: PublicModule[];
  courseId: string;
  showAiChatAction: boolean;
}

export const CurriculumAccordion = ({ modules, courseId, showAiChatAction }: CurriculumAccordionProps) => {
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const handleToggleAccordion = (id: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExpandAll = () => {
    const newState: Record<string, boolean> = {};
    modules.forEach((m) => (newState[m.id] = true));
    setExpandedModules(newState);
  };

  const handleCollapseAll = () => {
    setExpandedModules({});
  };

  const isAllExpanded = modules.length > 0 && modules.every((m) => expandedModules[m.id]);

  const getBlockIcon = (type: PublicLessonBlock['type']) => {
    switch (type) {
      case 'VIDEO':
        return <OndemandVideoIcon fontSize="small" className="text-slate-500 mr-3" />;
      case 'TEXT':
        return <DescriptionIcon fontSize="small" className="text-slate-500 mr-3" />;
      case 'QUIZ':
        return <QuizIcon fontSize="small" className="text-slate-500 mr-3" />;
      case 'FLASHCARD':
        return <StyleIcon fontSize="small" className="text-slate-500 mr-3" />;
      case 'WRITING':
        return <EditNoteIcon fontSize="small" className="text-slate-500 mr-3" />;
      default:
        return <OndemandVideoIcon fontSize="small" className="text-slate-500 mr-3" />;
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        {isAllExpanded ? (
          <button
            onClick={handleCollapseAll}
            className="flex items-center text-sm font-semibold text-red-600 hover:text-red-800 transition-colors"
          >
            <UnfoldLessIcon fontSize="small" className="mr-1" />
            Thu gọn tất cả
          </button>
        ) : (
          <button
            onClick={handleExpandAll}
            className="flex items-center text-sm font-semibold text-red-600 hover:text-red-800 transition-colors"
          >
            <UnfoldMoreIcon fontSize="small" className="mr-1" />
            Mở rộng tất cả
          </button>
        )}
      </div>

      <div className="space-y-4">
        {modules.map((module, index) => (
          <Accordion
            key={module.id}
            expanded={!!expandedModules[module.id]}
            onChange={() => handleToggleAccordion(module.id)}
            disableGutters
            elevation={0}
            className="border border-slate-200/60 rounded-xl overflow-hidden shadow-sm before:hidden hover:shadow-md transition-shadow bg-white"
            sx={{
              '&:first-of-type': { borderTopLeftRadius: '12px', borderTopRightRadius: '12px' },
              '&:last-of-type': { borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon className="text-slate-400" />}
              className={`transition-colors px-6 py-1 ${expandedModules[module.id] ? 'bg-slate-50' : 'bg-white hover:bg-slate-50/50'}`}
            >
              <Typography className="font-bold text-slate-800 text-base">
                Phần {index + 1}: {module.title}
              </Typography>
            </AccordionSummary>
            <AccordionDetails className="p-0 border-t border-slate-100 bg-white">
              <div className="flex flex-col">
                {module.blocks.map((block, blockIndex) => {
                  const isFirstLesson = index === 0 && blockIndex === 0;
                  return (
                    <div key={block.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 px-6 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0 group gap-3">
                      <div className="flex items-start sm:items-center">
                        <div className="mt-0.5 sm:mt-0">{getBlockIcon(block.type)}</div>
                        <span className="text-sm font-medium text-slate-700 group-hover:text-red-700 transition-colors">{block.title}</span>
                      </div>
                      <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 sm:ml-3 pl-8 sm:pl-0">
                        {isFirstLesson && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md border border-emerald-200 cursor-pointer hover:bg-emerald-200 transition-colors">
                            👁️ Học thử miễn phí
                          </span>
                        )}
                        {block.durationMinutes ? (
                          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                            ⏱️ {block.durationMinutes} phút
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                            📄 1 tài liệu
                          </span>
                        )}
                        {showAiChatAction && (
                          <Tooltip title="Ask the AI assistant about this lesson">
                            <Button
                              component={Link}
                              to={ROUTES.STUDENT.AI_CHAT(courseId, block.id)}
                              size="small"
                              startIcon={<SmartToyOutlinedIcon />}
                              onClick={(event) => event.stopPropagation()}
                              sx={{ minWidth: 96, textTransform: 'none' }}
                            >
                              Ask AI
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  );
                })}
                {module.blocks.length === 0 && (
                  <div className="py-4 px-6 text-sm text-slate-400 italic text-center">
                    Chưa có nội dung bài giảng
                  </div>
                )}
              </div>
            </AccordionDetails>
          </Accordion>
        ))}
      </div>
    </div>
  );
};
