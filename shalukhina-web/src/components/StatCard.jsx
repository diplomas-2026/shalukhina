import React from 'react';
import { Paper, Stack, Typography } from '@mui/material';

export function StatCard({ title, value, hint, accent }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        background: accent || 'linear-gradient(180deg, #ffffff, #f8fbfb)',
        minHeight: 120,
      }}
    >
      <Stack spacing={1}>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h4">{value}</Typography>
        <Typography variant="body2" color="text.secondary">
          {hint}
        </Typography>
      </Stack>
    </Paper>
  );
}
