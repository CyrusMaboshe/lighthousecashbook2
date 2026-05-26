
import React from 'react';

interface TopBarProps {
  userName?: string;
  userRole?: string;
}

export function TopBar({ userName, userRole }: TopBarProps) {
  // Return null to completely hide the top bar and remove all header text
  return null;
}
