// Campaign Footer - Replicates Footer for campaign dashboards

import React from 'react';

interface CampaignFooterProps {
  campaignName: string;
}

export function CampaignFooter({ campaignName }: CampaignFooterProps) {
  return (
    <footer className="bg-white border-t border-gray-200 py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <p>© 2024 Lighthouse Media Cashbook - {campaignName}</p>
            <span className="hidden sm:inline">|</span>
            <p className="hidden sm:inline">Campaign Management System</p>
          </div>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <p>Powered by Lighthouse Media</p>
            <span>|</span>
            <p>Created by Cyrus Maboshe</p>
            <span>|</span>
            <p>09-7602-9651</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
