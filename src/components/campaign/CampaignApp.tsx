// Campaign App - Main entry point for campaign system
// This manages the flow from campaign selection to campaign dashboard

import React, { useState } from 'react';
import { CampaignSelector } from './CampaignSelector';
import { CampaignDashboard } from './CampaignDashboard';

export function CampaignApp() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedCampaignName, setSelectedCampaignName] = useState<string>('');

  // Debug: Log current state
  console.log('🎯 CampaignApp state:', { selectedCampaignId, selectedCampaignName });

  const handleCampaignSelect = (campaignId: string, campaignName: string) => {
    console.log('🎯 Campaign selected:', { campaignId, campaignName });
    console.log('🔄 Setting campaign state...');
    setSelectedCampaignId(campaignId);
    setSelectedCampaignName(campaignName);
    console.log('✅ Campaign state set');
  };

  const handleBackToCampaigns = () => {
    setSelectedCampaignId(null);
    setSelectedCampaignName('');
  };

  // Show campaign selector if no campaign is selected
  if (!selectedCampaignId) {
    return <CampaignSelector onCampaignSelect={handleCampaignSelect} />;
  }

  // Show campaign dashboard for selected campaign
  return (
    <CampaignDashboard 
      campaignId={selectedCampaignId}
      campaignName={selectedCampaignName}
      onBackToCampaigns={handleBackToCampaigns}
    />
  );
}
