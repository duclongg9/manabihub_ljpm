import React from 'react';
import { Box } from '@mui/material';
import { LandingHeader } from './LandingHeader';
import { HeroSection } from './HeroSection';
import { TopCategories } from './TopCategories';
import { BestSellingCourses } from './BestSellingCourses';
import { FeaturesSection } from './FeaturesSection';
import { BecomeTeacherBanner } from './BecomeTeacherBanner';
import { LandingFooter } from './LandingFooter';

export const PublicHomePage: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#ffffff' }}>
      <LandingHeader />
      
      <Box component="main" sx={{ flexGrow: 1 }}>
        <HeroSection />
        <TopCategories />
        <BestSellingCourses />
        <FeaturesSection />
        <BecomeTeacherBanner />
      </Box>

      <LandingFooter />
    </Box>
  );
};
