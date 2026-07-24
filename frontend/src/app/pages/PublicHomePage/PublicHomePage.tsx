import React from 'react';
import { Box } from '@mui/material';
import { LandingHeader } from './LandingHeader';
import { HeroSection } from './HeroSection';
import { TopCategories } from './TopCategories';
import { BestSellingCourses } from './BestSellingCourses';
import { FeaturesSection } from './FeaturesSection';
import { TopInstructorsSection } from './TopInstructorsSection';
import { BecomeTeacherBanner } from './BecomeTeacherBanner';
import { FloatingMascot } from './FloatingMascot';
import { LandingFooter } from './LandingFooter';

export const PublicHomePage: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#FBF9F5' }}>
      <LandingHeader />

      <Box component="main" sx={{ flexGrow: 1 }}>
        <HeroSection />
        <TopCategories />
        <BestSellingCourses />
        <FeaturesSection />
        <TopInstructorsSection />
        <BecomeTeacherBanner />
      </Box>

      <LandingFooter />
      <FloatingMascot />
    </Box>
  );
};
