import { AppShell } from '../components/layout/AppShell';
import { CreativeResultsGrid } from '../components/CreativeResultsGrid';
import { useCampaignStore } from '../store/useCampaignStore';
import { useParams } from 'react-router-dom';
import { useEffect } from 'react';

export const CampaignResultsPage = () => {
    const { id } = useParams();
    const { creatives, fetchCampaignDetails } = useCampaignStore();

    // Verify data presence
    useEffect(() => {
        // If we have an ID but no creatives, try to fetch (Persistence check)
        if (id && (!creatives || creatives.length === 0)) {
            fetchCampaignDetails(id);
            // Note: fetchCampaignDetails logic in store might need detailed implementation for 'creatives' specifically
        }
    }, [id, creatives, fetchCampaignDetails]);

    // Safety: If strictly no creatives and not loading, maybe redirect? 
    // But user asked "DO NOT redirect away". So show empty state or loading.

    return (
        <AppShell>
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-white">Campaign Results</h1>
                    <p className="text-slate-400">ID: {id}</p>
                </div>
                <CreativeResultsGrid />
            </div>
        </AppShell>
    );
};
