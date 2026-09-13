import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  CloudinaryAsset,
  CloudinaryConfigStatus,
  CloudinaryCostConfig,
  CloudinaryUsageEstimate,
} from '../types';
import {
  fetchCloudinaryStatus,
  fetchCloudinaryRecordings,
  deleteCloudinaryRecording,
  batchDeleteRecordings,
  getStoredCostConfig,
  saveStoredCostConfig,
  calculateUsageEstimate,
  DEFAULT_COST_CONFIG,
} from '../utils/cloudinary';

interface CloudinaryContextType {
  status: CloudinaryConfigStatus;
  recordings: CloudinaryAsset[];
  isLoading: boolean;
  costConfig: CloudinaryCostConfig;
  usageEstimate: CloudinaryUsageEstimate;
  refreshRecordings: () => Promise<void>;
  deleteRecording: (publicId: string) => Promise<boolean>;
  purgeScratchTakes: () => Promise<number>;
  updateCostConfig: (newConfig: Partial<CloudinaryCostConfig>) => void;
  selectedAsset: CloudinaryAsset | null;
  setSelectedAsset: (asset: CloudinaryAsset | null) => void;
}

const CloudinaryContext = createContext<CloudinaryContextType | null>(null);

export const CloudinaryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<CloudinaryConfigStatus>({ configured: false });
  const [recordings, setRecordings] = useState<CloudinaryAsset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [costConfig, setCostConfig] = useState<CloudinaryCostConfig>(getStoredCostConfig());
  const [selectedAsset, setSelectedAsset] = useState<CloudinaryAsset | null>(null);

  const [usageEstimate, setUsageEstimate] = useState<CloudinaryUsageEstimate>(
    calculateUsageEstimate([])
  );

  const refreshRecordings = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statusRes, recordingsRes] = await Promise.all([
        fetchCloudinaryStatus(),
        fetchCloudinaryRecordings(),
      ]);
      setStatus(statusRes);
      setRecordings(recordingsRes.recordings);
      setUsageEstimate(calculateUsageEstimate(recordingsRes.recordings));

      if (recordingsRes.recordings.length > 0) {
        setSelectedAsset((prev) => prev || recordingsRes.recordings[0]);
      }
    } catch (err) {
      console.error('Failed to load Cloudinary data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshRecordings();
  }, [refreshRecordings]);

  const deleteRecording = async (publicId: string): Promise<boolean> => {
    const success = await deleteCloudinaryRecording(publicId);
    if (success) {
      setRecordings((prev) => {
        const next = prev.filter((r) => r.publicId !== publicId);
        setUsageEstimate(calculateUsageEstimate(next));
        return next;
      });
      if (selectedAsset?.publicId === publicId) {
        setSelectedAsset(null);
      }
    }
    return success;
  };

  const purgeScratchTakes = async (): Promise<number> => {
    // Identify test scratch takes shorter than 5 seconds
    const scratchTakes = recordings.filter((r) => r.duration > 0 && r.duration < 6);
    if (scratchTakes.length === 0) return 0;

    const idsToDelete = scratchTakes.map((r) => r.publicId);
    const deletedCount = await batchDeleteRecordings(idsToDelete);
    if (deletedCount > 0) {
      await refreshRecordings();
    }
    return deletedCount;
  };

  const updateCostConfig = (newConfig: Partial<CloudinaryCostConfig>) => {
    setCostConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      saveStoredCostConfig(updated);
      return updated;
    });
  };

  return (
    <CloudinaryContext.Provider
      value={{
        status,
        recordings,
        isLoading,
        costConfig,
        usageEstimate,
        refreshRecordings,
        deleteRecording,
        purgeScratchTakes,
        updateCostConfig,
        selectedAsset,
        setSelectedAsset,
      }}
    >
      {children}
    </CloudinaryContext.Provider>
  );
};

export function useCloudinary() {
  const context = useContext(CloudinaryContext);
  if (!context) {
    throw new Error('useCloudinary must be used within a CloudinaryProvider');
  }
  return context;
}
