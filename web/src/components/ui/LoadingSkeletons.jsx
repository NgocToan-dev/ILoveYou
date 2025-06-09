import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Grid,
  Stack
} from '@mui/material';

// Note Card Skeleton
export const NoteCardSkeleton = () => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="100%" height={20} />
      <Skeleton variant="text" width="80%" height={20} />
      <Skeleton variant="text" width="40%" height={20} sx={{ mb: 2 }} />
      
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Skeleton variant="rounded" width={60} height={24} />
        <Skeleton variant="rounded" width={80} height={24} />
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton variant="text" width={120} height={16} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// Reminder Card Skeleton
export const ReminderCardSkeleton = () => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="70%" height={24} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="50%" height={20} />
        </Box>
      </Box>
      
      <Skeleton variant="text" width="100%" height={20} />
      <Skeleton variant="text" width="60%" height={20} sx={{ mb: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton variant="rounded" width={80} height={24} />
        <Skeleton variant="rounded" width={60} height={32} />
      </Box>
    </CardContent>
  </Card>
);

// Profile Card Skeleton
export const ProfileCardSkeleton = () => (
  <Card>
    <CardContent sx={{ textAlign: 'center' }}>
      <Skeleton variant="circular" width={100} height={100} sx={{ mx: 'auto', mb: 2 }} />
      <Skeleton variant="text" width="60%" height={28} sx={{ mx: 'auto', mb: 1 }} />
      <Skeleton variant="text" width="40%" height={20} sx={{ mx: 'auto', mb: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
        <Skeleton variant="rounded" width={80} height={36} />
        <Skeleton variant="rounded" width={80} height={36} />
      </Box>
      
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton variant="text" width="40%" height={20} />
          <Skeleton variant="text" width="30%" height={20} />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton variant="text" width="35%" height={20} />
          <Skeleton variant="text" width="40%" height={20} />
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

// Love Days Counter Skeleton
export const LoveDaysCounterSkeleton = () => (
  <Card sx={{ 
    background: 'linear-gradient(45deg, #e91e63 30%, #f06292 90%)',
    color: 'white'
  }}>
    <CardContent sx={{ textAlign: 'center' }}>
      <Skeleton 
        variant="text" 
        width="40%" 
        height={32} 
        sx={{ mx: 'auto', mb: 1, bgcolor: 'rgba(255,255,255,0.2)' }} 
      />
      <Skeleton 
        variant="text" 
        width="60%" 
        height={48} 
        sx={{ mx: 'auto', mb: 1, bgcolor: 'rgba(255,255,255,0.2)' }} 
      />
      <Skeleton 
        variant="text" 
        width="30%" 
        height={20} 
        sx={{ mx: 'auto', bgcolor: 'rgba(255,255,255,0.2)' }} 
      />
    </CardContent>
  </Card>
);

// Navigation Skeleton
export const NavigationSkeleton = () => (
  <Box sx={{ p: 2 }}>
    <Skeleton variant="text" width="50%" height={24} sx={{ mb: 3 }} />
    
    <Stack spacing={2}>
      {[...Array(5)].map((_, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
          <Skeleton variant="circular" width={24} height={24} sx={{ mr: 2 }} />
          <Skeleton variant="text" width="70%" height={20} />
        </Box>
      ))}
    </Stack>
  </Box>
);

// Page Content Skeleton
export const PageContentSkeleton = ({ type = 'default' }) => {
  switch (type) {
    case 'notes':
      return (
        <Box>
          <Skeleton variant="text" width="30%" height={32} sx={{ mb: 3 }} />
          {[...Array(3)].map((_, index) => (
            <NoteCardSkeleton key={index} />
          ))}
        </Box>
      );
      
    case 'reminders':
      return (
        <Box>
          <Skeleton variant="text" width="35%" height={32} sx={{ mb: 3 }} />
          {[...Array(3)].map((_, index) => (
            <ReminderCardSkeleton key={index} />
          ))}
        </Box>
      );
      
    case 'profile':
      return (
        <Box>
          <Skeleton variant="text" width="25%" height={32} sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ProfileCardSkeleton />
            </Grid>
            <Grid item xs={12} md={6}>
              <LoveDaysCounterSkeleton />
            </Grid>
          </Grid>
        </Box>
      );
      
    case 'home':
      return (
        <Box>
          <LoveDaysCounterSkeleton />
          <Box sx={{ mt: 3 }}>
            <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <NoteCardSkeleton />
              </Grid>
              <Grid item xs={12} md={6}>
                <ReminderCardSkeleton />
              </Grid>
            </Grid>
          </Box>
        </Box>
      );
      
    default:
      return (
        <Box>
          <Skeleton variant="text" width="40%" height={32} sx={{ mb: 3 }} />
          <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="100%" height={20} />
          <Skeleton variant="text" width="80%" height={20} />
          <Skeleton variant="text" width="60%" height={20} />
        </Box>
      );
  }
};

// Search Results Skeleton
export const SearchResultsSkeleton = () => (
  <Box>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Skeleton variant="rounded" width={200} height={40} sx={{ mr: 2 }} />
      <Skeleton variant="circular" width={40} height={40} />
    </Box>
    
    <Skeleton variant="text" width="30%" height={20} sx={{ mb: 2 }} />
    
    {[...Array(5)].map((_, index) => (
      <Card key={index} sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="70%" height={20} sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width="50%" height={16} />
            </Box>
          </Box>
        </CardContent>
      </Card>
    ))}
  </Box>
);

// Modal Content Skeleton
export const ModalContentSkeleton = () => (
  <Box sx={{ p: 3 }}>
    <Skeleton variant="text" width="60%" height={28} sx={{ mb: 3 }} />
    
    <Stack spacing={3}>
      <Box>
        <Skeleton variant="text" width="30%" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="rounded" width="100%" height={56} />
      </Box>
      
      <Box>
        <Skeleton variant="text" width="25%" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="rounded" width="100%" height={120} />
      </Box>
      
      <Box>
        <Skeleton variant="text" width="35%" height={20} sx={{ mb: 1 }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rounded" width={80} height={32} />
          <Skeleton variant="rounded" width={100} height={32} />
        </Box>
      </Box>
    </Stack>
    
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
      <Skeleton variant="rounded" width={80} height={36} />
      <Skeleton variant="rounded" width={100} height={36} />
    </Box>
  </Box>
);

// List Skeleton (generic)
export const ListSkeleton = ({ count = 5, height = 60 }) => (
  <Stack spacing={1}>
    {[...Array(count)].map((_, index) => (
      <Box key={index} sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="80%" height={20} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="60%" height={16} />
        </Box>
        <Skeleton variant="rounded" width={60} height={32} />
      </Box>
    ))}
  </Stack>
);

export default {
  NoteCardSkeleton,
  ReminderCardSkeleton,
  ProfileCardSkeleton,
  LoveDaysCounterSkeleton,
  NavigationSkeleton,
  PageContentSkeleton,
  SearchResultsSkeleton,
  ModalContentSkeleton,
  ListSkeleton
};