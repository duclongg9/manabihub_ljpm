import { useState } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import DescriptionIcon from '@mui/icons-material/Description';
import QuizIcon from '@mui/icons-material/Quiz';
import StyleIcon from '@mui/icons-material/Style';
import EditNoteIcon from '@mui/icons-material/EditNote';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import type { PublicModule, PublicLessonBlock } from '../types/courseDetailTypes';

interface CurriculumAccordionProps {
  modules: PublicModule[];
}

export const CurriculumAccordion = ({ modules }: CurriculumAccordionProps) => {
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
            className="flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <UnfoldLessIcon fontSize="small" className="mr-1" />
            Thu gọn tất cả
          </button>
        ) : (
          <button 
            onClick={handleExpandAll}
            className="flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
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
            className="border border-slate-200/60 rounded-xl overflow-hidden shadow-sm before:hidden hover:shadow-md transition-shadow"
            sx={{
              '&:first-of-type': { borderTopLeftRadius: '12px', borderTopRightRadius: '12px' },
              '&:last-of-type': { borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon className="text-slate-400" />}
              className={`transition-colors px-6 py-1 ${expandedModules[module.id] ? 'bg-indigo-50/50' : 'bg-slate-50/50 hover:bg-slate-100/50'}`}
            >
              <Typography className="font-bold text-slate-800 text-base">
                Phần {index + 1}: {module.title}
              </Typography>
            </AccordionSummary>
            <AccordionDetails className="p-0 border-t border-slate-100">
              <div className="flex flex-col">
                {module.blocks.map((block) => (
                  <div key={block.id} className="flex items-center justify-between py-4 px-6 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0 group">
                    <div className="flex items-center">
                      {getBlockIcon(block.type)}
                      <span className="text-sm text-slate-700 group-hover:text-indigo-700 transition-colors">{block.title}</span>
                    </div>
                    {block.durationMinutes && (
                      <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{block.durationMinutes} phút</span>
                    )}
                  </div>
                ))}
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
